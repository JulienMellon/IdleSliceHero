// Put a short text on the clipboard. The web build has `navigator.clipboard`; on iOS there is no clipboard module in this build, so the
// system share sheet opens with the text (it has Copy in it). If expo-clipboard is added later, call it first and return 'copied'.
import { Share } from 'react-native';

import type { CopyResult } from './settings-model';

export async function copyText(text: string): Promise<CopyResult> {
  const nav = (globalThis as { navigator?: { clipboard?: { writeText?: (t: string) => Promise<void> } } }).navigator;
  try {
    if (nav?.clipboard?.writeText) {
      await nav.clipboard.writeText(text);
      return 'copied';
    }
  } catch {
    /* fall through to the share sheet */
  }
  try {
    await Share.share({ message: text });
    return 'shared';
  } catch {
    return 'failed';
  }
}
