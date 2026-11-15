// GENERATED from docs/story/COPY-v5.16.md section 1 (University subsections) by key. Do not edit by hand: change the copy file and regenerate.
// copy.test.ts fails when this file and the copy file disagree.

/** Every line, by its key in the copy file. */
export const COPY = {
  "layer.university.menu.banner": "Priya’s app: new menu!",
  "layer.university.menu.info.title": "Priya’s Menu",
  "layer.university.menu.info.body": "Pick your mix. Pepperoni pays more but slows prep. Garlic Knots pay less but leave the oven fast. Cheese is the steady middle.",
  "layer.university.menu.start": "I put your menu in my app. Pick a mix. I’ll judge quietly.",
  "menu.cheese.name": "Cheese",
  "menu.cheese.line": "Priya’s order. Steady. Never wrong.",
  "menu.pepperoni.name": "Pepperoni",
  "menu.pepperoni.line": "Pays more. Slower to top. Worth it.",
  "menu.knots.name": "Garlic Knots",
  "menu.knots.line": "Cheap. Fast out of the oven. All garlic.",
  "layer.university.zones.chip": "{n} out on campus",
  "layer.university.zones.info.title": "Campus Zones",
  "layer.university.zones.info.body": "Dorms are close, the Library is further, the Stadium is far. Far orders keep drivers out longer, so the fleet matters.",
  "zone.dorms.name": "Dorms",
  "zone.dorms.line": "Next door. Always hungry. Mostly awake.",
  "zone.library.name": "Library",
  "zone.library.line": "Across the quad. Orders in a whisper.",
  "zone.stadium.name": "Stadium",
  "zone.stadium.line": "The far end. Big orders, long rides.",
  "zone.locked": "Expand to open",
  "zone.drone.trip": "ignores distance",
  "layer.university.drones.banner": "Drones are flying!",
  "layer.university.drones.chip": "{n} drones up",
  "layer.university.drones.info": "Drones fly straight. Every zone is next door.",
  "layer.university.drones.start": "Drones don’t do traffic. Every zone’s next door now.",
} as const;

export type CopyKey = keyof typeof COPY;

/** Who says a line (keys with a speaker in the copy file; the others have none). */
export const SPEAKERS: Readonly<Record<string, string>> = {
  "layer.university.menu.start": "Priya",
  "layer.university.drones.start": "Priya",
};
