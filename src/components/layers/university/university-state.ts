// The University sheet's open flag (menu mix + campus zones), shared by the HUD chip, the zones strip and the sheet.
import { createSheetState } from './sheet-state';

export const universitySheet = createSheetState();

/** The hook: a named `use…` function, so React Compiler treats it as a hook (a `.use()` method it would cache). */
export const useUniversitySheet = (): boolean => universitySheet.use();
