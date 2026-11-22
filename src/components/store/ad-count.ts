// The rolling 7-day count of rewarded ads that paid (card N1), kept with the store prefs (`StorePrefs.adGrants`). The pure rules are in
// store-model.ts (`withAdGrant`, `adCount7`); this is the write: the game store's prefs state and the same saved key game-store.ts writes.
import AsyncStorage from '@react-native-async-storage/async-storage';

import { gameNow } from '../../engine/clock';
import { useGame } from '../../store/game-store';
import { activePrefsKey, withAdGrant } from './store-model';

/** One more rewarded ad paid (called by the ad button; a Nonna's Plus owner takes no ad, so none is counted). */
export function recordAdGrant(): void {
  const prefs = withAdGrant(useGame.getState().prefs, gameNow());
  useGame.setState({ prefs });
  void AsyncStorage.setItem(activePrefsKey(), JSON.stringify(prefs)).catch(() => {});
}
