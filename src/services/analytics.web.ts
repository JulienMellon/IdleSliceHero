// Web, tests and the screenshot run: events are kept in a list (`analyticsLog()`), nothing is sent.
import { createAnalytics } from './analytics-core';
import { privacy } from './runtime';
import { store } from './store';
import type { Analytics, Props } from './types';

export interface Recorded {
  event: string;
  props?: Props;
}
const log: Recorded[] = [];
export const analyticsLog = (): readonly Recorded[] => log;
export const clearAnalyticsLog = (): void => void (log.length = 0);

const core = createAnalytics({
  kv: store,
  privacy,
  sink: { capture: (event, props) => void log.push({ event, props }), optOut: () => {} },
});

export const analytics: Analytics = core;
export const startAnalytics = core.start;
