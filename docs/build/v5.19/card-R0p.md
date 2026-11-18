# Card R0p: Prettier, one formatting commit (v5.19, lane E)

**Goal:** the whole tree formatted once by Prettier. **Only whitespace and line breaks change.** Decided by Julien on 2026-11-18.

Run this card alone: no other programmer or writer may have files open.

## Files
- Own: `.prettierrc.json` (new), `.prettierignore` (new), `package.json` (`format` and `format:check` scripts, the `prettier` dev dependency), `.github/workflows/ci.yml` (add one step), and every file Prettier rewrites.

## Steps
- [ ] **1. Config.** `{ "printWidth": 160, "singleQuote": true, "trailingComma": "all", "semi": true }`. Ignore `node_modules`, `screenshots`, `assets`, `marketing`, `site`, `tools/audio/BANK`, `package-lock.json`, `docs/**` and `*.md`. Prettier runs on `src/**`, `scripts/**/*.ts` and the root `*.js`/`*.ts` configs.
- [ ] **2. Format.** `npx prettier --write` over those paths. Don't hand-edit anything.
- [ ] **3. Prove it's whitespace only.** `npx tsc --noEmit` and the full `npm test` pass with the same counts as before. Also, `git diff -w --stat | tail -3` must show almost nothing; explain any non-whitespace hunk, such as added parentheses or a moved comment.
- [ ] **4. CI.** Add a `npx prettier --check` step after tsc in `ci.yml`.

## Orchestrator, after DONE
Commit the formatting by itself (`style: Prettier, whitespace only`). Then add its full hash to `.git-blame-ignore-revs` (new file) with a comment line, and commit that separately.

## Checks
`npx tsc --noEmit`; `npm test`; `npx prettier --check <paths>`.
