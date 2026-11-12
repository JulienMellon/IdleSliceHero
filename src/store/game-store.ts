import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { emitAudio, type AudioEvent } from '../audio/bus';
import { collectSize, purchaseSting, type Purchase } from '../audio/logic';
import { buyCosmetic as buyVanity } from '../components/endgame/shop-model';
import { buyMany, buyPlan, type BuyAmount } from '../components/sidewalk-model';
import { pickScene, resumeSceneEnd } from '../engine/cutscene-input';
import { HOME_SCENES } from '../content/scenes/home';
import { PIER9_BID, TUNING, type DecorKind } from '../content/tuning';
import type { NeighborhoodId, Scene } from '../content/types';
import { money } from '../engine/format';
import * as B from '../engine/bonus';
import * as G from '../engine/game';
import * as N from '../engine/night-oven';
import * as O from '../engine/orders';
import { ackAttack, startChallenge } from '../engine/features/counterattack';
import { ackMastery } from '../engine/features/mastery';
import { ackRecipes } from '../engine/features/recipes';
import * as R from '../engine/rewards';
import { tutorialAdvance, tutorialHoldsStory } from '../engine/tutorial';
import type { Station } from '../engine/pipeline';

const SAVE_KEY = 'slice-empire/save/v1';

export interface OfflineSummary {
  seconds: number;
  /** Time away exceeded the offline cap. */
  capped: boolean;
  awaySeconds: number;
  earned: number;
  byShop: { name: string; earned: number; managed: boolean; pies: number }[];
  /** Built pizzerias with no manager: the gift's news line says one waited for the player. */
  idle: string[];
}

/** How many rush taps the store remembers. */
export const RUSH_TAPS_KEPT = 8;

interface Store {
  game: G.GameState;
  loaded: boolean;
  offline: OfflineSummary | null;
  /** When the player last made a successful manual station tap (ms): a scene never opens mid-tap. A refused tap or a rush doesn't count. Not saved. */
  lastKitchenTap: number;
  /** Wall-clock ms of the last (up to RUSH_TAPS_KEPT) rush taps on a managed pizzeria, newest last. Replaced, never mutated. Not saved. */
  rushTaps: number[];
  /** Play time (s) when the last story scene ended this session; null after a launch or return (v3.7 pacing). Not saved. */
  lastSceneEndPlay: number | null;
  /** Scene currently playing (or replaying from the Scrapbook). */
  playing: { scene: Scene; replay: boolean } | null;
  /** The title card has finished this launch (not saved): scenes and the offline popup wait for it. */
  titleDone: boolean;
  /** The title card finished: let the story and popups through. */
  finishTitle: () => void;
  /** Wall-clock ms of the last game tick (not saved): the scene interpolates job timers from it between ticks. */
  tickAt: number;
  /** A drawer, the tasks sheet, the gift calendar or another screen is open (set by the main screen, not saved): the golden pizza waits. */
  bonusHold: boolean;
  setBonusHold: (hold: boolean) => void;
  /** Tap the golden pizza. Null when none is on screen; otherwise what it paid. Never counts as a kitchen tap (the story gate). */
  tapBonus: () => { paid: number; lucky: boolean } | null;
  /** The special order on the table: take it, or send it away. */
  acceptOrder: () => void;
  declineOrder: () => void;
  /** v5.15: how many levels a tap on a sidewalk station buys (not saved). */
  buyAmount: BuyAmount;
  setBuyAmount: (a: BuyAmount) => void;
  /** Tap on a sidewalk station for the chosen amount: one purchase, one save, one sound (sidewalk-model `buyPlan`). */
  buyStation: (what: G.Upgrade) => boolean;
  /** Victor's attack: start the defence challenge. */
  defend: () => boolean;
  /** Put an owned cosmetic on (`on`) or take it off. */
  equip: (id: string, on: boolean) => void;
  /** The vanity shop: buy a cosmetic with diamonds (it is worn at once). */
  buyCosmetic: (id: string) => boolean;
  /** The UI has shown the endgame news: `news` = stars and recipe cards, `attack` = how the last attack ended. Clears it; not saved. */
  ackEndgame: (part: 'news' | 'attack') => void;
  /** Short-lived message, e.g. "Not enough cash". */
  /** `need`: a need-cash toast clears itself once the player can afford it. */
  toast: { text: string; at: number; need?: number } | null;

  load: () => Promise<void>;
  save: () => Promise<void>;
  tick: (dt: number) => void;
  /** Tap the active pizzeria: the next station that can start (no GM) or a rush (GM). */
  tapShop: () => void;
  /** Tap one station of the active pizzeria. Returns why it was refused (the scene shows it under the badge), or null. */
  tapStation: (st: Station) => string | null;
  buy: (what: G.Upgrade) => boolean;
  buyFleet: () => boolean;
  buyDecor: (kind: DecorKind) => boolean;
  /** Nonna's night oven: buy the next tier of the away meter. */
  buyNightOven: () => boolean;
  build: (id: NeighborhoodId) => boolean;
  /** Waterfront's finale: bid on Pier 9. */
  bidPier9: () => boolean;
  setActive: (id: NeighborhoodId) => void;
  finishScene: () => void;
  replayScene: (scene: Scene) => void;
  dismissOffline: () => void;
  /** Rewards (all via `commit`: a toast on refusal, a save on success). */
  claimDaily: (i: number) => boolean;
  claimChest: (i: number) => boolean;
  claimWeekly: (i: number) => boolean;
  claimWeeklyChest: () => boolean;
  startBooster: (i: number) => boolean;
  claimGift: (repair?: boolean) => boolean;
  /** The gift calendar opened by itself today: don't open it again until tomorrow. */
  markGiftShown: () => void;
  markScrapbookViewed: () => void;
  resetGame: () => Promise<void>;
}

/** A scene, the return popup or the title card is up: the orders' clocks stop and no offer appears. */
export const gameCovered = (s: Pick<Store, 'playing' | 'offline' | 'titleDone'>): boolean => !!s.playing || !!s.offline || !s.titleDone;
/** The golden pizza also waits behind a drawer or another screen. */
export const bonusBlocked = (s: Pick<Store, 'playing' | 'offline' | 'titleDone' | 'bonusHold'>): boolean => s.bonusHold || gameCovered(s);

const UPGRADE_NAMES: Record<string, string> = { prep: 'Prep', ovens: 'Ovens', counter: 'Counter', drivers: 'Drivers', tables: 'Seating', grade: 'Oven grade', expand: 'Expand', manager: 'Manager', headPrep: 'Head Prep Cook', headOven: 'Head Baker', headCounter: 'Head Cashier' };

/** Serialises saves so a resume never reads a save that is still being written. */
let pendingSave: Promise<void> = Promise.resolve();
/** When rewards were last refreshed in a tick (ms): a day change or a boost ending needs at most a second's wait. */
let lastRewardsRefresh = 0;

export const useGame = create<Store>((set, get) => {
  /** After any state change, queue the next story scene if one has triggered. */
  const queueScene = () => {
    const { game, playing, lastKitchenTap, lastSceneEndPlay } = get();
    // the title card is still up, or Nonna is walking the player through the first batch: the story waits
    if (!get().titleDone || tutorialHoldsStory(game)) return;
    const next = pickScene(game, HOME_SCENES, Date.now(), lastKitchenTap, !!playing, lastSceneEndPlay);
    if (next) set({ playing: { scene: next, replay: false } });
  };

  /** `sound` describes a successful purchase for the audio director (docs/AUDIO.md); a refusal always bonks. */
  const commit = (result: G.BuyResult, item?: { name: string; cost: number | null; hint?: string }, sound?: (next: G.GameState) => AudioEvent) => {
    if (!result.ok) {
      emitAudio({ type: 'refused' });
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
    if (sound) emitAudio(sound(result.state));
    set({ game: tutorialAdvance(result.state) });
    queueScene();
    void get().save();
    return true;
  };
  /** Cash claims sound like collecting; the rest just click. */
  const claimSound = (before: G.GameState) => (next: G.GameState): AudioEvent => (next.cash > before.cash ? { type: 'collect', size: collectSize(next.cash - before.cash, before.cash) } : { type: 'click' });
  const claim = (run: (g: G.GameState, now: number) => G.BuyResult) => {
    const g = get().game;
    return commit(run(g, Date.now()), undefined, claimSound(g));
  };
  const plain = (what: Purchase) => (): AudioEvent => ({ type: 'buy', what, sting: purchaseSting(what, {}) });

  /** A station or hire purchase for the active shop (one level, or several at once): the toast on a refusal, the sound, one save. */
  const purchase = (what: G.Upgrade, result: G.BuyResult, cost: number | null) => {
    const g = get().game;
    // when the tapped station isn't what's holding the shop back, the toast says so
    const STAGE_UPGRADE: Record<G.Stage, string> = { prep: 'prep', ovens: 'ovens', counter: 'counter', customers: 'drivers' };
    const shop = g.shops[g.active];
    const neck = STAGE_UPGRADE[G.bottleneck(shop, g.vehicle)];
    const hint = ['prep', 'ovens', 'counter', 'drivers'].includes(what) && what !== neck ? ` · ${UPGRADE_NAMES[neck]} is the bottleneck` : '';
    // a station level crossing 25/50/100 gets the milestone stinger; a fixed bottleneck gets its own (AU14)
    const sound = (next: G.GameState): AudioEvent => {
      const after = next.shops[g.active];
      const level = what === 'prep' || what === 'ovens' || what === 'counter' || what === 'drivers' || what === 'tables' ? what : null;
      const kind: Purchase = G.isHeadUpgrade(what) ? 'head' : what;
      const sting = purchaseSting(kind, {
        levelBefore: level ? shop[level] : undefined,
        levelAfter: level ? after[level] : undefined,
        bottleneckBefore: G.bottleneck(shop, g.vehicle),
        bottleneckAfter: G.bottleneck(after, next.vehicle),
      });
      return { type: 'buy', what: kind, sting };
    };
    return commit(result, { name: UPGRADE_NAMES[what] ?? what, cost, hint }, sound);
  };

  return {
    game: G.newGame(Date.now()),
    loaded: false,
    offline: null,
    lastKitchenTap: 0,
    rushTaps: [],
    lastSceneEndPlay: null,
    playing: null,
    toast: null,
    bonusHold: false,
    tickAt: Date.now(),
    titleDone: false,
    buyAmount: 1,
    finishTitle: () => {
      if (get().titleDone) return;
      set({ titleDone: true });
      if (!get().offline) queueScene();
    },

    load: async () => {
      const now = Date.now();
      // On resume, keep in-memory progress if the save can't be read.
      const wasLoaded = get().loaded;
      let game = wasLoaded ? get().game : G.newGame(now);
      let offline: OfflineSummary | null = null;
      // a cold launch is always a return; on resume, measure from the last save even if this load fails (C48)
      let awaySeconds = wasLoaded ? Math.max(0, (now - get().game.lastSavedAt) / 1000) : Number.POSITIVE_INFINITY;
      try {
        await pendingSave;
        const raw = await AsyncStorage.getItem(SAVE_KEY);
        if (raw) {
          const saved = G.migrate(JSON.parse(raw), now);
          const r = G.applyOffline(saved, now);
          // an order that ran out while away is over (silently); the pies sold meanwhile don't count toward one that didn't
          game = R.refreshRewards(B.bonusAway(O.returnFromAway(saved, r.state, r.awaySeconds), r.awaySeconds), now);
          awaySeconds = r.awaySeconds;
          if (r.earned >= 1 && r.seconds >= TUNING.offlinePopupSeconds) {
            // Hold the cash back until the player taps Collect.
            offline = { seconds: r.seconds, capped: r.capped, awaySeconds: r.awaySeconds, earned: r.earned, byShop: r.byShop.map((b) => ({ name: G.def(b.id).name, earned: b.earned, managed: b.managed, pies: b.pies })), idle: r.idle.map((id) => G.def(id).name) };
            game = { ...game, cash: game.cash - r.earned, totalEarned: game.totalEarned - r.earned };
          }
        }
      } catch {
        // Corrupt or unreadable save: start fresh rather than crash.
      }
      // a launch or a real return may play one waiting story beat straight away; a short interruption keeps the gap (C39)
      set({ game, loaded: true, offline, lastSceneEndPlay: resumeSceneEnd(wasLoaded ? get().lastSceneEndPlay : null, awaySeconds, game.playSeconds) });
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
      const now = Date.now();
      let g = get().game;
      if (now - lastRewardsRefresh >= 1000 || now < lastRewardsRefresh) {
        lastRewardsRefresh = now;
        g = R.refreshRewards(g, now);
      }
      const st = get();
      let game = tutorialAdvance(G.playTick(g, dt, now));
      game = B.bonusTick(game, dt, bonusBlocked(st));
      const covered = gameCovered(st);
      const before = game;
      game = O.orderTick(game, dt, covered);
      // a new offer, a finished order: a sound and a save (a failure is quiet)
      if (game.order.offer && !before.order.offer && !before.order.active) emitAudio({ type: 'bubble' });
      if (game.stats.ordersDone > before.stats.ordersDone) {
        emitAudio({ type: 'collect', size: collectSize(game.cash - before.cash, before.cash) });
        setTimeout(() => void get().save(), 0);
      }
      const toast = get().toast;
      const tickAt = now;
      set(toast?.need !== undefined && game.cash >= toast.need ? { game, toast: null, tickAt } : { game, tickAt });
      queueScene();
    },

    tapShop: () => {
      const g = get().game;
      const next = G.tapShop(g, g.active);
      const at = Date.now();
      if (g.shops[g.active].managed) {
        // a rush: remember when (for the HUD), but it isn't a manual station tap
        set({ game: next, rushTaps: [...get().rushTaps, at].slice(-RUSH_TAPS_KEPT) });
      } else if (next !== g) {
        // an unmanaged shop tapped the next station that could start: that is a manual station tap
        set({ game: next, lastKitchenTap: at });
      }
    },

    tapStation: (st) => {
      const g = get().game;
      const r = G.tapStation(g, g.active, st);
      if (r.ok) {
        set({ game: tutorialAdvance(r.state), lastKitchenTap: Date.now() });
        return null;
      }
      return r.reason;
    },

    setBonusHold: (hold) => {
      if (get().bonusHold !== hold) set({ bonusHold: hold });
    },

    tapBonus: () => {
      const g = get().game;
      const r = B.collectBonus(g);
      if (!r) return null;
      emitAudio({ type: 'collect', size: collectSize(r.paid, g.cash) });
      set({ game: r.state });
      void get().save();
      return { paid: r.paid, lucky: r.lucky };
    },

    acceptOrder: () => {
      const g = get().game;
      const next = O.acceptOrder(g);
      if (next === g) return;
      emitAudio({ type: 'click' });
      set({ game: next });
      void get().save();
    },

    declineOrder: () => {
      const g = get().game;
      const next = O.declineOrder(g);
      if (next === g) return;
      emitAudio({ type: 'click' });
      set({ game: next });
      void get().save();
    },

    buy: (what) => {
      const g = get().game;
      return purchase(what, G.buyUpgrade(g, g.active, what), G.upgradeCostOf(g, g.active, what));
    },

    buyStation: (what) => {
      const g = get().game;
      const plan = buyPlan(g, g.active, what, get().buyAmount);
      // one level (or a single buy) is the ordinary path
      if (plan.count <= 1) return get().buy(what);
      return purchase(what, buyMany(g, g.active, what, plan.count), plan.total);
    },

    setBuyAmount: (a) => {
      if (get().buyAmount !== a) set({ buyAmount: a });
    },

    defend: () => {
      const g = get().game;
      const r = startChallenge(g, Date.now());
      if (r.ok) emitAudio({ type: 'click' });
      return commit(r);
    },

    equip: (id, on) => {
      const g = get().game;
      const next = on ? R.wear(g, id) : R.unwear(g, id);
      if (next === g) return;
      emitAudio({ type: 'click' });
      set({ game: next });
      void get().save();
    },

    buyCosmetic: (id) => commit(buyVanity(get().game, id), undefined, plain('decor')),

    ackEndgame: (part) => {
      const g = get().game;
      const next = part === 'attack' ? ackAttack(g) : ackRecipes(ackMastery(g));
      if (next !== g) set({ game: next });
    },

    buyFleet: () => commit(G.buyVehicle(get().game), undefined, (next) => ({ type: 'buy', what: 'fleet', vehicle: next.vehicle, sting: purchaseSting('fleet', { vehicle: next.vehicle }) })),

    buyDecor: (kind) => commit(G.buyDecor(get().game, get().game.active, kind), { name: kind[0].toUpperCase() + kind.slice(1), cost: G.decorCost(get().game, get().game.active, kind) }, plain('decor')),

    buyNightOven: () => {
      const g = get().game;
      const nt = N.nextTier(g);
      return commit(N.buyNightOven(g), { name: 'Night oven', cost: nt === null ? null : N.nightOvenPrice(g, nt) }, plain('grade'));
    },

    bidPier9: () => commit(G.bidPier9(get().game), { name: 'Bid on Pier 9', cost: PIER9_BID.cost }, plain('bid')),

    build: (id) => commit(G.buildShop(get().game, id), { name: `Build ${G.def(id).name}`, cost: G.def(id).buildCost }, () => ({ type: 'buy', what: 'build', sting: 'build', hood: id })),

    setActive: (id) => {
      const g = get().game;
      if (g.shops[id].built && g.active !== id) set({ game: { ...g, active: id } });
    },

    finishScene: () => {
      const p = get().playing;
      if (!p) return;
      if (p.replay) set({ playing: null });
      else {
        const game = tutorialAdvance(G.markSceneSeen(get().game, p.scene));
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
      emitAudio({ type: 'collect', size: collectSize(o.earned, g.cash) });
      set({ offline: null, game: { ...g, cash: g.cash + o.earned, totalEarned: g.totalEarned + o.earned, stats: { ...g.stats, offline: g.stats.offline + 1 } } });
      void get().save();
      queueScene();
    },

    claimDaily: (i) => claim((g, now) => R.claimDaily(g, i, now)),
    claimChest: (i) => claim((g, now) => R.claimChest(g, i, now)),
    claimWeekly: (i) => claim((g, now) => R.claimWeekly(g, i, now)),
    claimWeeklyChest: () => claim((g, now) => R.claimWeeklyChest(g, now)),
    startBooster: (i) => claim((g, now) => R.startBooster(g, i, now)),
    claimGift: (repair = false) => claim((g, now) => R.claimGift(g, now, { repair })),
    markGiftShown: () => {
      const g = get().game;
      const next = R.markGiftShown(g, Date.now());
      if (next !== g) {
        set({ game: next });
        void get().save();
      }
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
