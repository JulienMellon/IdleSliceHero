import type { Scene } from '../../../types';
import { panel } from './kit';

// ───────────────────────────── BOSTON · the bridge and NORTH END · Father Dom ─────────────────────────────
// Text is docs/story/BOSTON-SCRIPT.md (card W3). Trigger counts are the home city's shops in the same build order (card E3 fits Boston's own).
export const NORTH_END_SCENES: Scene[] = [
  {
    id: 'boston-0',
    city: 'boston',
    character: 'nonna-rosa',
    neighborhood: 'north-end',
    beat: 'interlude',
    title: 'Promotion',
    trigger: { kind: 'unlock', neighborhood: 'north-end' },
    panels: [
      panel('shop', [['nonna-rosa', 'happy']], `Port Marinara. Every Rosa's has a manager now, and a new word on the sign: FRANCHISE.`, [
        ['Nonna Rosa', `You don't lose shops, cara mia. They grow up. Like children, but they send money home.`],
      ]),
      panel('shop', [['nonna-rosa', 'neutral'], ['megaslice-rep', 'happy']], null, [
        ['Nonna Rosa', `Last time, I gave you the keys to a shop. This time, I give you a city.`],
        ['Todd', `I have a clipboard now. Also: in Boston, don't believe Trish. Not even her "hello."`],
      ], { prop: 'name-tag', propText: `TODD · ROSA'S` }),
      panel('north-end', [], `Boston. Snow on old brick. Church bells. A new sign: Rosa's North End.`, [
        ['You', `New city. Same sauce. Ugly sweater.`],
      ], { cue: 'city-theme' }),
      panel('megaslice-hq', [['victor-crust', 'neutral'], ['trish-vance', 'happy']], `MegaSlice Boston. Top floor. The blinds are closed. They are always closed.`, [
        ['Trish', `Great news, Victor. The pizza person is in Boston. It's already handled.`],
        ['Victor Crust', `Trish. Finally, somebody who brings me great news.`],
      ], { prop: 'name-tag', propText: 'TRISH VANCE · REGIONAL VP' }),
      panel('megaslice-hq', [['trish-vance', 'neutral']], `She closes the blinds a little more.`, [
        ['Trish', `Lovely city, Boston. I've never been here before in my life.`],
      ]),
    ],
  },
  {
    id: 'north-end-1',
    city: 'boston',
    character: 'father-dom',
    neighborhood: 'north-end',
    beat: 1,
    title: 'Bells and Cannoli',
    trigger: { kind: 'unlock', neighborhood: 'north-end' },
    requires: ['boston-0'],
    panels: [
      panel('north-end', [], `North End. Narrow streets, old bells, and a line out of every bakery but the church's.`, []),
      panel('north-end', [['father-dom', 'happy']], null, [
        ['Father Dom', `Welcome, welcome! Father Dom, St. Agatha's. I bless boats, babies and ovens.`],
        ['Father Dom', `Mostly ovens, lately. The boats stopped asking.`],
      ], { cue: 'welcome' }),
      panel('shop', [['father-dom', 'neutral']], null, [
        ['Father Dom', `After Mass, the whole street gets hungry at once. You'll get a line. Then a rush.`],
        ['Father Dom', `Feed the line fast and the rush feeds you. That's not scripture. It should be.`],
      ]),
      panel('north-end', [['father-dom', 'sad']], `Across the square: a folding table, a hand-lettered sign. ST. AGATHA'S BAKE SALE.`, [
        ['Father Dom', `Our bake sale keeps the church lights on.`],
        ['Father Dom', `Lately, they flicker. I tell people it's the Holy Spirit.`],
      ]),
    ],
  },
  {
    id: 'north-end-2',
    city: 'boston',
    character: 'father-dom',
    neighborhood: 'north-end',
    beat: 2,
    title: 'The Bake Sale',
    trigger: { kind: 'deliveries', neighborhood: 'north-end', count: 424 },
    panels: [
      panel('north-end', [['father-dom', 'surprised']], `Sunday. Your line wraps around the church. The bake sale table sits untouched.`, [
        ['Father Dom', `A line! Around MY church! I haven't seen that since the bingo riot.`],
      ]),
      panel('north-end', [['father-dom', 'sad']], null, [
        ['Father Dom', `And yet. Look at my table. Nobody's buying cannoli.`],
        ['You', `Is it the cannoli?`],
        ['Father Dom', `The cannoli are perfect. I made them. I went to confession about how perfect.`],
      ]),
      panel('north-end', [['father-dom', 'angry']], `Under every windshield wiper: a glossy coupon. FREE MEGASLICE WITH ANY PRAYER.`, [
        ['Father Dom', `They're on every car. In every pew. Somebody put one in the holy water.`],
      ], { prop: 'coupon' }),
    ],
  },
  {
    id: 'north-end-3',
    city: 'boston',
    character: 'father-dom',
    neighborhood: 'north-end',
    beat: 3,
    title: 'Very Visible. Very Holy.',
    trigger: { kind: 'deliveries', neighborhood: 'north-end', count: 941 },
    panels: [
      panel('north-end', [['trish-vance', 'happy']], `Overnight, a MegaSlice opens across the square. Name tag: TRISH VANCE, REGIONAL VP.`, [
        ['Trish', `Father! Great news. MegaSlice is sponsoring your bake sale. Forever.`],
      ], { prop: 'name-tag', propText: 'TRISH VANCE · REGIONAL VP' }),
      panel('north-end', [['father-dom', 'surprised'], ['trish-vance', 'neutral']], null, [
        ['Father Dom', `Sponsoring how?`],
        ['Trish', `Your table moves inside our store. Next to the soda machine. Very visible. Very holy.`],
        ['Father Dom', `I've heard a lot of confessions, miss. You lie better than all of them.`],
      ]),
      panel('megaslice-hq', [['victor-crust', 'happy'], ['trish-vance', 'happy']], null, [
        ['Trish', `Great news, Victor. The North End is ours. The priest wept with joy.`],
        ['Victor Crust', `Trish. A VP who wins. I may need a bigger title for you.`],
      ]),
      panel('north-end', [['father-dom', 'neutral']], null, [
        ['Father Dom', `This Sunday, we sell everything on that table. Cannoli, pizza, my good hat.`],
        ['Father Dom', `Then we ring the bells so loud she hears them through her coupons.`],
      ]),
    ],
  },
  {
    id: 'north-end-5',
    city: 'boston',
    character: 'father-dom',
    neighborhood: 'north-end',
    beat: 'interlude',
    title: 'The Squeaky Pew',
    trigger: { kind: 'after', neighborhood: 'north-end', scene: 'north-end-3', seconds: 300 },
    panels: [
      panel('north-end', [['father-dom', 'surprised'], ['trish-vance', 'neutral']], `Dawn. St. Agatha's is empty, except for a woman in a MegaSlice blazer.`, [
        ['Father Dom', `Miss Vance. We're not open yet.`],
        ['Trish', `Checking the real estate. For a store. Purely business.`],
      ]),
      panel('north-end', [['father-dom', 'neutral'], ['trish-vance', 'sad']], `She lights a candle. She sits in the back pew without looking. It doesn't squeak.`, [
        ['Father Dom', `Every visitor sits on the squeaky pew. You skipped it.`],
        ['Trish', `Lucky guess. I'm not from here. I've never been to Boston.`],
      ]),
      panel('north-end', [['father-dom', 'surprised']], `In the poor box: a crisp envelope, thick with cash. A note: "For the roof. — P."`, [
        ['Father Dom', `"P." Not "T." Lord, who is this woman?`],
      ], { prop: 'envelope' }),
    ],
  },
  {
    id: 'north-end-4',
    city: 'boston',
    character: 'father-dom',
    neighborhood: 'north-end',
    beat: 4,
    title: 'The Bells',
    trigger: { kind: 'challenge', neighborhood: 'north-end' },
    requires: ['north-end-5'],
    perk: true,
    panels: [
      panel('north-end', [], `Across the square, the MegaSlice lights are off. A coupon blows down the alley.`, []),
      panel('north-end', [['father-dom', 'happy']], `Sunday. Pizza and cannoli, side by side. Sold out before the last hymn.`, [
        ['Father Dom', `The roof is paid for! Somebody already gave, too. Anonymously. Suspiciously.`],
      ], { cue: 'triumph' }),
      panel('north-end', [['father-dom', 'happy']], `The bells of St. Agatha's ring loud enough to rattle MegaSlice's windows.`, [
        ['Father Dom', `The North End chose you, my friend. Go with God. And extra cheese.`],
      ], { cue: 'bell-triumph' }),
      panel('megaslice-hq', [['victor-crust', 'happy'], ['trish-vance', 'neutral']], null, [
        ['Trish', `Great news. We've exited the North End. Strategically. On purpose.`],
        ['Victor Crust', `Strategic! Brilliant! Somebody promote her!`],
      ]),
    ],
  },
];
