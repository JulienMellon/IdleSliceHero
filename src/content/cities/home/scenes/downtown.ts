import type { Scene } from '../../../types';

// ───────────────────────────── DOWNTOWN · Nonna Rosa ─────────────────────────────
// Text is the Todd script (docs/story/STORY-v4-final.md, Julien 2026-11-14: where it disagrees with an earlier fix, the script wins) plus the v5.16 copy (docs/story/COPY-v5.16.md).
export const DOWNTOWN_SCENES: Scene[] = [
  {
    id: 'downtown-1',
    city: 'home',
    character: 'nonna-rosa',
    neighborhood: 'downtown',
    beat: 1,
    title: 'The Keys',
    trigger: { kind: 'unlock', neighborhood: 'downtown' },
    panels: [
      {
        backdrop: 'downtown-rain',
        cast: [{ id: 'mr-smith', mood: 'neutral' }],
        caption: 'Port Marinara. Rain. One flickering sign: "Rosa\'s Pizza."',
        lines: [
          { speaker: 'Trench Coat', text: 'Target located. Commencing surveillance.' },
          { speaker: 'Trench Coat', text: "Also I dropped my MegaSlice badge. Don't look at it." },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'sad' }],
        caption: 'Inside, one oven. Zero customers.',
        lines: [
          { speaker: 'Nonna Rosa', text: 'Fifty years I run this shop. Now? Even the mice order from MegaSlice.' },
          { speaker: 'Nonna Rosa', text: 'My knees are done. So, cara mia... the keys are yours.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'surprised' }],
        lines: [
          { speaker: 'You', text: 'What if we did delivery? Maybe an app? Some marketing?' },
          { speaker: 'Nonna Rosa', text: '"App." "Marketing." Modern ideas! In my day, the pizza WAS the marketing.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'neutral' }],
        lines: [
          { speaker: 'Nonna Rosa', text: 'Fine. First you bake. I show you how. Watch, then tap!' },
          { speaker: 'Nonna Rosa', text: 'Then hire workers. Drivers to deliver, more cooks for the kitchen. Capisce?' },
        ],
      },
      {
        backdrop: 'downtown',
        cue: 'welcome',
        cast: [{ id: 'nonna-rosa', mood: 'happy' }],
        lines: [{ speaker: 'Nonna Rosa', text: "Make Downtown smell like Rosa's again. I'll be watching. Always watching." }],
      },
    ],
  },
  {
    id: 'downtown-1b',
    city: 'home',
    character: 'nonna-rosa',
    neighborhood: 'downtown',
    beat: 'interlude',
    title: 'The Chair',
    trigger: { kind: 'after', neighborhood: 'downtown', scene: 'downtown-1', seconds: 190 },
    panels: [
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'neutral' }],
        caption: 'Nonna has dragged her old chair to the door. It creaks. So does she.',
        lines: [
          { speaker: 'Nonna Rosa', text: 'My knees, they retire. My eyes? Never. From here, I supervise.' },
          { speaker: 'You', text: 'Supervise what, exactly?' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'angry' }],
        lines: [
          { speaker: 'Nonna Rosa', text: 'You. You hold the dough like it owes you money.' },
          { speaker: 'You', text: 'Is that bad?' },
          { speaker: 'Nonna Rosa', text: 'Gentle, cara. Dough remembers. So do I.' },
        ],
      },
      {
        backdrop: 'downtown',
        cast: [
          { id: 'nonna-rosa', mood: 'surprised' },
          { id: 'mr-smith', mood: 'neutral' },
        ],
        caption: 'Across the street, a trench coat walks past. Slowly. Again.',
        lines: [
          { speaker: 'Nonna Rosa', text: 'That man. He walks past my window again and again. He thinks I don’t see.' },
          { speaker: 'Nonna Rosa', text: 'I never forget a face, cara. Even one hiding in a collar.' },
        ],
      },
    ],
  },
  {
    id: 'downtown-2',
    city: 'home',
    character: 'nonna-rosa',
    neighborhood: 'downtown',
    beat: 2,
    title: 'First Regulars',
    trigger: { kind: 'deliveries', neighborhood: 'downtown', count: 424 },
    panels: [
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'surprised' }],
        caption: 'Four hundred deliveries. The phone is actually ringing.',
        lines: [{ speaker: 'Nonna Rosa', text: 'The phone! It rings! I thought it was broken since 1997.' }],
      },
      {
        backdrop: 'downtown',
        cast: [{ id: 'nonna-rosa', mood: 'neutral' }],
        lines: [
          { speaker: 'Nonna Rosa', text: 'The drivers, they come back fast. Hmph. Buy them better rides. Go faster.' },
          { speaker: 'You', text: 'Wait, are you endorsing a modern idea?' },
          { speaker: 'Nonna Rosa', text: 'I endorse nothing. I am simply... noticing.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'happy' }],
        lines: [
          { speaker: 'You', text: 'Our first regular is a "Mr. Smith." He tipped in MegaSlice coupons.' },
          { speaker: 'Nonna Rosa', text: 'Suspicious. But a tip is a tip.' },
          { speaker: 'Nonna Rosa', text: 'Four hundred pizzas. Is small. Is a start. Keep going, eh?' },
        ],
      },
    ],
  },
  {
    id: 'downtown-2b',
    city: 'home',
    character: 'nonna-rosa',
    neighborhood: 'downtown',
    beat: 'interlude',
    title: 'The Fine Print',
    trigger: { kind: 'after', neighborhood: 'downtown', scene: 'downtown-2', seconds: 186 },
    panels: [
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'happy' }],
        caption: 'Nonna has found a use for Mr. Smith’s MegaSlice coupons.',
        lines: [
          { speaker: 'Nonna Rosa', text: 'Under the wobbly table. At last, MegaSlice holds something up.' },
          { speaker: 'You', text: 'Nonna, that’s a good one.' },
          { speaker: 'Nonna Rosa', text: 'I have many. I save them for special occasions.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'surprised' }],
        lines: [
          { speaker: 'Nonna Rosa', text: 'Ay, the fine print. “Soon, every pizzeria will be a MegaSlice.”' },
          { speaker: 'You', text: 'That’s not a coupon. That’s a threat.' },
          { speaker: 'Nonna Rosa', text: 'A threat with a discount. Very modern.' },
        ],
      },
      {
        backdrop: 'downtown',
        cast: [{ id: 'nonna-rosa', mood: 'neutral' }],
        caption: 'A long black car slows outside Rosa’s. Then it drives on.',
        lines: [
          { speaker: 'Nonna Rosa', text: 'Fancy car. Nobody fancy comes Downtown, cara. Unless they want something.' },
          { speaker: 'Nonna Rosa', text: 'So we bake. If somebody comes, they find us busy.' },
        ],
      },
    ],
  },
  {
    id: 'downtown-3',
    city: 'home',
    character: 'nonna-rosa',
    neighborhood: 'downtown',
    beat: 3,
    title: 'Corporate Crust',
    trigger: { kind: 'deliveries', neighborhood: 'downtown', count: 941 },
    panels: [
      {
        backdrop: 'shop',
        cast: [{ id: 'megaslice-rep', mood: 'happy' }],
        caption: 'Shiny suit. Muddy shoes. Name tag: TODD, VP OF EXPANSION.',
        lines: [
          { speaker: 'Todd', text: 'Love the vibe! Very "before electricity." MegaSlice wants to buy it!' },
          { speaker: 'Todd', text: 'We\'ll keep the name. Well, the "Pizza" part. Probably.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [
          { id: 'nonna-rosa', mood: 'angry' },
          { id: 'megaslice-rep', mood: 'surprised' },
        ],
        lines: [
          { speaker: 'Nonna Rosa', text: 'Out! Your crust tastes like a cardboard box that gave up!' },
          { speaker: 'Todd', text: "Ma'am, our crust is 40% real bread!" },
        ],
      },
      {
        backdrop: 'megaslice-hq',
        cast: [{ id: 'victor-crust', mood: 'neutral' }],
        lines: [
          { speaker: 'Victor Crust', text: 'One little shop said no? Adorable. Squeeze them, Tad.' },
          { speaker: 'Victor Crust', text: 'Every city bends to MegaSlice. Port Marinara will be no different.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'neutral' }],
        lines: [
          { speaker: 'Nonna Rosa', text: 'They want a fight? We give them pizza. Lots of pizza. Bake, bake!' },
          { speaker: 'Lucia', text: 'My oven’s hot, Zia. Let them come. Nobody gets past that door.' },
        ],
      },
    ],
  },
  // v5.25 (card T3): the interludes between Downtown's beats; each plays after the scene it names (the gaps split the session-1 story waits, scripts/pacing-fit.ts session1).
  {
    id: 'downtown-3b',
    city: 'home',
    character: 'nonna-rosa',
    neighborhood: 'downtown',
    beat: 'interlude',
    title: 'Real Bread',
    trigger: { kind: 'after', neighborhood: 'downtown', scene: 'downtown-3', seconds: 165 },
    panels: [
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'neutral' }],
        caption: 'The day after the suit. Lucia has put a stool in front of the oven.',
        lines: [
          { speaker: 'Lucia', text: 'I sleep here now, Zia. Suits are like mice. They come back.' },
          { speaker: 'Nonna Rosa', text: 'You sleep at home. The oven protects itself. It has fire.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'angry' }],
        lines: [
          { speaker: 'Nonna Rosa', text: '“Real bread,” he says. As if there is another kind.' },
          { speaker: 'You', text: 'You’re still thinking about his crust.' },
          { speaker: 'Nonna Rosa', text: 'I am thinking about OUR crust. Ours is better. And it can be better still.' },
        ],
      },
      {
        backdrop: 'downtown',
        cast: [{ id: 'nonna-rosa', mood: 'happy' }],
        caption: 'Outside, the line reaches the corner.',
        lines: [
          { speaker: 'Nonna Rosa', text: 'Look at them, cara. Every one of them is a “no” to MegaSlice.' },
          { speaker: 'Nonna Rosa', text: 'Keep baking. When Downtown smells like Rosa’s again, I show you something.' },
        ],
      },
    ],
  },
  {
    id: 'downtown-4',
    city: 'home',
    character: 'nonna-rosa',
    neighborhood: 'downtown',
    beat: 4,
    title: 'The Secret Sauce',
    trigger: { kind: 'deliveries', neighborhood: 'downtown', count: 2217 },
    reward: 'auto-bake',
    panels: [
      {
        backdrop: 'downtown',
        cast: [],
        caption: "Two thousand deliveries. Before lunch. Downtown smells like Rosa's again.",
        lines: [],
      },
      {
        backdrop: 'shop',
        cue: 'triumph',
        cast: [{ id: 'nonna-rosa', mood: 'happy' }],
        lines: [
          { speaker: 'Nonna Rosa', text: 'Your "modern ideas"... they work. Don\'t tell anyone I said so.' },
          { speaker: 'Nonna Rosa', text: 'Come. Closer. Nobody has seen this card in fifty years.' },
          { speaker: 'Marco', text: 'Ooh, can I see? I’ll wipe the flour off first. Some of it.' },
        ],
      },
      {
        backdrop: 'shop',
        cue: 'recipe',
        prop: 'recipe-card',
        cast: [{ id: 'nonna-rosa', mood: 'neutral' }],
        caption: 'The secret sauce recipe. It is mostly love. And garlic.',
        lines: [
          { speaker: 'You', text: 'That\'s it? Tomatoes, garlic, basil, and "a whisper of patience"?' },
          { speaker: 'Nonna Rosa', text: 'Is the whisper that matters.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'happy' }],
        lines: [
          { speaker: 'Nonna Rosa', text: 'From now on, I run the Downtown kitchen myself. You rest your tapping finger.' },
          { speaker: 'Nonna Rosa', text: 'You go open shops in the other neighborhoods. Go! Before I get sentimental.' },
        ],
      },
    ],
  },
  {
    id: 'downtown-4b',
    city: 'home',
    character: 'nonna-rosa',
    neighborhood: 'downtown',
    beat: 'interlude',
    title: 'Where Spoons Live',
    trigger: { kind: 'after', neighborhood: 'downtown', scene: 'waterfront-1b', seconds: 540 },
    panels: [
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'happy' }],
        caption: 'Downtown. Nonna runs the kitchen now. The kitchen has noticed.',
        lines: [
          { speaker: 'Marco', text: 'Nonna moved every spoon. I can’t find anything. I love it.' },
          { speaker: 'Nonna Rosa', text: 'A spoon lives where Nonna puts it. Like a grandchild.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'neutral' }],
        lines: [
          { speaker: 'Nonna Rosa', text: 'So. You go to the Waterfront every day now. With the fishermen.' },
          { speaker: 'You', text: 'It’s a good shop, Nonna.' },
          { speaker: 'Nonna Rosa', text: 'Good, you say. Eat something there. The sea makes people thin.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'surprised' }],
        caption: 'Nonna squints at the address on a Waterfront order.',
        lines: [
          { speaker: 'Nonna Rosa', text: 'The Waterfront? Is there still a woman who shouts at gulls? Tall? Bossy?' },
          { speaker: 'Nonna Rosa', text: 'Never mind. Tell nobody I asked.' },
        ],
      },
    ],
  },
  {
    id: 'downtown-4c',
    city: 'home',
    character: 'nonna-rosa',
    neighborhood: 'downtown',
    beat: 'interlude',
    title: 'The Sardine',
    trigger: { kind: 'after', neighborhood: 'downtown', scene: 'suburbs-1b', seconds: 540 },
    panels: [
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'surprised' }],
        lines: [
          { speaker: 'You', text: 'Captain Marisol says she hasn’t forgotten the sardine.' },
          { speaker: 'Nonna Rosa', text: 'MARISOL. Ay. The sardine was fine. A little old. Like her.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'happy' }],
        caption: 'Long ago, two stalls at the old fish market. Bread on one side. Fish on the other.',
        lines: [
          { speaker: 'Nonna Rosa', text: 'Every morning we argued who had the best stall. Every morning I won.' },
          { speaker: 'You', text: 'And what does she say?' },
          { speaker: 'Nonna Rosa', text: 'She says the same. Is a long argument, cara.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'neutral' }],
        lines: [
          { speaker: 'Nonna Rosa', text: 'Tell her: Rosa’s pizza feeds the whole Waterfront now. She will hate that.' },
          { speaker: 'Marco', text: 'Can I take the message? I want to see her face!' },
        ],
      },
    ],
  },
  {
    id: 'downtown-5',
    city: 'home',
    character: 'nonna-rosa',
    neighborhood: 'downtown',
    beat: 'interlude',
    title: 'The Usual',
    trigger: { kind: 'after', neighborhood: 'downtown', scene: 'waterfront-4', seconds: 540 },
    panels: [
      {
        backdrop: 'shop',
        prop: 'order-slip',
        cast: [{ id: 'nonna-rosa', mood: 'neutral' }],
        caption: 'Downtown. Nonna is reading the order slips. All of them.',
        lines: [{ speaker: 'Nonna Rosa', text: 'This Mr. Smith. Every day, one large pepperoni. Every shop we open.' }],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'surprised' }],
        lines: [
          { speaker: 'Nonna Rosa', text: 'Today the driver brings back the empty box. Inside? A mustache.' },
          { speaker: 'You', text: 'Like... a real one?' },
          { speaker: 'Nonna Rosa', text: 'Drawn on. With a marker. It came off on the crust.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'angry' }],
        lines: [
          { speaker: 'Nonna Rosa', text: 'In my day, spies had the decency to grow their own.' },
          { speaker: 'Nonna Rosa', text: 'Next time he orders, you tell me. I want to see this face.' },
        ],
      },
      {
        backdrop: 'shop',
        prop: 'order-slip',
        cast: [{ id: 'nonna-rosa', mood: 'surprised' }],
        caption: 'On the back of the slip: "Sorry in advance about the university. — S."',
        lines: [{ speaker: 'Nonna Rosa', text: "Sorry? Spies don't say sorry. Who IS this man?" }],
      },
    ],
  },
];
