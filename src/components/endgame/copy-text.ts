// Reads the copy table (copy.ts, generated from docs/story/COPY-v5.15.md): a line by its key, with {placeholders} filled.
// No string of the endgame screens is written in a component: it is a key here. Pure: unit-tested in node.
import { COPY, RECIPE_NAMES, SPEAKERS, type CopyKey } from './copy';

export type CopyVars = Readonly<Record<string, string | number>>;

/** The line for `key`, each `{name}` replaced by `vars.name` (a placeholder with no value is left as written). */
export function copy(key: CopyKey, vars: CopyVars = {}): string {
  return COPY[key].replace(/\{(\w+)\}/g, (whole, name: string) => (name in vars ? String(vars[name]) : whole));
}

/** Who says the line, or null for a line with no speaker. */
export const speakerOf = (key: string): string | null => SPEAKERS[key] ?? null;

/** A recipe card's name (copy section 1). */
export const recipeName = (id: string): string => RECIPE_NAMES[id] ?? id;
/** A recipe card's flavour line. */
export const recipeLine = (id: string): string => (COPY as Readonly<Record<string, string>>)[id] ?? '';

/** Narrows a built key (`attack.${hood}.win`) to the copy table: undefined when the copy has no such line. */
export const copyOr = (key: string): string | undefined => (COPY as Readonly<Record<string, string>>)[key];
