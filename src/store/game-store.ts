import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { pickScene } from '../engine/cutscene-input';
import { HOME_SCENES } from '../content/scenes/home';
import { PIER9_BID, type DecorKind } from '../content/tuning';
import type { NeighborhoodId, Scene } from '../content/types';
import { money } from '../engine/format';
import * as G from '../engine/game';

const SAVE_KEY = 'slice-empire/save/v1';

export interface OfflineSummary {
  seconds: number;
  /** Time away exceeded the offline cap. */
  capped: boolean;
  awaySeconds: number;
  earned: number;
  byShop: { name: string; earned: number; managed: boolean }[];
}

interface Store {
  game: G.GameState;
  loaded: boolean;
  offline: OfflineSummary | null;
  /** When the player last tapped the kitchen (ms): a scene never opens mid-tap. Not saved. */
  lastKitchenTap: number;
  /** Play time (s) when the last story scene ended this session; null after a launch or return (v3.7 pacing). Not saved. */
  lastSceneEndPlay: number | null;
  /** Scene currently playing (or replaying from the Scrapbook). */
  playing: { scene: Scene; replay: boolean } | null;
  /** Short-lived message, e.g. "Not enough cash". */
  /** `need`: a need-cash toast clears itself once the player can afford it. */
  toast: { text: string; at: number; need?: number } | null;

  load: () => Promise<void>;
  save: () => Promise<void>;
  tick: (dt: number) => void;
  /** Tap the active pizzeria: queue a batch (no manager) or fill a rush order (managed). */
  tapShop: () => void;
  buy: (what: G.Upgrade) => boolean;
  buyFleet: () => boolean;
  buyDecor: (kind: DecorKind) => boolean;
  build: (id: NeighborhoodId) => boolean;
  /** Waterfront's finale: bid on Pier 9. */
  bidPier9: () => boolean;
  setActive: (id: NeighborhoodId) => void;
  finishScene: () => void;
  replayScene: (scene: Scene) => void;
  dismissOffline: () => void;
  markScrapbookViewed: () => void;
  resetGame: () => Promise<void>;
}

/** Serialises saves so a resume never reads a save that is still being written. */
let pendingSave: Promise<void> = Promise.resolve();

export const useGame = create<Store>((set, get) => {
  /** After any state change, queue the next story scene if one has triggered. */
  const queueScene = () => {
    const { game, playing, lastKitchenTap, lastSceneEndPlay } = get();
    const next = pickScene(game, HOME_SCENES, Date.now(), lastKitchenTap, !!playing, lastSceneEndPlay);
    if (next) set({ playing: { scene: next, replay: false } });
  };

  const commit = (result: G.BuyResult, item?: { name: string; cost: number | null; hint?: string }) => {
    if (!result.ok) {
      const at = Date.now();
      // name what the player tapped
      const needCash = result.reason === 'Not enough cash' && item && item.cost !== null ? item.cost : undefined;
      const text = needCash !== undefined && item ? `${item.name}: need ${money(needCash)}${item.hint ?? ''}` : result.reason;
      set({ toast: { text, at, need: needCash } });
      setTimeout(() => {
        if (get().toast?.at === at) set({ toast: null });
      }, 1800);
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
    lastKitchenTap: 0,
    lastSceneEndPlay: null,
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
          if (r.earned >= 1 && r.seconds >= 60) {
            // Hold the cash back until the player taps Collect.
            offline = { seconds: r.seconds, capped: r.capped, awaySeconds: r.awaySeconds, earned: r.earned, byShop: r.byShop.map((b) => ({ name: G.def(b.id).name, earned: b.earned, managed: b.managed })) };
            game = { ...game, cash: game.cash - r.earned, totalEarned: game.totalEarned - r.earned };
          }
        }
      } catch {
        // Corrupt or unreadable save: start fresh rather than crash.
      }
      // a launch or return may play one waiting story beat straight away
      set({ game, loaded: true, offline, lastSceneEndPlay: null });
      if (!offline) queueScene();
    },

    save: async () => {
      const game = { ...get().game, lastSavedAt: Date.now() };
      set({ game });
      // Uncollected offline cash is still the player's: include it in the save.
      const pending = get().offline?.earned ?? 0;
      const json = JSON.stringify({ ...game, cash: game.cash + pending, totalEarned: game.totalEarned + pending });
      pendingSave = pendingSave
        .then(() => AsyncStorage.setItem(SAVE_KEY, json))
        .catch(() => {
          // Storage full or unavailable; the next save will retry.
        });
      await pendingSave;
    },

    tick: (dt) => {
      if (!get().loaded) return;
      const game = G.playTick(get().game, dt);
      const toast = get().toast;
      set(toast?.need !== undefined && game.cash >= toast.need ? { game, toast: null } : { game });
      queueScene();
    },

    tapShop: () => {
      const g = get().game;
      set({ game: G.tapShop(g, g.active), lastKitchenTap: Date.now() });
    },

    buy: (what) => {
      const g = get().game;
      const NAMES: Record<string, string> = { prep: 'Prep', ovens: 'Ovens', counter: 'Counter', drivers: 'Drivers', tables: 'Seating', grade: 'Oven grade', expand: 'Expand', manager: 'Manager' };
      // when the tapped station isn't what's holding the shop back, the toast says so
      const STAGE_UPGRADE: Record<G.Stage, string> = { prep: 'prep', ovens: 'ovens', counter: 'counter', customers: 'drivers' };
      const shop = g.shops[g.active];
      const neck = STAGE_UPGRADE[G.bottleneck(shop, g.vehicle)];
      const hint = ['prep', 'ovens', 'counter', 'drivers'].includes(what) && what !== neck ? ` · ${NAMES[neck]} is the bottleneck` : '';
      return commit(G.buyUpgrade(g, g.active, what), { name: NAMES[what] ?? what, cost: G.upgradeCostOf(g, g.active, what), hint });
    },

    buyFleet: () => commit(G.buyVehicle(get().game)),

    buyDecor: (kind) => commit(G.buyDecor(get().game, get().game.active, kind), { name: kind[0].toUpperCase() + kind.slice(1), cost: G.decorCost(get().game, get().game.active, kind) }),

    bidPier9: () => commit(G.bidPier9(get().game), { name: 'Bid on Pier 9', cost: PIER9_BID.cost }),

    build: (id) => commit(G.buildShop(get().game, id), { name: `Build ${G.def(id).name}`, cost: G.def(id).buildCost }),

    setActive: (id) => {
      const g = get().game;
      if (g.shops[id].built && g.active !== id) set({ game: { ...g, active: id } });
    },

    finishScene: () => {
      const p = get().playing;
      if (!p) return;
      if (p.replay) set({ playing: null });
      else {
        const game = G.markSceneSeen(get().game, p.scene);
        set({ playing: null, game, lastSceneEndPlay: game.playSeconds });
      }
      if (!p.replay) void get().save();
      queueScene();
    },

    replayScene: (scene) => set({ playing: { scene, replay: true } }),

    dismissOffline: () => {
      const o = get().offline;
      if (!o) return;
      const g = get().game;
      set({ offline: null, game: { ...g, cash: g.cash + o.earned, totalEarned: g.totalEarned + o.earned } });
      void get().save();
      queueScene();
    },

    markScrapbookViewed: () => {
      const g = get().game;
      if (g.scrapbookViewed !== g.seenScenes.length) {
        set({ game: { ...g, scrapbookViewed: g.seenScenes.length } });
        void get().save();
      }
    },

    resetGame: async () => {
      await AsyncStorage.removeItem(SAVE_KEY).catch(() => {});
      set({ game: G.newGame(Date.now()), offline: null, playing: null, lastSceneEndPlay: null });
      queueScene();
    },
  };
});
