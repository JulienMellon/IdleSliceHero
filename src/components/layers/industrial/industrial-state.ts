// The Industrial sheet's open flag (shifts and jams), shared by the HUD chip and the sheet.
import { createSheetState } from '../university/sheet-state';

export const industrialSheet = createSheetState();

/** The hook: a named `use…` function, so React Compiler treats it as a hook (a `.use()` method it would cache). */
export const useIndustrialSheet = (): boolean => industrialSheet.use();
