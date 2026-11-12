import type { Scene } from '../../types';

// ───────────────────────────── UPTOWN · Genevieve ─────────────────────────────
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
        caption: 'She takes one dainty bite.',
        lines: [
          { speaker: 'Genevieve', text: 'Genevieve Laurent. Food critic. You may have heard of me. Everyone has.' },
          { speaker: 'Genevieve', text: 'A grand opening. How quaint. Well. Let us taste.' },
        ],
      },
      {
        backdrop: 'uptown',
        cast: [{ id: 'genevieve', mood: 'angry' }],
        lines: [
          { speaker: 'Genevieve', text: 'Lukewarm. Rushed. The basil is… frightened. One star.' },
          { speaker: 'You', text: 'Frightened basil?!' },
        ],
      },
      {
        backdrop: 'uptown',
        cast: [{ id: 'genevieve', mood: 'neutral' }],
        lines: [
          { speaker: 'Genevieve', text: 'Uptown pays the most in the city, darling. So we expect the most.' },
          { speaker: 'Genevieve', text: 'Impress me, and the whole city will follow. Fail, and… well. One star.' },
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
        lines: [
          { speaker: 'Genevieve', text: 'I am only here to confirm my one star. Professionally.' },
        ],
      },
      {
        backdrop: 'uptown',
        cast: [{ id: 'genevieve', mood: 'surprised' }],
        caption: 'One bite. The critic goes very, very still.',
        lines: [
          { speaker: 'Genevieve', text: 'Oh. Oh no. I think I… like it?' },
          { speaker: 'Genevieve', text: 'The crust sings. The sauce has a whisper of… patience?' },
        ],
      },
      {
        backdrop: 'uptown',
        cast: [{ id: 'genevieve', mood: 'happy' }],
        lines: [
          { speaker: 'Genevieve', text: 'I may have been… hasty. Do not quote me. I will deny everything.' },
          { speaker: 'Genevieve', text: 'Bring another. For research. And one for my dog, Croissant.' },
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
    panels: [
      {
        backdrop: 'megaslice-hq',
        cast: [{ id: 'victor-crust', mood: 'happy' }],
        caption: 'MegaSlice HQ. The top floor. The air smells like money.',
        lines: [
          { speaker: 'Victor Crust', text: 'Ms. Laurent. One glowing review of MegaSlice and this yacht is yours.' },
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
        cast: [{ id: 'megaslice-rep', mood: 'happy' }],
        lines: [
          { speaker: 'MegaSlice Rep', text: 'Big review drops tomorrow! Pretty sure it’s about us! Ninety percent sure!' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'sad' }],
        lines: [
          { speaker: 'Nonna Rosa', text: 'A critic with a yacht is a critic with a price. We will see, eh?' },
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
    title: 'Five Stars',
    trigger: { kind: 'deliveries', neighborhood: 'uptown', count: 1250000 },
    perk: true,
    reward: 'city-complete',
    panels: [
      {
        backdrop: 'uptown',
        cue: 'triumph',
        cast: [{ id: 'genevieve', mood: 'happy' }],
        caption: 'The Port Marinara Times. Front page. Five stars.',
        lines: [
          { speaker: 'Genevieve', text: '“The best pizza in Port Marinara is not on a yacht. It is on a bike. Lately, a drone.”' },
          { speaker: 'Genevieve', text: 'I returned the yacht. Croissant was seasick anyway.' },
        ],
      },
      {
        backdrop: 'megaslice-hq',
        cue: 'victor-exit',
        cast: [{ id: 'victor-crust', mood: 'angry' }],
        caption: 'Every neighborhood has chosen you. MegaSlice is out of Port Marinara.',
        lines: [
          { speaker: 'Victor Crust', text: 'One city. You won ONE city. This war is not over, pizza person.' },
          { speaker: 'Victor Crust', text: 'Enjoy your little port. I’ll be waiting in Boston.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [
          { id: 'genevieve', mood: 'happy' },
          { id: 'nonna-rosa', mood: 'happy' },
        ],
        lines: [
          { speaker: 'Genevieve', text: 'My review went national, darling. Everyone wants a Rosa’s now.' },
          { speaker: 'Nonna Rosa', text: 'A new city? Pack the sauce. And take a sweater. Boston is cold.' },
        ],
      },
      {
        backdrop: 'downtown',
        cue: 'city-theme',
        cast: [],
        caption: 'Port Marinara is yours. Next stop: the whole country.',
        lines: [],
      },
    ],
  },
];
