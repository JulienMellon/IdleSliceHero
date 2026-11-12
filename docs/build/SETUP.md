# Setup (one session, once)

Run these in the repo root, then end the session. Agent briefs load at session start, so the new ones only exist in the next session.

## 1. Place the folder and the briefs
```
ls docs/build/README.md                       # the folder must already be at docs/build/
cp docs/build/agents/writer.md .claude/agents/writer.md
sed -i 's/^tools: Read, Glob, Grep, Bash$/tools: Read, Glob, Grep, Bash, Write/' .claude/agents/critic.md .claude/agents/codecritic.md
sed -i 's/^tools: Read, Glob, Grep$/tools: Read, Glob, Grep, Write/' .claude/agents/storycritic.md .claude/agents/audiocritic.md
for a in critic codecritic storycritic audiocritic; do cat docs/build/agents/critic-output-rule.md >> .claude/agents/$a.md; done
grep -c "Review file (build-plan rule)" .claude/agents/*critic.md | tail -4     # expect four lines ending :1
grep -n "^tools:" .claude/agents/*critic.md | tail -4                           # each must end with Write
```

## 2. Point HANDOFF.md at this folder (prepend, don't read)
```
printf '%s\n\n' "> **2026-11-11: the build loop now runs from \`docs/build/\`. Start at \`docs/build/README.md\`, then \`docs/build/STATE.md\`. The sections below are history and lessons.**" | cat - HANDOFF.md > /tmp/h && mv /tmp/h HANDOFF.md
```

## 3. Specs that are not in the repo yet
**Done 2026-11-12:** all five files below are in the repo (`docs/story/STORY-v4-final.md`, `docs/specs/*.md`). Check with `ls docs/story/STORY-v4-final.md docs/specs/` and skip to section 4.

These are needed later. Each is a one-time export; do it in this session if the tools are available, otherwise list what is missing in STATE `next:` for Julien.

| Needed before | Target path | Source |
| --- | --- | --- |
| v5.16 wave 2 | `docs/story/STORY-v4-final.md` | Claude Doc "Slice Empire — Story Update: The Todd B-Plot" (https://claude.ai/artifact/SYTCpyiEZUtQpSY4MJAMiy). Export as Markdown. |
| v5.16 wave 2 | `docs/specs/PLAN-v4.4-todd-interludes.md` | Already in this folder: `cp docs/build/specs/PLAN-v4.4-todd-interludes.md docs/specs/` |
| v5.17 wave 2 | `docs/specs/PRIVACY-POLICY-DRAFT.md`, `docs/specs/APP-PRIVACY-LABEL-AND-AGE-RATING.md` | Project docs `claude/PRIVACY-POLICY-DRAFT.md`, `claude/APP-PRIVACY-LABEL-AND-AGE-RATING.md` |
| v5.18 wave 2 | `docs/specs/PRESTIGE.md` | Claude Doc "Franchise to Boston — Prestige Design (Slice Empire)" (https://claude.ai/artifact/9uMDJs6y6gEJEau4FHx6aX). Export as Markdown. |

```
mkdir -p docs/specs && cp docs/build/specs/*.md docs/specs/
```
If you export a doc here, write it straight to its file and do not print it.

## 4. Commit
```
git config user.name "Julien Mellon"
git config user.email "$(grep -o 'user.email="[^"]*"' HANDOFF.md | head -1 | cut -d'"' -f2)"
git add -A && git commit -q -m "Build plan v5.14-v5.19: docs/build, writer agent, critic review-file rule" -m "<this session's attribution lines>"
git fetch -q origin main && git rebase -q origin/main && git push -q origin main; git log -1 --format=%h
```
Set STATE: `step: waves`, `next: v5.14 wave 1 (B3 + R3)`. End the session.
