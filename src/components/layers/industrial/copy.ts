// GENERATED from docs/story/COPY-v5.16.md section 1 (Industrial subsections) by key. Do not edit by hand: change the copy file and regenerate.
// copy.test.ts fails when this file and the copy file disagree.

/** Every line, by its key in the copy file. */
export const COPY = {
  "layer.industrial.shift.day": "Day Shift",
  "layer.industrial.shift.swing": "Swing Shift",
  "layer.industrial.shift.night": "Night Shift",
  "layer.industrial.shift.banner": "Whistle! {shift} is on",
  "layer.industrial.shift.chip": "Shift ends {time}",
  "layer.industrial.shift.info.title": "Shifts and Jams",
  "layer.industrial.shift.info.body": "Orders follow the factory whistle: day, swing, night. Night shift pays best. Ovens jam now and then: tap the wrench, or your Head Baker fixes it in time.",
  "layer.industrial.shift.start": "Whistle blows, crews eat. Miss a shift, you hear from me.",
  "layer.industrial.shift.night.line": "Night shift. My guys. Best pay, worst moods. Feed ’em.",
  "layer.industrial.jam.alert": "Oven jammed! Tap the wrench.",
  "layer.industrial.jam.line": "Oven’s jammed. Get a wrench on it. Now.",
  "layer.industrial.jam.fixed": "(Ox taps it once. It purrs.)",
} as const;

export type CopyKey = keyof typeof COPY;

/** Who says a line (keys with a speaker in the copy file; the others have none). */
export const SPEAKERS: Readonly<Record<string, string>> = {
  "layer.industrial.shift.start": "Big Sal",
  "layer.industrial.shift.night.line": "Big Sal",
  "layer.industrial.jam.line": "Big Sal",
  "layer.industrial.jam.fixed": "Ox",
};
