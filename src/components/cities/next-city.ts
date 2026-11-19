// The device key that remembers the "Coming soon" card of a city was shown (endgame/next-city-sheet.tsx). One key per announced city, named by the
// city's pack id: the first city's key is the one every v5.15 install already holds, so its card never opens a second time.
export const seenKey = (cityId: string): string => `slice-empire/${cityId}-seen`;
