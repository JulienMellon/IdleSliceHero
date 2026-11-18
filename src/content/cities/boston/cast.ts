// Boston's characters (card R7a): the six neighbourhoods' own, and Trish Vance, the local lieutenant. Imports nothing.
export const BOSTON_CAST = ['father-dom', 'kayla-dunn', 'preston', 'manny', 'lena-ko', 'grandma-bea', 'trish-vance'] as const;

/** What the next-scene teaser calls each Boston character. */
export const BOSTON_NAMES: Readonly<Record<(typeof BOSTON_CAST)[number], string>> = {
  'father-dom': 'Father Dom',
  'kayla-dunn': 'Kayla Dunn',
  preston: 'Preston',
  manny: 'Manny',
  'lena-ko': 'Dr. Ko',
  'grandma-bea': 'Grandma Bea',
  'trish-vance': 'Trish Vance',
};
