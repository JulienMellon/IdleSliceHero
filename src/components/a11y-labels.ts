// Spoken labels for the game's controls (pure, so a test pins what a screen reader says). One place: the buttons ask here.

/**
 * A buy button's label: what it buys, its price, then why it can't be bought yet ("need $12") when it can't.
 * The disabled state itself goes in `accessibilityState`, which the reader says as "dimmed".
 */
export function buyLabelText(name: string | undefined, label: string, sub: string | undefined, need: string | null | undefined): string {
  const head = [name, label].filter(Boolean).join(', ');
  const tail = [sub, need].filter(Boolean).join('. ');
  return tail ? `${head}. ${tail}` : head;
}

/** A tab or row that is the current one says so with `accessibilityState.selected`; this is the label without that word. */
export const countLabel = (n: number, one: string, many = `${one}s`): string => `${n} ${n === 1 ? one : many}`;
