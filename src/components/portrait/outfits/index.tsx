// The home characters' outfit pieces over the torso; a city's characters are drawn by its own pack (cities/<id>/portraits.tsx) and merged in here.
import { G, Path } from 'react-native-svg';

import type { CharacterId } from '../../../content/types';
import { CITY_ART } from '../../cities';
import type { OutfitFn, OutfitProps } from '../../cities/types';
import { OUTFIT } from '../../cutscene/figure-art';
import { shade } from '../../scene/projection';
import { INK, THIN } from '../ink';

/** Each registered city's outfit pieces by character, merged (cities/index.ts). */
const CITY_OUTFITS: Partial<Record<CharacterId, OutfitFn>> = Object.assign({}, ...CITY_ART.map((c) => c.portraits.outfits));

/** What a stage figure wears over its torso: a city's characters first, then the home cast. */
export function Outfit({ who, shirt, tone }: OutfitProps) {
  const city = CITY_OUTFITS[who];
  if (city) return city({ who, shirt, tone });
  const thin = THIN;
  switch (who) {
    case 'nonna-rosa':
      return (
        <G>
          <Path d={OUTFIT.apronStraps} stroke={INK} strokeWidth={5.4} strokeLinecap="round" fill="none" />
          <Path d={OUTFIT.apronStraps} stroke={tone('#FFFFFF')} strokeWidth={3} strokeLinecap="round" fill="none" />
          <Path d={OUTFIT.apronBib} fill={tone('#FFFFFF')} {...thin} strokeWidth={1.8} />
          <Path d={OUTFIT.apronPocket} fill="none" stroke={tone('#D9CFC4')} strokeWidth={1.6} />
        </G>
      );
    case 'dale':
      return (
        <G>
          <Path d={OUTFIT.poloCollar} fill={tone(shade(shirt, 0.25))} {...thin} />
          <Path d={OUTFIT.lanyard} stroke={tone('#F2C94C')} strokeWidth={2.2} fill="none" />
          <Path d={OUTFIT.whistle} fill={tone('#C9CED6')} {...thin} strokeWidth={1.3} />
        </G>
      );
    case 'victor-crust':
    case 'megaslice-rep': {
      const rep = who === 'megaslice-rep';
      return (
        <G>
          <Path d={OUTFIT.suitV} fill={tone('#F4F1EC')} {...thin} />
          <Path d={OUTFIT.tie} fill={tone(rep ? '#FFC531' : '#E8432E')} {...thin} strokeWidth={1.3} />
          <Path d={OUTFIT.lapels} fill={tone(shade(shirt, -0.22))} {...thin} />
          <Path d={rep ? OUTFIT.nameBadge : OUTFIT.pocketSquare} fill={tone(rep ? '#FFC531' : '#F4F1EC')} {...thin} strokeWidth={1.1} />
        </G>
      );
    }
    case 'mr-smith':
    case 'todd-coat':
      // a tan trench coat: a cream shirt and a dark tie between two wide lapels, a belt with a brass buckle
      return (
        <G>
          <Path d={OUTFIT.suitV} fill={tone('#F4F1EC')} {...thin} />
          <Path d={OUTFIT.tie} fill={tone('#6B3A22')} {...thin} strokeWidth={1.3} />
          <Path d={OUTFIT.trenchLapels} fill={tone('#A98557')} {...thin} />
          <Path d={OUTFIT.trenchBelt} fill={tone('#7A5632')} {...thin} />
          <Path d={OUTFIT.trenchSeam} stroke={INK} strokeWidth={1.2} fill="none" />
          <Path d={OUTFIT.trenchBuckle} fill={tone('#F2C94C')} {...thin} strokeWidth={1.2} />
        </G>
      );
    case 'deb':
      // a cream blouse, the whistle Dale gave her on a red lanyard
      return (
        <G>
          <Path d={OUTFIT.shirtV} fill={tone('#F4F1EC')} {...thin} />
          <Path d={OUTFIT.lanyard} stroke={tone('#E8432E')} strokeWidth={2.4} fill="none" />
          <Path d={OUTFIT.whistle} fill={tone('#C9CED6')} {...thin} strokeWidth={1.3} />
        </G>
      );
    case 'skip':
      // a grey purser's jacket: cream shirt, dark tie, a column of brass buttons
      return (
        <G>
          <Path d={OUTFIT.suitV} fill={tone('#F4F1EC')} {...thin} />
          <Path d={OUTFIT.tie} fill={tone('#1F2D46')} {...thin} strokeWidth={1.3} />
          <Path d={OUTFIT.lapels} fill={tone(shade(shirt, -0.22))} {...thin} />
          <Path d={OUTFIT.brassColumn} fill={tone('#F2C94C')} stroke={INK} strokeWidth={0.9} />
        </G>
      );
    case 'noor':
      // a mustard cardigan, the stopwatch on its red lanyard
      return (
        <G>
          <Path d={OUTFIT.teeStrip} fill={tone('#F4F1EC')} {...thin} />
          <Path d={OUTFIT.watchCord} stroke={tone('#D9443A')} strokeWidth={2.2} fill="none" />
          <Path d={OUTFIT.watchCrown} fill={tone('#C9CED6')} {...thin} strokeWidth={1.2} />
          <Path d={OUTFIT.watchBody} fill={tone('#F4F1EC')} stroke={INK} strokeWidth={2} />
          <Path d={OUTFIT.watchHands} stroke={INK} strokeWidth={1.6} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'dee':
      // a hi-vis vest over a navy shirt, with the silver tape
      return (
        <G>
          <Path d={OUTFIT.shirtV} fill={tone('#26354F')} {...thin} />
          <Path d={OUTFIT.vestStripes} fill={tone('#E9EDF0')} stroke={INK} strokeWidth={1} />
        </G>
      );
    case 'anton':
      // a black waistcoat and bow tie over a white shirt
      return (
        <G>
          <Path d={OUTFIT.waistcoat} fill={tone('#1E1E24')} {...thin} />
          <Path d={OUTFIT.waistcoatButtons} fill={tone('#C9CED6')} />
          <Path d={OUTFIT.bowTie} fill={tone('#B52C1C')} {...thin} strokeWidth={1.2} />
          <Path d={OUTFIT.bowKnot} fill={tone('#8E2A1E')} stroke={INK} strokeWidth={1} />
        </G>
      );
    case 'genevieve':
      return (
        <G>
          <Path d={OUTFIT.turtleneck} fill={tone('#1C1C1C')} {...thin} />
          <Path d={OUTFIT.turtleFolds} stroke={tone('#3A3A3A')} strokeWidth={1.2} fill="none" />
          <Path d={OUTFIT.pearls} fill={tone('#FFFDF5')} stroke={INK} strokeWidth={0.8} />
        </G>
      );
    case 'priya':
      // Priya: cardigan over a tee, campus lanyard
      return (
        <G>
          <Path d={OUTFIT.teeStrip} fill={tone('#F4F1EC')} {...thin} />
          <Path d={OUTFIT.badgeCord} stroke={tone('#2F80ED')} strokeWidth={2} fill="none" />
          <Path d={OUTFIT.badge} fill={tone('#FFFFFF')} {...thin} strokeWidth={1.2} />
        </G>
      );
    case 'big-sal':
      // Big Sal: hi-vis work shirt with reflective tape
      return <Path d={OUTFIT.vestStripes} fill={tone('#E9EDF0')} stroke={INK} strokeWidth={1} />;
    case 'marisol':
      // Captain Marisol: double-breasted jacket, brass buttons and epaulettes
      return (
        <G>
          <Path d={OUTFIT.shirtV} fill={tone('#F4F1EC')} {...thin} />
          <Path d={OUTFIT.jacketLine} stroke={INK} strokeWidth={1.4} fill="none" />
          <Path d={OUTFIT.brass} fill={tone('#F2C94C')} stroke={INK} strokeWidth={0.9} />
        </G>
      );
    default:
      return null;
  }
}
