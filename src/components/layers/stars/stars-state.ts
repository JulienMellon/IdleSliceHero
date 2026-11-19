// The Uptown sheet's open flag (stars and the critic), shared by the HUD chip and the sheet.
import { createSheetState } from '../menu/sheet-state';

export const starsSheetState = createSheetState();

/** The hook: a named `use…` function, so React Compiler treats it as a hook (a `.use()` method it would cache). */
export const useStarsSheetOpen = (): boolean => starsSheetState.use();
