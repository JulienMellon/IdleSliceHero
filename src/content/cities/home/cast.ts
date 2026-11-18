// The home city's characters: its sixteen, and the returning characters every city's scenes may use (card R7a). Imports nothing.
// The order is the order of the old single `CHARACTER_IDS` list (a test pins it).
export const HOME_CAST = [
  'nonna-rosa',
  'dale',
  'marisol',
  'priya',
  'big-sal',
  'genevieve',
  'victor-crust',
  'megaslice-rep',
  // Todd, three ways (all variants of the megaslice-rep bust; card T1b draws them)
  'mr-smith', // the trench coat with the mustache drawn on in marker
  'todd-coat', // the same coat, no mustache
  'slicey', // the foam pizza-slice mascot costume
  // the five General Managers (the city pack's `managers`); each appears in their shop's hire scene
  'deb',
  'skip',
  'noor',
  'dee',
  'anton',
] as const;
