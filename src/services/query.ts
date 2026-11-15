/** `?name=value` of the page the web build runs in ('' elsewhere), so a screenshot or a test can steer a stub. */
export function queryFlag(name: string, search?: string): string {
  const s = search ?? (globalThis as { location?: { search?: string } }).location?.search ?? '';
  const v = new URLSearchParams(s).get(name);
  return v ?? '';
}
