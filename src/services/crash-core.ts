import type { Privacy } from './privacy';
import type { Crash } from './types';

export interface CrashSink {
  capture(e: unknown, context?: string): void;
}

/** Reports nothing while the player has opted out of analytics. */
export function createCrash(privacy: Privacy, sink: CrashSink): Crash {
  return {
    capture(e, context) {
      if (privacy.isOptedOut()) return;
      try {
        sink.capture(e, context);
      } catch {
        /* a crash reporter must not crash */
      }
    },
  };
}
