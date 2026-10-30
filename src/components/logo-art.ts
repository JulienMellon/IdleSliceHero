// The Slice Empire mark (P1): a crowned pizza slice. Plain data, so the in-app logo (logo.tsx) and the icon/splash
// PNG renderer (scripts/render-logo.ts) draw exactly the same art. viewBox 0 0 200 200.
export const LOGO_INK = '#3B1F14';
export const LOGO_RED = '#E8432E';

export type Shape =
  | { k: 'path'; d: string; fill: string; stroke?: string; sw?: number }
  | { k: 'circle'; cx: number; cy: number; r: number; fill: string; stroke?: string; sw?: number };

export const LOGO_SHAPES: Shape[] = [
  // soft shadow
  { k: 'path', d: 'M58 86 Q104 64 152 86 L108 180 Z', fill: 'rgba(0,0,0,0.18)' },
  // crown
  { k: 'path', d: 'M58 58 L66 22 L86 46 L100 12 L114 46 L134 22 L142 58 Z', fill: '#FFD84D', stroke: LOGO_INK, sw: 5 },
  { k: 'circle', cx: 66, cy: 20, r: 6, fill: '#FFFFFF', stroke: LOGO_INK, sw: 3 },
  { k: 'circle', cx: 100, cy: 10, r: 7, fill: LOGO_RED, stroke: LOGO_INK, sw: 3 },
  { k: 'circle', cx: 134, cy: 20, r: 6, fill: '#3FAE5A', stroke: LOGO_INK, sw: 3 },
  // cheese wedge
  { k: 'path', d: 'M48 76 Q100 52 152 76 L100 176 Z', fill: '#FFC531', stroke: LOGO_INK, sw: 6 },
  // crust
  { k: 'path', d: 'M42 66 Q100 38 158 66 L152 82 Q100 58 48 82 Z', fill: '#E9A64B', stroke: LOGO_INK, sw: 6 },
  // pepperoni
  { k: 'circle', cx: 86, cy: 96, r: 11, fill: LOGO_RED, stroke: LOGO_INK, sw: 3 },
  { k: 'circle', cx: 116, cy: 104, r: 9, fill: LOGO_RED, stroke: LOGO_INK, sw: 3 },
  { k: 'circle', cx: 98, cy: 132, r: 8, fill: LOGO_RED, stroke: LOGO_INK, sw: 3 },
  // shine
  { k: 'path', d: 'M64 84 Q78 76 92 74', fill: 'none', stroke: '#FFFFFF', sw: 4 },
];

/** The art as an SVG string (for the PNG renderer). `bg`: a full-bleed background colour (the app icon). */
export function logoSvg(size: number, bg: string | null, inset = 0): string {
  const s = (sh: Shape) =>
    sh.k === 'path'
      ? `<path d="${sh.d}" fill="${sh.fill}"${sh.stroke ? ` stroke="${sh.stroke}" stroke-width="${sh.sw}" stroke-linejoin="round" stroke-linecap="round"` : ''}/>`
      : `<circle cx="${sh.cx}" cy="${sh.cy}" r="${sh.r}" fill="${sh.fill}"${sh.stroke ? ` stroke="${sh.stroke}" stroke-width="${sh.sw}"` : ''}/>`;
  const pad = inset;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${-pad} ${-pad} ${200 + 2 * pad} ${200 + 2 * pad}">${bg ? `<rect x="${-pad}" y="${-pad}" width="${200 + 2 * pad}" height="${200 + 2 * pad}" fill="${bg}"/>` : ''}${LOGO_SHAPES.map(s).join('')}</svg>`;
}
