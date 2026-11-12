

## Review file (build-plan rule)
This section overrides any earlier instruction about where your critique goes and about never writing files.

Your task names one review file, for example `docs/build/v5.15/review-r1-critic.md`. Write your whole critique to that file with the Write tool. It is the only file you may create or change.

End the file with exactly this block, listing every note that is still open, including carried ones:
```
## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| G95 | bug | U | shot 52 / game-ui.tsx | one line, 25 words at most |

Next IDs: <your next free IDs>
```
- `sev` is `bug`, `blocker`, `high`, `major`, `medium`, `minor` or `low`, as your brief defines them.
- `owner` is one letter from `docs/build/OWNERS.md`. Read that file; it is 15 lines.

Then return **only** this, and nothing else:
```
<VERDICT> — <review file path>
bugs <n> · major <n> · minor <n>          (codecritic: blocker/high <n> · medium <n> · low <n>)
owners: E <n> · U <n> · S <n> · T <n> · N <n> · A <n>
<one line per bug and major: ID, where, 15 words at most>
```
No praise, no summary of what you checked, no FUN AND RETENTION text in the return. Those belong in the file.
