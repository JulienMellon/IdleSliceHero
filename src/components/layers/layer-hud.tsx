// The layers' HUD chips (HUD_CHIPS slot). Each reads one string off the store, so it repaints when its text changes (once a second at
// most), never on a game tick. A tap opens the layer's info sheet.
import { memo } from 'react';

import { gameDayView } from '../../engine/features/layers/suburbs-gameday';
import { boatsView } from '../../engine/features/layers/waterfront-boats';
import { rivalOpen } from '../../engine/features/layers/rival';
import { useGame } from '../../store/game-store';
import { hoodOf } from './city-layers';
import { LayerChip } from './layer-chip';
import { gameDayChipShown, gameDayChipText } from './suburbs/gameday-model';
import { auctionStatus, harbourChip } from './waterfront/boats-model';
import { rivalTagText } from './rival/rival-model';

/** "Game Day 7:42": the countdown to the next game; red during the rush. */
export const GameDayChip = memo(function GameDayChip() {
  const text = useGame((s) => {
    const v = gameDayView(s.game, Date.now());
    return gameDayChipShown(v, s.game.active, hoodOf(s.game, 'gameDay')) ? gameDayChipText(v, s.game.city) : '';
  });
  const hot = useGame((s) => gameDayView(s.game, Date.now()).rush);
  return <LayerChip id="gameday-chip" text={text} hot={hot} sheet="gameday" />;
});

/** The harbour's chip: the docked boat's stay, the auction's next raise, or the next boat. */
export const HarbourChip = memo(function HarbourChip() {
  // "sheet|hot|text" in one string, so one selector keeps the three in step
  const key = useGame((s) => {
    const c = harbourChip(boatsView(s.game, Date.now()), auctionStatus(s.game), s.game.active, s.game.city, hoodOf(s.game, 'boats'));
    return c ? `${c.sheet}|${c.hot ? 1 : 0}|${c.text}` : '';
  });
  if (!key) return null;
  const [sheet, hot, ...rest] = key.split('|');
  return <LayerChip id="harbour-chip" text={rest.join('|')} hot={hot === '1'} sheet={sheet as 'boat' | 'auction'} />;
});

/** "-20% sales": the rival's tag, while a MegaSlice shop is open across from the shop on screen. */
export const RivalTag = memo(function RivalTag() {
  // U19: the tag needs only whether the rival is open; rivalView would also price the challenge (a featureMults pass) on every 5 Hz set
  const text = useGame((s) => rivalTagText({ open: rivalOpen(s.game, s.game.active) }));
  return <LayerChip id="rival-tag" text={text} hot sheet="rival" />;
});
