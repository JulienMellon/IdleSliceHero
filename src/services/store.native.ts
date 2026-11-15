import AsyncStorage from '@react-native-async-storage/async-storage';

import type { KV } from './types';

export const store: KV = {
  get: (k) => AsyncStorage.getItem(k).catch(() => null),
  set: (k, v) => AsyncStorage.setItem(k, v).catch(() => {}),
};
