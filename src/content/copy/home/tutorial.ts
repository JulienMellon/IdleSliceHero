// The Chapter 1 tutorial's lines (v5.20, card C3), copied byte for byte from docs/story/COPY-v5.20.md (written by card W1). Hand-kept like lines.ts, not generated:
// change the copy file and this table together. `{marco}` is the first shop's prep head, `{cost}` the second oven's price. A city may dress any key in its own `CityDef.copy`.

/** Every line, by its key in the copy file. */
export const COPY = {
  'tutorial.1': 'First, the dough. Tap the prep table, cara mia.',
  'tutorial.2': 'See the dial? It fills while the dough rolls. Full means ready.',
  'tutorial.3': 'Bella, the dough is ready. Now tap the oven.',
  'tutorial.4': 'The dial is the timer. The number? How many pies are inside.',
  'tutorial.5': 'Hot pizza waits for nobody. Tap the counter to serve!',
  'tutorial.6': 'Look! Every pizza you sell becomes money. Is how we eat.',
  'tutorial.7': 'I keep a list, like my mother did. Tap it, cara.',
  'tutorial.8': 'This list tells you what comes next. First on it: a better oven.',
  'tutorial.9': 'Keep baking, keep serving. Save {cost} to upgrade the oven.',
  'tutorial.10': 'Ecco, you have enough. Tap Ovens to upgrade the oven.',
  'tutorial.11': 'A better oven bakes more pizzas. Now this is a kitchen!',
  'tutorial.12': 'Tap All. Every upgrade in the shop lives in there.',
  'tutorial.13': '{marco} rolls dough for you, flour and all. Hire him when you can.',
  'tutorial.14': "Keep baking. {marco} won't hire himself.",
  'tutorial.15': 'See? {marco} rolls on his own now. You bake and serve. Bravo!',
  'tutorial.alt.9': 'Ay! You spent the oven money. Save {cost} again for the upgrade.',
  'tutorial.alt.13': '{marco} rolls dough for you, flour and all. You can hire him now.',
} as const;

export type TutorialKey = keyof typeof COPY;
