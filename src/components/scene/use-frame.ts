// The frame a shop is drawn in, for the overlays that sit in it (the SCENE_OVERLAYS layers get a shop id and the content's size, not the frame).
import type { NeighborhoodId } from '../../content/types';
import { useGame } from '../../store/game-store';
import { sceneFrame, type SceneFrame } from './projection';

/** The frame of `shopId` at its current footprint (a stable object per width: safe in memo deps). */
export function useShopFrame(shopId: string): SceneFrame {
  const fp = useGame((s) => s.game.shops[shopId as NeighborhoodId]?.footprint ?? 0);
  return sceneFrame(fp);
}
