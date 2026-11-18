// The one placeholder filler (card R5c): every copy reader (copy(), lc(), fillText, t()) goes through it. Pure.
export type CopyVars = Readonly<Record<string, string | number>>;

/** A template with each `{name}` replaced by `vars.name` (a placeholder with no value is left as written). */
export const fill = (template: string, vars: CopyVars = {}): string =>
  template.replace(/\{(\w+)\}/g, (whole, name: string) => (name in vars ? String(vars[name]) : whole));
