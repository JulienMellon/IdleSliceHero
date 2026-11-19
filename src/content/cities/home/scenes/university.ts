import type { Scene } from '../../../types';

// ───────────────────────────── UNIVERSITY · Priya ─────────────────────────────
// Text is the Todd script (docs/story/STORY-v4-final.md, Julien 2026-11-14: where it disagrees with an earlier fix, the script wins) plus the v5.16 copy (docs/story/COPY-v5.16.md).
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
          { speaker: 'Priya', text: "Hi. One plain cheese slice. Your cheapest one. I'm paying in quarters." },
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
          { speaker: 'Priya', text: "Also, your driver's route is a crime. I'm writing it down." },
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
        caption: "Night 63 of Priya's plain cheese slice.",
        lines: [{ speaker: 'Priya', text: "Your driver took a weird route. I mapped it. You're losing four minutes a trip." }],
      },
      {
        backdrop: 'university',
        cast: [{ id: 'priya', mood: 'happy' }],
        lines: [
          { speaker: 'Priya', text: 'So I wrote a little routing app. On a napkin. Then on a laptop. Mostly laptop.' },
          { speaker: 'You', text: 'You built that... for one slice of pizza?' },
          { speaker: 'Priya', text: "For a HOT slice of pizza. There's a difference." },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'priya', mood: 'happy' }],
        lines: [
          { speaker: 'You', text: "Priya, how'd you like a job? Paid in actual money. And unlimited slices." },
          { speaker: 'Priya', text: "Unlimited?? Okay. Okay okay okay. I'm in." },
          { speaker: 'Raj', text: 'Welcome aboard. I’ll send you my dough spreadsheet. It’s peer-reviewed.' },
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
    requires: ['waterfront-5'],
    panels: [
      {
        backdrop: 'university',
        cast: [{ id: 'megaslice-rep', mood: 'happy' }],
        caption: 'Career fair. MegaSlice has a booth. It has a smoke machine.',
        lines: [{ speaker: 'Todd', text: 'Priya! Come code for MegaSlice! Free kombucha! Beanbags! A LADDER!' }],
      },
      {
        backdrop: 'university',
        prop: 'name-tag',
        propText: 'UNPAID INTERN',
        cast: [
          { id: 'priya', mood: 'surprised' },
          { id: 'megaslice-rep', mood: 'neutral' },
        ],
        caption: "Todd's name tag: UNPAID INTERN.",
        lines: [
          { speaker: 'Priya', text: 'What would I be building?' },
          { speaker: 'Todd', text: 'An app that tells people our pizza is good. Very advanced. Mostly lying.' },
        ],
      },
      {
        backdrop: 'megaslice-hq',
        cast: [{ id: 'victor-crust', mood: 'neutral' }],
        lines: [
          { speaker: 'Victor Crust', text: 'Every genius has a price. Find hers. Double it. Then triple it.' },
          { speaker: 'Victor Crust', text: 'Go, Dodd.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'priya', mood: 'sad' }],
        lines: [{ speaker: 'Priya', text: 'They offered me a lot. Like, "pay off my loans" a lot. I need to think.' }],
      },
    ],
  },
  {
    id: 'university-3b',
    city: 'home',
    character: 'priya',
    neighborhood: 'university',
    beat: 'interlude',
    title: 'Follow the Pepperoni',
    trigger: { kind: 'after', neighborhood: 'university', scene: 'university-3', seconds: 360 },
    panels: [
      {
        backdrop: 'university',
        cast: [{ id: 'priya', mood: 'neutral' }],
        caption: "Priya still hasn't answered MegaSlice. She has been busy.",
        lines: [{ speaker: 'Priya', text: 'If I might work there, I want to know who works there.' }],
      },
      {
        backdrop: 'university',
        prop: 'order-slip',
        cast: [{ id: 'priya', mood: 'surprised' }],
        lines: [
          { speaker: 'Priya', text: 'Your Mr. Smith? Every drop-off is one block from a MegaSlice. Every one.' },
          { speaker: 'You', text: 'So he lives near MegaSlice?' },
          { speaker: 'Priya', text: 'Nobody lives near MegaSlice. On purpose.' },
        ],
      },
      {
        backdrop: 'university',
        cast: [{ id: 'priya', mood: 'neutral' }],
        lines: [
          { speaker: 'Priya', text: "Your best customer works there. I'm going to find out who." },
          { speaker: 'Priya', text: "Don't ask how. It's a side project. It's not ready. It's ready enough." },
        ],
      },
    ],
  },
  {
    id: 'university-3c',
    city: 'home',
    character: 'priya',
    neighborhood: 'university',
    beat: 'interlude',
    title: 'Test Flight',
    trigger: { kind: 'after', neighborhood: 'university', scene: 'university-3b', seconds: 420 },
    panels: [
      {
        backdrop: 'university',
        prop: 'phone-footage',
        cast: [{ id: 'priya', mood: 'neutral' }],
        caption: "Footage from Priya's side project. She won't say what it is.",
        lines: [
          { speaker: 'You', text: 'Is that... filmed from the sky?' },
          { speaker: 'Priya', text: "No comment. It's not a drone." },
        ],
      },
      {
        backdrop: 'university',
        prop: 'phone-footage',
        cast: [{ id: 'priya', mood: 'surprised' }],
        caption: 'A MegaSlice stairwell. A man wipes off his mustache. With a napkin.',
        lines: [{ speaker: 'Priya', text: "That's the career-fair guy. The ladder guy. Todd." }],
      },
      {
        backdrop: 'university',
        prop: 'phone-footage',
        cast: [{ id: 'priya', mood: 'happy' }],
        caption: 'Todd eats the whole pie. Even the crust.',
        lines: [
          { speaker: 'Priya', text: "Data says MegaSlice can't even keep its own people." },
          { speaker: 'Priya', text: "Spreadsheet says... he's crying into the crust. I have my answer." },
        ],
      },
    ],
  },
  {
    id: 'university-hire',
    city: 'home',
    character: 'priya',
    neighborhood: 'university',
    beat: 'interlude',
    title: 'A Chapter About You',
    trigger: { kind: 'manager', neighborhood: 'university' },
    panels: [
      {
        backdrop: 'shop',
        cast: [
          { id: 'priya', mood: 'happy' },
          { id: 'noor', mood: 'neutral' },
        ],
        caption: 'Priya brings a friend with a stopwatch.',
        lines: [
          { speaker: 'Priya', text: 'You hired a manager! I sent my TA. Noor. She’s writing a thesis on queues.' },
          { speaker: 'Priya', text: 'Your line is her favorite queue in the city. That’s a compliment. I think.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'noor', mood: 'happy' }],
        lines: [
          { speaker: 'Noor', text: 'Hi. I’ve timed your line since the day you opened. Don’t worry. It’s anonymous.' },
          { speaker: 'Noor', text: 'There’s a whole chapter about you in my thesis. You won’t like the title.' },
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
    trigger: { kind: 'challenge', neighborhood: 'university' },
    requires: ['university-3c'],
    reward: 'drones',
    perk: true,
    panels: [
      {
        backdrop: 'shop',
        cast: [{ id: 'priya', mood: 'happy' }],
        caption: 'Priya walks in. Decision made. She is carrying something with propellers.',
        lines: [
          { speaker: 'Priya', text: 'I said no to MegaSlice. Their code was spaghetti. And not the good kind.' },
          { speaker: 'Priya', text: 'Also you gave me a slice when I had only buttons. That counts for a lot.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'priya', mood: 'surprised' }],
        lines: [
          { speaker: 'You', text: 'Is that... a flying pizza box?' },
          { speaker: 'Priya', text: 'Okay. It was always a drone.' },
          { speaker: 'Priya', text: 'GPS, heat-lock lid, and it says "thank you" in nine languages.' },
        ],
      },
      {
        backdrop: 'university',
        cue: 'triumph',
        cast: [{ id: 'priya', mood: 'happy' }],
        caption: 'A hundred tiny drones lift off over campus. Students cheer.',
        lines: [
          { speaker: 'Priya', text: 'Drones are live! No traffic, no parking, no excuses. Only pizza.' },
          { speaker: 'Noor', text: 'No queue at all. My thesis is ruined. I’ve never been happier.', ifSeen: 'university-hire' },
          { speaker: 'Priya', text: 'Now, about those unlimited slices. I brought a list. It has tabs.' },
        ],
      },
    ],
  },
];
