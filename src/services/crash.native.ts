// iOS: Sentry. Off when the player has opted out of analytics (at start, and for every event after).
import * as Sentry from '@sentry/react-native';

import { createCrash } from './crash-core';
import { privacy } from './runtime';
import type { Crash } from './types';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';

export const crash: Crash = createCrash(privacy, {
  capture(e, context) {
    Sentry.captureException(e, context ? { extra: { context } } : undefined);
  },
});

/** Call after `privacy.load()`. */
export function startCrash(): void {
  Sentry.init({
    dsn: DSN,
    enabled: !!DSN && !privacy.isOptedOut(),
    sendDefaultPii: false,
    // an opt-out made later in the session stops what is still queued
    beforeSend: (event) => (privacy.isOptedOut() ? null : event),
  });
}

/** File reports under the random Install ID (the analytics distinct id), so a deletion request can find them; null clears it. */
export function setCrashUser(id: string | null): void {
  Sentry.setUser(id ? { id } : null);
}
