// GENERATED from docs/story/COPY-v5.16.md section 1 (Uptown subsections) by key. Do not edit by hand: change the copy file and regenerate.
// copy.test.ts fails when this file and the copy file disagree.

/** Every line, by its key in the copy file. */
export const COPY = {
  "layer.uptown.stars.banner": "Uptown pays by the star",
  "layer.uptown.stars.chip": "Rating {n}★",
  "layer.uptown.stars.info.title": "Stars",
  "layer.uptown.stars.info.body": "Uptown pays by your star rating. Oven grade, decor and Ingredients earn stars. Few stars pay less. A full sign pays the most.",
  "upgrade.uptown.ingredients.name": "Ingredients",
  "upgrade.uptown.ingredients.tier.1": "Store-brand",
  "upgrade.uptown.ingredients.tier.2": "Imported",
  "upgrade.uptown.ingredients.tier.3": "Farm",
  "upgrade.uptown.ingredients.tier.4": "Truffle",
  "layer.uptown.critic.banner": "A critic is dining here!",
  "layer.uptown.critic.chip.next": "Critic in {time}",
  "layer.uptown.critic.chip.target": "Target {n}★",
  "layer.uptown.critic.info.title": "The Critic’s Visit",
  "layer.uptown.critic.info.body": "Every so often a critic drops in and checks your stars. Hit the target for a bonus and a new star on the sign.",
  "layer.uptown.critic.start": "A colleague dines here tonight. I shall hear about it.",
  "layer.uptown.critic.pass": "My colleague said ‘sublime.’ How irritating. How correct.",
  "layer.uptown.critic.fail": "My colleague left early. Croissant stayed. Small mercies.",
} as const;

export type CopyKey = keyof typeof COPY;

/** Who says a line (keys with a speaker in the copy file; the others have none). */
export const SPEAKERS: Readonly<Record<string, string>> = {
  "layer.uptown.critic.start": "Genevieve",
  "layer.uptown.critic.pass": "Genevieve",
  "layer.uptown.critic.fail": "Genevieve",
};
