// The test build's switch (card X1, docs/PLAN-test-mode.md). Expo inlines EXPO_PUBLIC_* at export, so this is a plain constant in the bundle.
// Nothing here pulls in UI: this is the one src/dev/ file the rest of the app may import. Anything outside src/dev/ that needs the panel writes
// the literal comparison itself (src/dev/README.md), because Metro collects a require() before it folds a constant it only imported.
export const TEST_MODE = process.env.EXPO_PUBLIC_TEST_MODE === '1';

/**
 * The red TEST pill's geometry (pt): drawn 40 tall, overlaid on the HUD's lower right (position: absolute, so the HUD row keeps its height),
 * with a 2 pt hitSlop all round for a 44 pt touch area. `room*` is the space the HUD owns round it (the hitSlop must fit inside it:
 * `src/dev/__tests__/test-mode.test.ts` proves it with `controlPasses` from the tap-target rule).
 */
export const TEST_PILL = {
  width: 56,
  height: 40,
  right: 6,
  bottom: 2,
  slop: 2,
  roomTop: 4,
  roomBottom: 2,
  roomLeft: 6,
  roomRight: 6,
} as const;
