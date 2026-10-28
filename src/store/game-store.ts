import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { HOME_SCENES } from '../content/scenes/home';
import type { NeighborhoodId, Scene } from '../content/types';
import * as G from '../engine/game';

const SAVE_KEY = 'slice-empire/save/v1';

export interface OfflineSummary {
  seconds: number;
  earned: number;
}

interface Store {
  game: G.GameState;
  loaded: boolean;
  offline: OfflineSummary | null;
  /** Scene currently playing (or replaying from the Scrapbook). */
  playing: { scene: Scene; replay: boolean } | null;
  /** Short-lived message, e.g. "Not enough cash". */
  toast: { text: string; at: number } | null;

  load: () => Promise<void>;
  save: () => Promise<void>;
  tick: (dt: number) => void;
  tapOven: () => void;
  buy: (what: 'oven' | 'driver' | 'vehicle') => boolean;
  unlock: (id: NeighborhoodId) => boolean;
  finishScene: () => void;
  replayScene: (scene: Scene) => void;
  dismissOffline: () => void;
  resetGame: () => Promise<void>;
}

/** Serialises saves so a resume never reads a save that is still being written. */
let pendingSave: Promise<void> = Promise.resolve();

export const useGame = create<Store>((set, get) => {
  /** After any state change, queue the next story scene if one has triggered. */
  const queueScene = () => {
    const { game, playing } = get();
    if (playing) return;
    const next = G.pendingScenes(game, HOME_SCENES)[0];
    if (next) set({ playing: { scene: next, replay: false } });
  };

  const commit = (result: G.BuyResult) => {
    if (!result.ok) {
      set({ toast: { text: result.reason, at: Date.now() } });
      return false;
    }
    set({ game: result.state });
    queueScene();
    void get().save();
    return true;
  };

  return {
    game: G.newGame(Date.now()),
    loaded: false,
    offline: null,
    playing: null,
    toast: null,

    load: async () => {
      const now = Date.now();
      // On resume, keep in-memory progress if the save can't be read.
      let game = get().loaded ? get().game : G.newGame(now);
      let offline: OfflineSummary | null = null;
      try {
        await pendingSave;
        const raw = await AsyncStorage.getItem(SAVE_KEY);
        if (raw) {
          const r = G.applyOffline(G.migrate(JSON.parse(raw), now), now);
          game = r.state;
          if (r.earned >= 1 && r.seconds >= 60) offline = { seconds: r.seconds, earned: r.earned };
        }
      } catch {
        // Corrupt or unreadable save: start fresh rather than crash.
      }
      set({ game, loaded: true, offline });
      if (!offline) queueScene();
    },

    save: async () => {
      const game = { ...get().game, lastSavedAt: Date.now() };
      set({ game });
      const json = JSON.stringify(game);
      pendingSave = pendingSave
        .then(() => AsyncStorage.setItem(SAVE_KEY, json))
        .catch(() => {
          // Storage full or unavailable; the next save will retry.
        });
      await pendingSave;
    },

    tick: (dt) => {
      if (!get().loaded) return;
      set({ game: G.tick(get().game, dt) });
      queueScene();
    },

    tapOven: () => set({ game: G.tapOven(get().game) }),

    buy: (what) => {
      const g = get().game;
      return commit(what === 'oven' ? G.buyOven(g) : what === 'driver' ? G.buyDriver(g) : G.buyVehicle(g));
    },

    unlock: (id) => commit(G.unlockNeighborhood(get().game, id)),

    finishScene: () => {
      const p = get().playing;
      if (!p) return;
      set({ playing: null, game: p.replay ? get().game : G.markSceneSeen(get().game, p.scene) });
      if (!p.replay) void get().save();
      queueScene();
    },

    replayScene: (scene) => set({ playing: { scene, replay: true } }),

    dismissOffline: () => {
      set({ offline: null });
      queueScene();
    },

    resetGame: async () => {
      await AsyncStorage.removeItem(SAVE_KEY).catch(() => {});
      set({ game: G.newGame(Date.now()), offline: null, playing: null });
      queueScene();
    },
  };
});
