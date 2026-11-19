// Card X2: the test cheats that outlive a reload (free buys, the store's answer, the clock offset, the game speed), saved under their own
// test key beside the test prefs (`slice-empire/store/test-v1`), never under a v1 key. Put back by the store before the first save loads.
// Pure TS: the section bodies (money.ts, time.ts) call `saveCheats` after every change.
import AsyncStorage from '@react-native-async-storage/async-storage';

import { gameClockOffset, gameSpeed, setGameClockOffset, setGameSpeed } from '../engine/clock';
import { freeBuysOn, setFreeBuys } from '../engine/game';
import { setTestBuyAnswer, testBuyAnswerOn } from '../services/purchases.web';

export const CHEATS_KEY = 'slice-empire/store/test-cheats-v1';

export interface Cheats {
  freeBuys: boolean;
  purchaseOk: boolean;
  clockOffset: number;
  speed: number;
}

/** What a test build starts with: free buys ON, the store left to its query string, no offset, 1x. */
export const DEFAULT_CHEATS: Cheats = { freeBuys: true, purchaseOk: false, clockOffset: 0, speed: 1 };

export function parseCheats(raw: string | null): Cheats {
  try {
    const v = JSON.parse(raw ?? '') as Partial<Cheats>;
    return {
      freeBuys: typeof v.freeBuys === 'boolean' ? v.freeBuys : DEFAULT_CHEATS.freeBuys,
      purchaseOk: v.purchaseOk === true,
      clockOffset: typeof v.clockOffset === 'number' && Number.isFinite(v.clockOffset) && v.clockOffset > 0 ? v.clockOffset : 0,
      speed: v.speed === 4 || v.speed === 16 ? v.speed : 1,
    };
  } catch {
    return DEFAULT_CHEATS;
  }
}

/** Put the saved cheats in place (the clock offset first: the save loads against it). */
export async function restoreCheats(): Promise<void> {
  const raw = await AsyncStorage.getItem(CHEATS_KEY).catch(() => null);
  const c = parseCheats(raw);
  setGameClockOffset(c.clockOffset);
  setGameSpeed(c.speed);
  setFreeBuys(c.freeBuys);
  setTestBuyAnswer(c.purchaseOk ? 'purchased' : null);
}

/** The cheats as they are now. */
export const currentCheats = (): Cheats => ({ freeBuys: freeBuysOn(), purchaseOk: testBuyAnswerOn(), clockOffset: gameClockOffset(), speed: gameSpeed() });

/** Save them (a failed write is quiet: the next change retries). */
export async function saveCheats(): Promise<void> {
  await AsyncStorage.setItem(CHEATS_KEY, JSON.stringify(currentCheats())).catch(() => {});
}
