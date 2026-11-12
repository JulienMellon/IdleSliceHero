# Card C3 — golden pizza and special orders, fix round (v5.14, lane U)

Your card text is already in the repo. Read exactly this range and nothing else from that file:
```
sed -n '13,39p' docs/PLAN-v5.14-retention.md
```
It gives the notes (G93, G94, D436, D437, D441, D444, D438, D442, D443, D445, D446, D422), the files and the checks.

## Additions
- Card R3 has already landed. It added lines to `store/game-store.ts`, `app/index.tsx`, `content/hooks.ts` and fixtures 51–55. Re-read each shared file before editing and keep R3's lines.
- The cooks' cheer for D444 uses the pulse named in your spawn prompt. If the prompt says "none", ship D444 without the cheer and say so in the report.

## Progress (append one line per note ID as its check passes)
- [x] G93 — popPlace clamp + drop below box (engine/bonus.ts, tested)
- [x] G94 — toast cleared on leaving Home and City (app/index.tsx, app/city.tsx)
- [x] D436 — glow behind content, 20 pt #2E7D32 reward, 5 coins + payout + cheer, portrait bounce 1.15
- [x] D437 — 1.3x/1.6x, gradient, glow, 3 sparkles, rays, LUCKY tag
- [x] D441 — reward under Accept, draining expiry bar
- [x] D444 — full-width banner 1.2 s, 10 coins, payout kick, emitCheer()
- [x] D438 — 8 pt slice pips + "4/5"
- [x] D442 — "tap to rush!" when behind pace
- [x] D443 — "Well done, sailor."
- [x] D445 — first pizza 2 s after unlock (spawned===0) + "A gift, caro. Tap it!" label on the pizza
- [x] D446 — "+45 s of sales" second line
- [x] D422 — fixtures 47-50 use mid-game suburbs (target 1,100), plus 47a gift shot
- checks: tsc pass; jest engine/content/components/scene pass (633); py_compile pass
