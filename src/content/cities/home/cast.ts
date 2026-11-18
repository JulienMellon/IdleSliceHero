// The home city's characters: its sixteen, and the returning characters every city's scenes may use (card R7a). Imports nothing.
// `HOME_NAMES` is the name the story teaser uses for each (the character only, no scene content). The order is the order of the old single `CHARACTER_IDS` list (a test pins it).
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

/** What the next-scene teaser calls each home character ("Next: Dale's story continues..."). */
export const HOME_NAMES: Readonly<Record<(typeof HOME_CAST)[number], string>> = {
  'nonna-rosa': 'Nonna Rosa',
  dale: 'Dale',
  marisol: 'Marisol',
  priya: 'Priya',
  'big-sal': 'Big Sal',
  genevieve: 'Genevieve',
  'victor-crust': 'Victor Crust',
  'megaslice-rep': 'the MegaSlice rep',
  // a scene's `character` is the neighbourhood's lead; these only appear on stage, but the table covers every id
  'mr-smith': 'Mr. Smith',
  'todd-coat': 'Todd',
  slicey: 'Slicey',
  deb: 'Deb',
  skip: 'Skip',
  noor: 'Noor',
  dee: 'Dee',
  anton: 'Anton',
};
