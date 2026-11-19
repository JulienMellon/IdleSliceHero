#!/usr/bin/env bash
# X1 (v5.19-test): the leak check, run by `npm run check:no-test-mode` and by CI on every push. Exits 1 with a one-line reason when:
#   (c) a .env* file at the repo root, or eas.json's production profile, sets EXPO_PUBLIC_TEST_MODE;
#   (a) a normal web export contains the panel's marker string;
#   (b) a normal iOS export (the bundle the App Store build is made from) contains it, or an iOS export WITH the switch does not (the phone test build).
# The marker is the panel's header, "TEST MODE PANEL" (src/dev/panel.tsx). Bundles are searched with grep -a: the iOS one is Hermes bytecode.
set -u
cd "$(dirname "$0")/.."
MARK="TEST MODE PANEL"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

fail() {
  echo "check-no-test-mode: FAIL: $1" >&2
  exit 1
}

# an export with the switch off (env -u: a variable left in the shell must not count) or on; --clear because Metro's cache may hold the other kind
export_to() { # <on|off> <platform> <dir>
  local log="$TMP/$2-$1.log"
  if [ "$1" = on ]; then
    EXPO_PUBLIC_TEST_MODE=1 npx expo export --clear --platform "$2" --output-dir "$3" >"$log" 2>&1
  else
    env -u EXPO_PUBLIC_TEST_MODE npx expo export --clear --platform "$2" --output-dir "$3" >"$log" 2>&1
  fi || {
    tail -n 5 "$log" >&2
    fail "the $2 export (switch $1) did not finish"
  }
}

# (c) no file in the repo turns the switch on for a release
reason=$(node -e '
const fs = require("fs");
const S = "EXPO_PUBLIC_TEST_MODE";
for (const f of fs.readdirSync(".")) {
  if ((f === ".env" || f.startsWith(".env.")) && fs.readFileSync(f, "utf8").includes(S)) { console.log(f + " sets " + S); process.exit(1); }
}
if (fs.existsSync("eas.json")) {
  const build = JSON.parse(fs.readFileSync("eas.json", "utf8")).build || {};
  const seen = [];
  for (let n = "production"; n && !seen.includes(n) && build[n]; n = build[n].extends) {
    seen.push(n);
    if (build[n].env && S in build[n].env) { console.log("eas.json profile " + n + " (the production chain) sets " + S); process.exit(1); }
  }
}
') || fail "a release path turns the test switch on: $reason"

# (a) the normal web export
export_to off web "$TMP/web"
if grep -rlaF "$MARK" "$TMP/web" >/dev/null 2>&1; then fail "the normal web export contains '$MARK'"; fi

# (b) the normal iOS export has none; the iOS export with the switch has it
export_to off ios "$TMP/ios"
if grep -rlaF "$MARK" "$TMP/ios" >/dev/null 2>&1; then fail "the normal iOS export (the App Store bundle) contains '$MARK'"; fi
export_to on ios "$TMP/ios-test"
if ! grep -rlaF "$MARK" "$TMP/ios-test" >/dev/null 2>&1; then fail "the iOS export with EXPO_PUBLIC_TEST_MODE=1 has no '$MARK' (a phone test build would have no panel)"; fi

echo "check-no-test-mode: ok (web and iOS exports clean without the switch; iOS export has the panel with it; no .env* or eas.json production switch)"
