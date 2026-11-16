// Register every feature before any test file loads (C117): a test that imports only game.ts used to see an empty registry, so it
// priced and migrated a different game than the app does. Tests that want none say so with `withFeatures([], ...)`.
import './src/engine/features';
