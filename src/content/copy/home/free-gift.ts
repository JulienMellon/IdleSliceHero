// The free gift's lines (v5.25, card T3), copied byte for byte from docs/story/COPY-v5.25.md section 2 (written by card W6). Hand-kept like store-copy.ts.
// Placeholders: {cash} money() of the gift's cash, {diamonds} the whole count of diamonds. `gift.banner.both` is the every-third gift. The barks: gift.bark.1 is
// Nonna Rosa (she can always speak), .2 Marco and .3 Benny (play one only once its head is hired).

/** The placeholders each gift line may carry. */
export interface GiftVars {
  cash: string;
  diamonds: number;
}

/** Every line, by its key in the copy file. */
export const COPY = {
  'gift.hint': 'A gift box waits in your shop. Tap it!',
  'gift.banner.cash': 'Free gift! +{cash}',
  'gift.banner.both': 'Free gift! +{cash} and {diamonds} 💎',
  'gift.bark.1': 'A box for you, cara. Open it. Is rude to make it wait.',
  'gift.bark.2': 'I didn’t shake it. Okay, a little. It sounds like money!',
  'gift.bark.3': 'Package for the boss! No tip needed. This time.',
} as const;
