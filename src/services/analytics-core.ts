import { cleanProps } from './events';
import type { Privacy } from './privacy';
import type { Analytics, KV, Props } from './types';

export const INSTALL_ID_KEY = 'se.analytics.install';
const QUEUE_MAX = 50;

/** Where events go: PostHog on iOS, a list on the web. */
export interface AnalyticsSink {
  capture(event: string, props?: Props): void;
  optOut(v: boolean): void;
}

export interface AnalyticsDeps {
  kv: KV;
  privacy: Privacy;
  sink: AnalyticsSink;
  random?: () => number;
}

const newId = (random: () => number): string => {
  let s = '';
  for (let i = 0; i < 4; i++)
    s += Math.floor(random() * 0x100000000)
      .toString(16)
      .padStart(8, '0');
  return s;
};

/** Opt-out is checked on every track and again when the queue drains, so nothing leaves while the player has said no. */
export function createAnalytics({ kv, privacy, sink, random = Math.random }: AnalyticsDeps): Analytics & { start(): Promise<void> } {
  let id = '';
  let started = false;
  let queue: { event: string; props?: Props }[] = [];

  const send = (event: string, props?: Props) => {
    try {
      sink.capture(event, props);
    } catch {
      /* analytics never breaks the game */
    }
  };

  return {
    async start() {
      const stored = await kv.get(INSTALL_ID_KEY);
      if (stored) id = stored;
      else {
        id = id || newId(random);
        await kv.set(INSTALL_ID_KEY, id);
      }
      started = true;
      sink.optOut(privacy.isOptedOut());
      const q = queue;
      queue = [];
      if (!privacy.isOptedOut()) q.forEach((e) => send(e.event, e.props));
    },
    track(event, props) {
      if (privacy.isOptedOut()) return;
      const clean = cleanProps(props);
      if (!started) {
        if (queue.length < QUEUE_MAX) queue.push({ event, props: clean });
        return;
      }
      send(event, clean);
    },
    setOptOut(v) {
      privacy.set(v);
      if (v) queue = [];
      sink.optOut(v);
    },
    installId() {
      if (!id) id = newId(random);
      return id;
    },
  };
}
