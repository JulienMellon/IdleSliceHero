import type { Scene } from '../../../types';

// ───────────────────────────── UPTOWN · Genevieve ─────────────────────────────
// Text is the Todd script (docs/story/STORY-v4-final.md, Julien 2026-11-14: where it disagrees with an earlier fix, the script wins) plus the v5.16 copy (docs/story/COPY-v5.16.md).
export const UPTOWN_SCENES: Scene[] = [
  {
    id: 'uptown-1',
    city: 'home',
    character: 'genevieve',
    neighborhood: 'uptown',
    beat: 1,
    title: 'One Star',
    trigger: { kind: 'unlock', neighborhood: 'uptown' },
    panels: [
      {
        backdrop: 'uptown',
        cast: [],
        caption: 'Uptown. Tiny dogs in tiny coats. Your newest pizzeria opens.',
        lines: [],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'genevieve', mood: 'neutral' }],
        lines: [
          { speaker: 'Genevieve', text: 'Genevieve Laurent. Food critic. You may have heard of me. Everyone has.' },
          { speaker: 'Genevieve', text: 'A grand opening. How quaint. Let us see. *one dainty bite*' },
        ],
      },
      {
        backdrop: 'uptown',
        cast: [{ id: 'genevieve', mood: 'angry' }],
        lines: [
          { speaker: 'Genevieve', text: 'Lukewarm. Rushed. The basil is... frightened. One star.' },
          { speaker: 'You', text: 'Frightened basil?!' },
        ],
      },
      {
        backdrop: 'uptown',
        cast: [{ id: 'genevieve', mood: 'neutral' }],
        lines: [
          { speaker: 'Genevieve', text: 'Uptown pays the most in the city, darling. So we expect the most.' },
          { speaker: 'Genevieve', text: 'Impress me, and the whole city will follow. Fail, and... well. One star.' },
        ],
      },
    ],
  },
  {
    id: 'uptown-2',
    city: 'home',
    character: 'genevieve',
    neighborhood: 'uptown',
    beat: 2,
    title: 'Second Bite',
    trigger: { kind: 'deliveries', neighborhood: 'uptown', count: 200000 },
    panels: [
      {
        backdrop: 'uptown',
        cast: [{ id: 'genevieve', mood: 'neutral' }],
        caption: 'Genevieve orders again. Purely for research, she insists.',
        lines: [{ speaker: 'Genevieve', text: 'I am only here to confirm my one star. Professionally.' }],
      },
      {
        backdrop: 'uptown',
        cast: [{ id: 'genevieve', mood: 'surprised' }],
        caption: 'One bite. The critic goes very, very still.',
        lines: [
          { speaker: 'Genevieve', text: 'Oh. Oh no. I think I... like it?' },
          { speaker: 'Genevieve', text: 'The crust sings. The sauce has a whisper of... patience?' },
        ],
      },
      {
        backdrop: 'uptown',
        cast: [{ id: 'genevieve', mood: 'happy' }],
        lines: [
          { speaker: 'Genevieve', text: 'I may have been... hasty. Do not quote me. I will deny everything.' },
          { speaker: 'Genevieve', text: 'Bring another. For research. And one for my dog, Croissant.' },
          { speaker: 'Margot', text: 'A dog named Croissant. Finally, someone Uptown who respects pastry.' },
        ],
      },
    ],
  },
  {
    id: 'uptown-2b',
    city: 'home',
    character: 'genevieve',
    neighborhood: 'uptown',
    beat: 'interlude',
    title: 'Croissant Has Never Been Wrong',
    trigger: { kind: 'after', neighborhood: 'uptown', scene: 'uptown-2', seconds: 600 },
    requires: ['industrial-4'],
    panels: [
      {
        backdrop: 'uptown',
        cast: [{ id: 'slicey', mood: 'happy' }],
        caption: 'Todd, demoted to mascot. He is now a giant foam slice.',
        lines: [{ speaker: 'Todd', text: "Free MegaSlice! Try it! It's... free!" }],
      },
      {
        backdrop: 'uptown',
        cast: [
          { id: 'genevieve', mood: 'neutral' },
          { id: 'slicey', mood: 'surprised' },
        ],
        caption: 'Croissant sniffs the sample. Then bites the costume.',
        lines: [
          { speaker: 'Genevieve', text: 'Croissant has never been wrong. Not about pizza. Not about men.' },
          { speaker: 'Todd', text: "That's fair." },
        ],
      },
      {
        backdrop: 'megaslice-hq',
        cast: [{ id: 'victor-crust', mood: 'happy' }],
        lines: [{ speaker: 'Victor Crust', text: 'The critic is the key to this city. And I have a key. To a yacht.' }],
      },
    ],
  },
  {
    id: 'uptown-hire',
    city: 'home',
    character: 'genevieve',
    neighborhood: 'uptown',
    beat: 'interlude',
    title: 'A Napkin, Folded',
    trigger: { kind: 'manager', neighborhood: 'uptown' },
    panels: [
      {
        backdrop: 'shop',
        cast: [
          { id: 'genevieve', mood: 'neutral' },
          { id: 'anton', mood: 'neutral' },
        ],
        caption: 'A man in a pressed shirt refolds every napkin on the counter.',
        lines: [
          { speaker: 'Genevieve', text: 'Your new manager, darling. Anton. I fired him once, from the finest room in Uptown.' },
          { speaker: 'Genevieve', text: 'He is impossible. Exacting. Exactly what this counter needs.' },
          { speaker: 'Anton', text: 'Madame.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'anton', mood: 'happy' }],
        lines: [
          { speaker: 'Anton', text: 'Good evening. A table for one, a slice for one, a napkin, folded. Welcome to Rosa’s.' },
          { speaker: 'Anton', text: 'She never told you why she fired me? Then I will. Another evening.' },
        ],
      },
    ],
  },
  {
    id: 'uptown-3',
    city: 'home',
    character: 'genevieve',
    neighborhood: 'uptown',
    beat: 3,
    title: 'A Bribe on Toast',
    trigger: { kind: 'deliveries', neighborhood: 'uptown', count: 625000 },
    requires: ['uptown-2b'],
    panels: [
      {
        backdrop: 'megaslice-hq',
        cast: [
          { id: 'victor-crust', mood: 'happy' },
          { id: 'slicey', mood: 'sad' },
        ],
        caption: 'MegaSlice HQ. Top floor. Slicey holds the yacht keys.',
        lines: [
          { speaker: 'Victor Crust', text: 'Ms. Laurent. One glowing review of MegaSlice and this yacht is yours.' },
          { speaker: 'Victor Crust', text: 'Toddler. The keys.' },
        ],
      },
      {
        backdrop: 'megaslice-hq',
        cast: [
          { id: 'genevieve', mood: 'surprised' },
          { id: 'victor-crust', mood: 'neutral' },
        ],
        lines: [
          { speaker: 'Genevieve', text: 'A yacht? For a review? Of THAT pizza?' },
          { speaker: 'Victor Crust', text: 'Two yachts. A matching one for the dog.' },
        ],
      },
      {
        backdrop: 'uptown',
        cast: [{ id: 'slicey', mood: 'happy' }],
        lines: [
          { speaker: 'Todd', text: "Big review drops tomorrow! Pretty sure it's about us! Ninety percent sure!" },
          { speaker: 'Anton', text: 'I know Madame. Nobody is ever ‘pretty sure’ what she will write.', ifSeen: 'uptown-hire' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'sad' }],
        lines: [
          { speaker: 'Nonna Rosa', text: 'A critic with a yacht is a critic with a price. We will see, eh?' },
          { speaker: 'Benny', text: 'Mrs. Russo read about the yacht. She says she’ll still have the usual.' },
        ],
      },
    ],
  },
  {
    id: 'uptown-3b',
    city: 'home',
    character: 'genevieve',
    neighborhood: 'uptown',
    beat: 'interlude',
    title: 'On the Record',
    trigger: { kind: 'after', neighborhood: 'uptown', scene: 'uptown-3', seconds: 660 },
    panels: [
      {
        backdrop: 'uptown',
        cast: [
          { id: 'genevieve', mood: 'neutral' },
          { id: 'slicey', mood: 'sad' },
        ],
        caption: "The night before the review. Slicey knocks on Genevieve's door.",
        lines: [{ speaker: 'Todd', text: "Ms. Laurent. I have to tell you something. I physically can't not." }],
      },
      {
        backdrop: 'uptown',
        cast: [
          { id: 'genevieve', mood: 'surprised' },
          { id: 'slicey', mood: 'sad' },
        ],
        lines: [
          { speaker: 'Todd', text: "The yacht is leased. Month to month. It's due back Tuesday." },
          { speaker: 'Todd', text: "Also I've eaten at Rosa's every day for a year. As Mr. Smith." },
        ],
      },
      {
        backdrop: 'uptown',
        cast: [{ id: 'genevieve', mood: 'neutral' }],
        lines: [
          { speaker: 'Genevieve', text: 'Darling. Everyone knew. The mustache is drawn on.' },
          { speaker: 'Genevieve', text: 'Go home, Todd. The review is already written.' },
        ],
      },
    ],
  },
  {
    id: 'uptown-4',
    city: 'home',
    character: 'genevieve',
    neighborhood: 'uptown',
    beat: 4,
    title: 'The Review',
    trigger: { kind: 'challenge', neighborhood: 'uptown' },
    requires: ['uptown-3b'],
    reward: 'city-complete',
    perk: true,
    panels: [
      {
        backdrop: 'uptown',
        cue: 'triumph',
        cast: [{ id: 'genevieve', mood: 'happy' }],
        caption: 'Front page: five stars. Page 2: MEGASLICE YACHT WAS A RENTAL.',
        lines: [
          { speaker: 'Genevieve', text: '"The best pizza in Port Marinara is not on a yacht. It is on a bike. Lately, a drone."' },
          { speaker: 'Genevieve', text: 'I returned the yacht. Croissant was seasick anyway.' },
          { speaker: 'Genevieve', text: "My review went national, darling. Everyone wants a Rosa's now." },
        ],
      },
      {
        backdrop: 'megaslice-hq',
        cast: [
          { id: 'victor-crust', mood: 'angry' },
          { id: 'megaslice-rep', mood: 'neutral' },
        ],
        caption: 'Every neighborhood has chosen you. MegaSlice is out of Port Marinara.',
        lines: [
          { speaker: 'Victor Crust', text: 'My boutique has a For Lease sign. And now THIS?' },
          { speaker: 'Victor Crust', text: 'A RENTAL? On PAGE TWO? Who talked?' },
          { speaker: 'Todd', text: 'Me. Hi. I quit.' },
        ],
      },
      {
        backdrop: 'megaslice-hq',
        cue: 'victor-exit',
        cast: [
          { id: 'victor-crust', mood: 'angry' },
          { id: 'megaslice-rep', mood: 'happy' },
        ],
        lines: [
          { speaker: 'Victor Crust', text: "You can't quit. You're FIRED... Todd." },
          { speaker: 'Todd', text: 'You said it right. Took you seven tries.' },
          { speaker: 'Victor Crust', text: "One city. You won ONE city. Enjoy it. I'll be waiting in Boston." },
        ],
      },
      {
        backdrop: 'shop',
        cast: [
          { id: 'nonna-rosa', mood: 'neutral' },
          { id: 'todd-coat', mood: 'neutral' },
        ],
        caption: "Rosa's, Downtown. A trench coat. No mustache. Big Sal sent him.",
        lines: [
          { speaker: 'Nonna Rosa', text: 'So. Mr. Smith. Now I see this face.' },
          { speaker: 'Todd', text: 'Todd Smith. It was on every slip.' },
          { speaker: 'Todd', text: "Can I have a job? I can't make pizza." },
        ],
      },
      {
        backdrop: 'shop',
        cue: 'city-theme',
        prop: 'name-tag',
        propText: "TODD · ROSA'S",
        cast: [
          { id: 'nonna-rosa', mood: 'happy' },
          { id: 'megaslice-rep', mood: 'happy' },
        ],
        caption: 'Port Marinara is yours. Next stop: Boston.',
        lines: [
          { speaker: 'Nonna Rosa', text: "Honest. You're hired." },
          { speaker: 'Todd', text: "Victor's VP in Boston is Trish Vance. She's worse than me. She can lie." },
          { speaker: 'Nonna Rosa', text: 'Boston? Pack the sauce. And take a sweater. Boston is cold.' },
        ],
      },
    ],
  },
];
