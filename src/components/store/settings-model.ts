// The words of Settings' privacy, install-ID and purchase rows (card U3). Pure: the screen draws them.
import type { ProductId } from '../../services/types';
import { restoreLine } from './store-model';

export const ANALYTICS_LABEL = 'Share anonymous analytics';

/** What the switch does, in its own words: it covers the usage counts and the crash reports (both stop when it is off). */
export const analyticsNote = (on: boolean): string =>
  on ? 'Anonymous counts of what is played and crash reports help us fix the game. No name, no email.' : 'Nothing is sent: no usage counts and no crash reports.';

export const analyticsSwitchText = (on: boolean): string => `${ANALYTICS_LABEL}: ${on ? 'On' : 'Off'}`;

export const INSTALL_ID_NOTE = 'Send this ID with a request about your data (access or deletion). It is not linked to your name.';

/** The ID as shown: never empty. */
export const installIdText = (id: string): string => (id ? id : 'Not ready yet');

export type CopyResult = 'copied' | 'shared' | 'failed';
export const copyLine = (r: CopyResult): string => (r === 'copied' ? 'Copied.' : r === 'shared' ? 'Choose Copy in the sheet that opened.' : 'Couldn’t copy. Select the ID above instead.');

export const RESTORING = 'Checking your purchases…';
export const restoreResult = (ids: readonly ProductId[]): string => restoreLine(ids);
