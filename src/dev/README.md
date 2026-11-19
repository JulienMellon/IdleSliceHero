# src/dev: the test build (docs/PLAN-test-mode.md, docs/build/v5.19-test/)
The Test panel and its cheats live here and ship only in a build made with `EXPO_PUBLIC_TEST_MODE=1` (`npm run export:test` for the web one).
**The strip rule.** Metro collects a `require()` before it folds a constant it only imported, so a guard through `TEST_MODE` still bundles the panel.
Any file outside `src/dev/` that needs something here writes the comparison out in full, in that file:
`if (process.env.EXPO_PUBLIC_TEST_MODE === '1') { X = require('../dev/panel').X; }`. Expo inlines the variable, the branch folds to `if (false)`
and the require is never collected. The one static import allowed is `src/dev/test-mode.ts` (a constant, no UI).
`source-guard.test.ts` fails any other import, and `npm run check:no-test-mode` (CI, every push) greps the normal web and iOS bundles for `TEST MODE PANEL`.
**A new section.** Append one entry to `PANEL_SECTIONS` in `panel-sections.ts` (`{ id, title, Body }`; `Body` is a component with the rows). Do not touch
`panel.tsx`. Engine-side cheat state is a module variable in the engine file with a setter that does nothing unless the same literal check holds.
Test saves use `slice-empire/save/test-v1` and `slice-empire/store/test-v1`; nothing here may write the v1 keys.
