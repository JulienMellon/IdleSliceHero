// iOS: PostHog. Opt-out is checked in analytics-core.ts before anything reaches this file; the key comes from the environment.
import { PostHog } from 'posthog-react-native';

import { createAnalytics } from './analytics-core';
import { privacy } from './runtime';
import { store } from './store';
import type { Analytics } from './types';

const KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '';
const HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

let client: PostHog | null = null;
let idForClient = '';

const core = createAnalytics({
  kv: store,
  privacy,
  sink: {
    capture(event, props) {
      if (!KEY) return;
      client ??= new PostHog(KEY, {
        host: HOST,
        // the install id is the only identity: random, made on this device, never linked to a person
        bootstrap: { distinctId: idForClient || analytics.installId() },
        persistence: 'memory',
        captureAppLifecycleEvents: false,
        disableGeoip: true,
        defaultOptIn: !privacy.isOptedOut(),
      });
      client.capture(event, props);
    },
    optOut(v) {
      if (!client) return;
      void (v ? client.optOut() : client.optIn());
    },
  },
});

export const analytics: Analytics = core;
export const startAnalytics = async (): Promise<void> => {
  await core.start();
  idForClient = core.installId();
};
