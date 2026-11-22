// The Shop's two reminders (shop-flags-model.ts), kept on the device next to the store prefs. A new game clears them (the chip calls `reset`).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { afterOpen, FLAGS_KEY, NO_FLAGS, parseFlags, TEST_FLAGS_KEY, type ShopFlags } from './shop-flags-model';

const KEY = process.env.EXPO_PUBLIC_TEST_MODE === '1' ? TEST_FLAGS_KEY : FLAGS_KEY;

interface ShopFlagsStore extends ShopFlags {
  /** False until the saved flags are read: nothing reads a flag before it, so a dot never flashes. */
  loaded: boolean;
  /** The Shop opened (`takenOver`: rewards are unlocked). */
  opened: (takenOver: boolean) => void;
  markNudged: () => void;
  reset: () => void;
}

export const useShopFlags = create<ShopFlagsStore>()((set, get) => {
  const put = (patch: Partial<ShopFlags>) => {
    const { dotCleared, nudged } = { ...get(), ...patch };
    set({ dotCleared, nudged });
    void AsyncStorage.setItem(KEY, JSON.stringify({ dotCleared, nudged })).catch(() => {});
  };
  void AsyncStorage.getItem(KEY)
    .then((raw) => set({ ...parseFlags(raw), loaded: true }))
    .catch(() => set({ loaded: true }));
  return {
    ...NO_FLAGS,
    loaded: false,
    opened: (takenOver) => {
      const next = afterOpen(get(), takenOver);
      if (next.dotCleared !== get().dotCleared) put(next);
    },
    markNudged: () => {
      if (!get().nudged) put({ nudged: true });
    },
    reset: () => {
      if (get().dotCleared || get().nudged) put(NO_FLAGS);
    },
  };
});
