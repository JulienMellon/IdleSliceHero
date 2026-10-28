# IdleSliceHero

A mobile idle game about building a pizza delivery empire, from one failing shop to every neighborhood in the city and then new cities. Built with Expo / React Native.

Working title: **Slice Empire**.

## Docs

- [Game design doc](docs/DESIGN.md) — core loop, progression, economy, story and cast, technical architecture, and MVP scope.

## Status

v1.5 — playable home city (Port Marinara): a pizzeria in each of six neighbourhoods, an animated pizzeria cutaway, per-shop upgrades and managers, offline earnings, 24 story cut-scenes and a Scrapbook. Placeholder art throughout.

- Run: `npm install`, then `npx expo start` (Expo Go) or `npx expo export --platform web`
- Tests: `npm test` (engine) · pacing: `npx tsx scripts/pacing-sim.ts` (`NOTAP=1` for a casual player)
- Review loop: `CRITICLOG.md` (critic agent in `.claude/agents/critic.md`; screenshots via `scripts/screenshots.py`)
