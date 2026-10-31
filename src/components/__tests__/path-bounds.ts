// Test helper: the bounding box of an SVG path string (M L H V Q A Z, absolute and relative), curves sampled, arcs solved.
// Used to check the hand-written staging boxes against the real figure art.
export interface Bounds {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const ARGS: Record<string, number> = { M: 2, L: 2, H: 1, V: 1, Q: 4, A: 7, Z: 0 };

function arcPoints(x1: number, y1: number, rx: number, ry: number, phi: number, fa: number, fs: number, x2: number, y2: number): [number, number][] {
  if (rx === 0 || ry === 0) return [[x2, y2]];
  const c = Math.cos(phi);
  const s = Math.sin(phi);
  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x1p = c * dx + s * dy;
  const y1p = -s * dx + c * dy;
  const lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lam > 1) {
    rx *= Math.sqrt(lam);
    ry *= Math.sqrt(lam);
  }
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const k = (fa === fs ? -1 : 1) * Math.sqrt(Math.max(0, num / den));
  const cxp = (k * rx * y1p) / ry;
  const cyp = (-k * ry * x1p) / rx;
  const cx = c * cxp - s * cyp + (x1 + x2) / 2;
  const cy = s * cxp + c * cyp + (y1 + y2) / 2;
  const ang = (ux: number, uy: number, vx: number, vy: number) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const th1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dth = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!fs && dth > 0) dth -= 2 * Math.PI;
  if (fs && dth < 0) dth += 2 * Math.PI;
  const pts: [number, number][] = [];
  for (let i = 0; i <= 24; i++) {
    const t = th1 + (dth * i) / 24;
    pts.push([cx + rx * Math.cos(t) * c - ry * Math.sin(t) * s, cy + rx * Math.cos(t) * s + ry * Math.sin(t) * c]);
  }
  return pts;
}

export function pathPoints(d: string): [number, number][] {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const pts: [number, number][] = [];
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  let cmd = '';
  let i = 0;
  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) cmd = tokens[i++];
    const up = cmd.toUpperCase();
    const rel = cmd !== up;
    const need = ARGS[up];
    if (need === undefined) throw new Error(`unsupported path command ${cmd}`);
    const a = tokens.slice(i, i + need).map(Number);
    i += need;
    if (up === 'Z') {
      x = sx;
      y = sy;
      continue;
    }
    const ox = rel ? x : 0;
    const oy = rel ? y : 0;
    if (up === 'M' || up === 'L') {
      x = a[0] + ox;
      y = a[1] + oy;
      if (up === 'M') {
        sx = x;
        sy = y;
        cmd = rel ? 'l' : 'L';
      }
      pts.push([x, y]);
    } else if (up === 'H') {
      x = a[0] + ox;
      pts.push([x, y]);
    } else if (up === 'V') {
      y = a[0] + oy;
      pts.push([x, y]);
    } else if (up === 'Q') {
      const [cx, cy, ex, ey] = [a[0] + ox, a[1] + oy, a[2] + ox, a[3] + oy];
      for (let t = 0; t <= 1.0001; t += 0.05) pts.push([(1 - t) ** 2 * x + 2 * (1 - t) * t * cx + t * t * ex, (1 - t) ** 2 * y + 2 * (1 - t) * t * cy + t * t * ey]);
      x = ex;
      y = ey;
    } else if (up === 'A') {
      const ex = a[5] + ox;
      const ey = a[6] + oy;
      pts.push(...arcPoints(x, y, a[0], a[1], (a[2] * Math.PI) / 180, a[3], a[4], ex, ey));
      x = ex;
      y = ey;
    }
  }
  return pts;
}

export function boundsOf(d: string, pad = 0): Bounds {
  const pts = pathPoints(d);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return { x0: Math.min(...xs) - pad, y0: Math.min(...ys) - pad, x1: Math.max(...xs) + pad, y1: Math.max(...ys) + pad };
}
