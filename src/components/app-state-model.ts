// What the app's foreground/background state means for the game's timers and loops (pure, so a test can pin it).

/** React Native's AppState values. */
export type AppStateName = 'active' | 'inactive' | 'background' | 'unknown' | 'extension';

/**
 * The app is drawn and may animate. `inactive` (Control Center, a notification, the app switcher's first moment) still counts: the game is
 * on screen behind it, and the audio director makes the same call (src/audio/director.ts). Only `background` stops the tick and the loops.
 */
export const isForeground = (s: AppStateName | string | null | undefined): boolean => s !== 'background';
