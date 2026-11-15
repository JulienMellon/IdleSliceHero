// Web, tests and the screenshot run: captures are kept in a list (`crashLog()`), nothing is sent.
import { createCrash } from './crash-core';
import { privacy } from './runtime';
import type { Crash } from './types';

export interface Captured {
  error: unknown;
  context?: string;
}
const log: Captured[] = [];
export const crashLog = (): readonly Captured[] => log;
export const clearCrashLog = (): void => void (log.length = 0);

export const crash: Crash = createCrash(privacy, { capture: (error, context) => void log.push({ error, context }) });
export function startCrash(): void {}
