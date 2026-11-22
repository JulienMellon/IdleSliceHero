// The home city's voice (card R1, moved out of content/heads.ts and content/hooks.ts): what its heads say at a milestone, a rush, an attack, being
// Head of the Week or being Slammed; who asks for special orders and in which words; its night oven's name and sheet line; and its founder.
// A city pack that has no entry for one of these is silent or generic, never the home city's: the engine reads them with `cityOf(game)`.
// Strings come from docs/story/COPY-v5.15.md section 2 (bark.<shop>.<station>.<trigger>) and the order cast of v5.13.
import type { NeighborhoodId } from '../../types';
import type { BarkTable, NightOvenLines, OrderCast } from '../types';

export const HOME_BARKS: BarkTable = {
  downtown: {
    prep: {
      milestone: 'Flour on the ceiling! Worth it!',
      rush: 'Dough’s flying! Duck, everybody!',
      attack: 'MegaSlice? I’ll roll ’em out flat!',
      week: 'Me? Head of the Week? Nonna, look!',
    },
    oven: {
      milestone: 'My oven. My fire. My record.',
      rush: 'Nobody touches the oven door but me!',
      attack: 'They want this oven? Over my ashes.',
      week: 'Zia Rosa will pretend not to be proud.',
    },
    counter: {
      milestone: 'Every regular, by name. And by topping.',
      rush: 'Mrs. Russo, the usual? Already rung up!',
      attack: 'MegaSlice doesn’t know anyone’s usual.',
      week: 'Head of the Week! Put it on my tab.',
    },
  },
  suburbs: {
    prep: {
      milestone: 'Labeled, sorted, done! Next bin!',
      rush: 'Sign-up sheet for toppings! Go, go!',
      attack: 'MegaSlice is not on the approved list.',
      week: 'I made myself a sticker. It’s laminated.',
    },
    oven: {
      milestone: 'A good fire is a patient fire, sport.',
      rush: 'Crank it up. Dad’s got this.',
      attack: 'Nobody tells Hank how to run a fire.',
      week: 'Head of the Week. Gonna tell the kids.',
    },
    counter: {
      milestone: 'Cool. Huge. I’m screaming inside.',
      rush: 'Line’s out the door. I’m thriving.',
      attack: 'MegaSlice? Yeah, no.',
      week: 'Head of the Week. Résumé material.',
    },
  },
  waterfront: {
    prep: {
      milestone: 'Square knot on every pie! Tied tight!',
      rush: 'All hands! Clove-hitch those orders!',
      attack: 'MegaSlice? Tie ’em up in a sheepshank!',
      week: 'Me? Knot bad. Knot bad at all.',
    },
    oven: {
      milestone: 'Seen hotter ovens. In a storm. Barely.',
      rush: 'Rough seas tonight. Keep her burning.',
      attack: 'Weathered worse than a pizza chain.',
      week: 'Head of the Week. Tell the gulls.',
    },
    counter: {
      milestone: 'Every order logged and docked.',
      rush: 'Hold your course! Single file!',
      attack: 'No MegaSlice vessel docks at my counter.',
      week: 'Harbor master of the week. Obviously.',
    },
  },
  university: {
    prep: {
      milestone: 'New record. Publishing my findings.',
      rush: 'Throughput maxed. Thesis: confirmed.',
      attack: 'MegaSlice dough fails peer review.',
      week: 'Adding this to my CV. Top of page.',
    },
    oven: {
      milestone: 'Right on temperature. As predicted.',
      rush: 'Heat’s up. Reaction’s accelerating!',
      attack: 'Ran tests on MegaSlice. Mostly glue.',
      week: 'Head of the Week. Reproducible results.',
    },
    counter: {
      milestone: 'Bro. BRO. We did that.',
      rush: 'Everybody gets a slice and a compliment!',
      attack: 'MegaSlice? Not at my counter, bro.',
      week: 'Head of the Week? Group hug. Everyone.',
    },
  },
  industrial: {
    prep: {
      milestone: 'Record shift. Break’s still at the bell.',
      rush: 'Rush or no rush, break’s on time.',
      attack: 'Filing a grievance against MegaSlice.',
      week: 'Head of the Week. Telling the union.',
    },
    oven: {
      milestone: '(Ox nods. The oven roars.)',
      rush: '(Ox lifts the whole crate. Gently.)',
      attack: '(Ox stands in the doorway. Arms folded.)',
      week: '(Ox blushes.) …Thanks.',
    },
    counter: {
      milestone: 'Look at you go, hon. Proud of ya.',
      rush: 'Line’s long, hon. Rita’s got it.',
      attack: 'MegaSlice, hon? Bless their hearts.',
      week: 'Head of the Week? Oh, stop it, hon.',
    },
  },
  uptown: {
    prep: {
      milestone: 'Magnifique. Despite the pepperoni.',
      rush: 'So many toppings. So little dignity.',
      attack: 'MegaSlice toppings should be illegal.',
      week: 'An honor. I will allow extra cheese.',
    },
    oven: {
      milestone: 'Flakier than a croissant. I said it.',
      rush: 'Faster than any soufflé. Allez!',
      attack: 'MegaSlice bakes in a toaster. Probably.',
      week: 'Pastry never gave me this. Merci.',
    },
    counter: {
      milestone: 'Another table delighted. As expected.',
      rush: 'Right this way. Your slice awaits.',
      attack: 'I’m sorry, MegaSlice has no reservation.',
      week: 'Head of the Week. I’ll alert the press.',
    },
  },
};

/** Who asks, by neighbourhood (the shop the pies are sold in). */
export const HOME_ORDER_CAST: Record<NeighborhoodId, OrderCast> = {
  downtown: {
    who: 'nonna-rosa',
    name: 'Nonna Rosa',
    offers: ['“{n} pies, caro. Two minutes. Fast hands!”', '“Soup’s cooling… {n} pies before the clock, eh?”'],
    thanks: ['“Bravo! Now eat something, you’re too thin.”', '“That’s my pizza! Rosa’s proud of you.”'],
  },
  suburbs: {
    who: 'dale',
    name: 'Coach Dale',
    offers: ['“{n} pies for the Mudhens. Two minutes. Go!”', '“Team’s starving! {n} pies, two minutes, move!”'],
    thanks: ['“That’s a W! The Mudhens owe you big.”', '“Hustle! Team’s fed and happy, champ.”'],
  },
  waterfront: {
    who: 'marisol',
    name: 'Captain Marisol',
    offers: ['“{n} pies for the crew before the tide turns!”', '“All hands hungry. {n} pies in two minutes, sailor!”'],
    thanks: ['“Fair winds! The crew’s fed. Well done.”', '“Well done, sailor. Even the gulls approve.”'],
  },
  university: {
    who: 'priya',
    name: 'Priya',
    offers: ['“Study group needs {n} pies. Two minutes. Please?”', '“Finals week… {n} pies, fast? I’ll owe you.”'],
    thanks: ['“You’re a lifesaver. Finals survived. Mostly.”', '“Thank you!! The study group lives to debug.”'],
  },
  industrial: {
    who: 'big-sal',
    name: 'Big Sal',
    offers: ['“Night shift wants {n} pies. Two minutes, kid.”', '“{n} pies for the crew. Clock’s ticking, kid.”'],
    thanks: ['“Solid work, kid. Union’d be proud.”', '“Shift’s fed. Don’t tell the foreman I smiled.”'],
  },
  uptown: {
    who: 'genevieve',
    name: 'Genevieve',
    offers: ['“{n} pies for the gala, darling. Two minutes.”', '“Do be quick, darling: {n} pies in two minutes.”'],
    thanks: ['“Divine, darling. Keep the change.”', '“Perfection. I shall tell absolutely everyone.”'],
  },
};

/** Nonna's night oven (v5.14): the sheet's line; `{hours}` is how long the away meter holds. */
export const HOME_NIGHT_OVEN_LINES: NightOvenLines = {
  name: "Nonna's night oven",
  body: "While you're away, Nonna's night oven keeps baking for up to {hours}. Come back before it's full!",
};

/** The first shop's founder: who takes over its kitchen in the tutorial, by the name the countdown uses (C141). */
export const HOME_FOUNDER = { id: 'nonna-rosa', name: 'Nonna' } as const;
