// Uptown's Ingredients card (DRAWER_CARDS slot): the next tier of the Ingredients track (Store-brand, Imported, Farm, Truffle), +1 rating point
// for its price. Same card and button as the other upgrades (StationCard, buttonTone). Only in the Uptown drawer. Selects a string, so the
// card repaints when its words or its price change, and when the player can or can't afford it.
import { memo } from 'react';

import { useGame } from '../../../store/game-store';
import { StarIcon } from '../../icons';
import { StationCard } from '../../shop-ui';
import { buttonTone } from '../../sidewalk-model';
import { ingredientsCardModel } from './stars-model';

export const IngredientsCard = memo(function IngredientsCard() {
  const key = useGame((s) => (s.game.active === 'uptown' && s.game.shops.uptown.built ? JSON.stringify(ingredientsCardModel(s.game)) : ''));
  const buy = useGame((s) => s.buyIngredients);
  if (!key) return null;
  const m = JSON.parse(key) as ReturnType<typeof ingredientsCardModel>;
  return (
    <StationCard
      testID="buy-ingredients"
      icon={<StarIcon size={26} />}
      title={m.title}
      level={m.level}
      detail={m.detail}
      cost={m.cost}
      costLabel="MAX"
      canBuy={m.canBuy}
      tone={buttonTone({ lock: m.lock, gain: 1 })}
      onBuy={buy}
    />
  );
});
