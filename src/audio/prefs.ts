// Music and Sound toggles (AU24). Stored under their own key so Reset game doesn't erase them.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const KEY = 'slice-empire/audio/v1';

interface AudioPrefs {
  music: boolean;
  sound: boolean;
  setMusic: (on: boolean) => void;
  setSound: (on: boolean) => void;
  load: () => Promise<void>;
}

export const useAudioPrefs = create<AudioPrefs>((set, get) => {
  const persist = () => {
    const { music, sound } = get();
    void AsyncStorage.setItem(KEY, JSON.stringify({ music, sound })).catch(() => {});
  };
  return {
    music: true,
    sound: true,
    setMusic: (music) => {
      set({ music });
      persist();
    },
    setSound: (sound) => {
      set({ sound });
      persist();
    },
    load: async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (!raw) return;
        const v = JSON.parse(raw) as Partial<{ music: boolean; sound: boolean }>;
        set({ music: v.music !== false, sound: v.sound !== false });
      } catch {
        // unreadable: keep the defaults
      }
    },
  };
});
