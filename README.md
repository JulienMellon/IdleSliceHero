# IdleSliceHero

A mobile idle game about building a pizza delivery empire, from one failing shop to every neighborhood in the city and then new cities. Built with Expo / React Native.

Working title: **Slice Empire**.

## Docs

- [Game design doc](docs/DESIGN.md) — core loop, progression, economy, story and cast, technical architecture, and MVP scope.

## Status

v3.3 — playable home city (Port Marinara): a pizzeria in each of six neighbourhoods, drawn as a perspective storefront with a brick street face, awning and sign tiers, domed and deck ovens, decor upgrades, and a distinct backdrop per neighbourhood; sidewalk upgrade buttons with a tap-only drawer; per-shop managers, offline earnings, 24 story cut-scenes, a Scrapbook and a City map. Code-drawn SVG art throughout, with a memory-optimised scene (memoised layers and figure parts, a pure cast builder) and geometry and crowd tests. **New session? Start with [HANDOFF.md](HANDOFF.md).**

- Run: `npm install`, then `npx expo start` (Expo Go) or `npx expo export --platform web`
- Tests: `npm test` (engine) · pacing: `npx tsx scripts/pacing-sim.ts` (`NOTAP=1` for a casual player)
- Review loop: each build step is reviewed by two agents — the visual `critic` (`.claude/agents/critic.md`, log in `CRITICLOG.md` with history in `docs/logs/`, screenshots via `scripts/screenshots.py`) and the `codecritic` (`.claude/agents/codecritic.md`, log in `CODELOG.md`), which reviews the step's diff for code quality and architecture. Both sets of notes feed the next build; a step is done when the critic is SATISFIED and the codecritic APPROVES.
