// Lint (card R0, docs/PLAN-refactor.md P0): `npx expo lint`. The Expo flat config, with every rule it ships softened to a warning so the run exits 0 on
// today's code, plus the layer rules below, which are errors where the plan says so (engine and content) and warnings where a later card fixes the hits.
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

/** One rule setting as a warning (a severity alone, or a severity with options). */
const soften = (setting) => {
  const level = Array.isArray(setting) ? setting[0] : setting;
  if (level === 'off' || level === 0) return setting;
  return Array.isArray(setting) ? ['warn', ...setting.slice(1)] : 'warn';
};
const softened = (Array.isArray(expoConfig) ? expoConfig : [expoConfig]).map((c) => (c.rules ? { ...c, rules: Object.fromEntries(Object.entries(c.rules).map(([k, v]) => [k, soften(v)])) } : c));

/** Import paths in any spelling (`../components/x`, `@/components`) that reach one of these folders. */
const folders = (names) => names.flatMap((n) => [`**/${n}`, `**/${n}/**`]);
const noImport = (names, message) => ['error', { patterns: [{ group: folders(names), message }] }];
const TESTS = ['**/__tests__/**', '**/__fixtures__/**'];

module.exports = defineConfig([
  ...softened,
  { ignores: ['dist/**', 'node_modules/**', '.expo/**', 'site/**', 'tools/**', 'scripts/**', 'marketing/**'] },
  { rules: { 'import/no-cycle': 'warn' } },
  {
    // the engine and the content are the game's rules: they may not reach up into the screens, the store, the audio or the services
    files: ['src/engine/**/*.{ts,tsx}', 'src/content/**/*.{ts,tsx}'],
    ignores: TESTS,
    rules: { 'no-restricted-imports': noImport(['components', 'store', 'audio', 'services'], 'The engine and the content may not import components, store, audio or services (docs/PLAN-refactor.md P0).') },
  },
  {
    // the one engine file that does today (a type from services/grants): a warning until a later card moves the type
    files: ['src/engine/offers.ts'],
    rules: { 'no-restricted-imports': 'warn' },
  },
  {
    // the store may not import components: a warning now; card R3 (later/) moves the domain maths out and turns it to an error
    files: ['src/store/**/*.{ts,tsx}'],
    ignores: TESTS,
    rules: { 'no-restricted-imports': ['warn', { patterns: [{ group: folders(['components']), message: 'The store may not import components (docs/PLAN-refactor.md P3; card R3 makes this an error).' }] }] },
  },
]);
