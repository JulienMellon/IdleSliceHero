import type { Scene } from '../../types';

// ───────────────────────────── UNIVERSITY · Priya ─────────────────────────────
export const UNIVERSITY_SCENES: Scene[] = [
  {
    id: 'university-1',
    city: 'home',
    character: 'priya',
    neighborhood: 'university',
    beat: 1,
    title: 'The Cheapest Slice',
    trigger: { kind: 'unlock', neighborhood: 'university' },
    panels: [
      {
        backdrop: 'university',
        cast: [],
        caption: 'University District, finals week. Your new shop opens. Students pour in.',
        lines: [],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'priya', mood: 'neutral' }],
        lines: [
          { speaker: 'Priya', text: 'Hi. One plain cheese slice. Your cheapest one. I’m paying in quarters.' },
          { speaker: 'Priya', text: 'Some dimes. One button. Is a button legal tender? Asking for me.' },
        ],
      },
      {
        backdrop: 'university',
        cast: [{ id: 'priya', mood: 'happy' }],
        lines: [
          { speaker: 'Priya', text: 'Priya. Computer science, year three. Sleep, year zero.' },
          { speaker: 'Priya', text: 'Students order nonstop, all night. Your new place will never be empty.' },
        ],
      },
      {
        backdrop: 'university',
        cast: [{ id: 'priya', mood: 'neutral' }],
        lines: [
          { speaker: 'Priya', text: 'Same time tomorrow? Same slice. Same quarters. Probably fewer quarters.' },
        ],
      },
    ],
  },
  {
    id: 'university-2',
    city: 'home',
    character: 'priya',
    neighborhood: 'university',
    beat: 2,
    title: 'Debugging Dinner',
    trigger: { kind: 'deliveries', neighborhood: 'university', count: 30000 },
    panels: [
      {
        backdrop: 'university',
        cast: [{ id: 'priya', mood: 'surprised' }],
        caption: 'Night 63 of Priya’s plain cheese slice.',
        lines: [
          { speaker: 'Priya', text: 'Your driver took a weird route. I mapped it. You’re losing four minutes a trip.' },
        ],
      },
      {
        backdrop: 'university',
        cast: [{ id: 'priya', mood: 'happy' }],
        lines: [
          { speaker: 'Priya', text: 'So I wrote a little routing app. On a napkin. Then on a laptop. Mostly laptop.' },
          { speaker: 'You', text: 'You built that… for one slice of pizza?' },
          { speaker: 'Priya', text: 'For a HOT slice of pizza. There’s a difference.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'priya', mood: 'happy' }],
        lines: [
          { speaker: 'You', text: 'Priya, how’d you like a job? Paid in actual money. And unlimited slices.' },
          { speaker: 'Priya', text: 'Unlimited?? Okay. Okay okay okay. I’m in.' },
        ],
      },
    ],
  },
  {
    id: 'university-3',
    city: 'home',
    character: 'priya',
    neighborhood: 'university',
    beat: 3,
    title: 'Poached',
    trigger: { kind: 'deliveries', neighborhood: 'university', count: 135000 },
    panels: [
      {
        backdrop: 'university',
        cast: [{ id: 'megaslice-rep', mood: 'happy' }],
        caption: 'Career fair. MegaSlice has a booth. It has a smoke machine.',
        lines: [
          { speaker: 'MegaSlice Rep', text: 'Priya! Come code for MegaSlice! Free kombucha! Beanbags! A LADDER!' },
        ],
      },
      {
        backdrop: 'university',
        cast: [
          { id: 'priya', mood: 'surprised' },
          { id: 'megaslice-rep', mood: 'neutral' },
        ],
        lines: [
          { speaker: 'Priya', text: 'What would I be building?' },
          { speaker: 'MegaSlice Rep', text: 'An app that tells people our pizza is good. Very advanced. Mostly lying.' },
        ],
      },
      {
        backdrop: 'megaslice-hq',
        cast: [{ id: 'victor-crust', mood: 'neutral' }],
        lines: [
          { speaker: 'Victor Crust', text: 'Every genius has a price. Find hers. Double it. Then triple it.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'priya', mood: 'sad' }],
        lines: [
          { speaker: 'Priya', text: 'They offered me a lot. Like, “pay off my loans” a lot. I need to think.' },
        ],
      },
    ],
  },
  {
    id: 'university-4',
    city: 'home',
    character: 'priya',
    neighborhood: 'university',
    beat: 4,
    title: 'Drone Launch',
    trigger: { kind: 'deliveries', neighborhood: 'university', count: 450000 },
    perk: true,
    reward: 'drones',
    panels: [
      {
        backdrop: 'shop',
        cast: [{ id: 'priya', mood: 'happy' }],
        caption: 'Priya returns. She is carrying something with propellers.',
        lines: [
          { speaker: 'Priya', text: 'I said no to MegaSlice. Their code was spaghetti. And not the good kind.' },
          { speaker: 'Priya', text: 'Also, you gave me a slice when all I had was buttons. That counts for a lot.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'priya', mood: 'surprised' }],
        lines: [
          { speaker: 'You', text: 'Is that… a flying pizza box?' },
          { speaker: 'Priya', text: 'Delivery drone. GPS, heat-lock lid, and it says “thank you” in nine languages.' },
        ],
      },
      {
        backdrop: 'university',
        cue: 'triumph',
        cast: [{ id: 'priya', mood: 'happy' }],
        caption: 'A hundred tiny drones lift off over campus. Students cheer.',
        lines: [
          { speaker: 'Priya', text: 'Drones are live! No traffic, no parking, no excuses. Only pizza.' },
          { speaker: 'Priya', text: 'University is officially Team You. Now… about those unlimited slices.' },
        ],
      },
    ],
  },
];
