// Path builders for the cut-scene backdrops. Every texture (brick courses, tile grout, wood grain, window grids)
// is one path string per pattern, built once at module load — a backdrop render only picks strings.
// Art space: 400 wide, ground at the bottom (y 200), up to 110 units of wall/sky above y 0 (the panel shows y -100…200).

export const n = (v: number) => Math.round(v * 10) / 10;

export function rect(x: number, y: number, w: number, h: number) {
  return `M${n(x)} ${n(y)}h${n(w)}v${n(h)}h${n(-w)}Z`;
}

export function circle(cx: number, cy: number, r: number, ry = r) {
  return `M${n(cx - r)} ${n(cy)}a${n(r)} ${n(ry)} 0 1 0 ${n(2 * r)} 0a${n(r)} ${n(ry)} 0 1 0 ${n(-2 * r)} 0Z`;
}

/** Brick courses and staggered joints over a rectangle (lines only; stroke it). */
export function bricks(x0: number, y0: number, x1: number, y1: number, ch = 6, bw = 14) {
  let d = '';
  let r = 0;
  for (let y = y0 + ch; y < y1 - 0.5; y += ch, r++) d += `M${n(x0)} ${n(y)}H${n(x1)}`;
  r = 0;
  for (let y = y0; y < y1 - 0.5; y += ch, r++) {
    for (let x = x0 + (r % 2 ? bw / 2 : bw); x < x1 - 1; x += bw) d += `M${n(x)} ${n(y)}v${n(Math.min(ch, y1 - y))}`;
  }
  return d;
}

/** Brick courses that only span a ragged patch (the cartoon "exposed brick" hint). */
export function brickPatch(x: number, y: number, rows: number, widths: number[], ch = 5, bw = 11) {
  let d = '';
  for (let r = 0; r < rows; r++) {
    const w = widths[r % widths.length];
    const yy = y + r * ch;
    const off = r % 2 ? bw / 2 : 0;
    d += `M${n(x + off)} ${n(yy)}h${n(w)}`;
    for (let xx = x + off + bw; xx < x + off + w; xx += bw) d += `M${n(xx)} ${n(yy)}v${ch}`;
  }
  return d;
}

/** Grid lines (tiles, glass curtain walls): verticals every `sx`, horizontals every `sy`. */
export function gridLines(x0: number, y0: number, x1: number, y1: number, sx: number, sy: number) {
  let d = '';
  for (let x = x0 + sx; x < x1 - 0.5; x += sx) d += `M${n(x)} ${n(y0)}V${n(y1)}`;
  for (let y = y0 + sy; y < y1 - 0.5; y += sy) d += `M${n(x0)} ${n(y)}H${n(x1)}`;
  return d;
}

/** Window panes: `cols`×`rows` rectangles of w×h on a pitch of px×py. */
export function windows(x0: number, y0: number, cols: number, rows: number, w: number, h: number, px: number, py: number, skip?: (c: number, r: number) => boolean) {
  let d = '';
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (!skip?.(c, r)) d += rect(x0 + c * px, y0 + r * py, w, h);
  return d;
}

/** Mullions (a cross in each pane) for the same grid. */
export function mullions(x0: number, y0: number, cols: number, rows: number, w: number, h: number, px: number, py: number, skip?: (c: number, r: number) => boolean) {
  let d = '';
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      if (skip?.(c, r)) continue;
      const x = x0 + c * px;
      const y = y0 + r * py;
      d += `M${n(x + w / 2)} ${n(y)}v${n(h)}M${n(x)} ${n(y + h * 0.45)}h${n(w)}`;
    }
  return d;
}

/** Floor boards seen from a little above: rows get deeper toward the viewer; staggered butt joints; grain flicks. */
export function boards(x0: number, x1: number, rowsY: number[]) {
  let lines = '';
  let grain = '';
  rowsY.forEach((y, i) => {
    lines += `M${n(x0)} ${n(y)}H${n(x1)}`;
    const next = rowsY[i + 1];
    if (next === undefined) return;
    const len = 46 + i * 14;
    for (let x = x0 + ((i * 37) % len); x < x1; x += len) {
      lines += `M${n(x)} ${n(y)}V${n(next)}`;
      grain += `M${n(x + 8)} ${n(y + (next - y) * 0.45)}q${n(len * 0.18)} -2 ${n(len * 0.36)} 0`;
    }
  });
  return { lines, grain };
}

/**
 * Floor planks running toward the viewer: board edges converge on a vanishing point above the floor, with
 * staggered butt joints between neighbours and a grain flick on some boards.
 */
export function planks(x0: number, x1: number, y0: number, y1: number, vpX: number, vpY: number, pitch: number) {
  const k = (y1 - vpY) / (y0 - vpY);
  const at = (x: number, y: number) => vpX + (x - vpX) * ((y - vpY) / (y0 - vpY));
  let lines = '';
  let joints = '';
  let grain = '';
  let i = 0;
  for (let x = x0; x <= x1; x += pitch, i++) {
    lines += `M${n(x)} ${y0}L${n(vpX + (x - vpX) * k)} ${y1}`;
    const yj = y0 + ((i * 37) % 100) / 100 * (y1 - y0);
    joints += `M${n(at(x, yj))} ${n(yj)}L${n(at(x + pitch, yj))} ${n(yj)}`;
    if (i % 2 === 0) {
      const yg = y0 + (((i * 53) % 100) / 100) * (y1 - y0) * 0.8 + 3;
      const gx = at(x + pitch * 0.5, yg);
      grain += `M${n(gx)} ${n(yg)}l${n((gx - vpX) * 0.06)} 8`;
    }
  }
  return { lines, joints, grain };
}

/** Points along a quadratic curve (string-light bulbs). */
export function alongQuad(p0: [number, number], c: [number, number], p1: [number, number], count: number) {
  return Array.from({ length: count }, (_, i) => {
    const t = (i + 0.5) / count;
    const u = 1 - t;
    return [u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]] as [number, number];
  });
}

/** Rain: every streak in one path. */
export function rain(count: number, x0: number, x1: number, y0: number, y1: number, len: number) {
  let d = '';
  for (let i = 0; i < count; i++) {
    const x = x0 + ((i * 53) % (x1 - x0));
    const y = y0 + ((i * 97) % (y1 - y0));
    d += `M${x} ${y}l${n(-len / 3)} ${len}`;
  }
  return d;
}

/** A puffy cloud bank as one outline (circles unioned by the nonzero fill). */
export function cloud(x: number, y: number, k: number) {
  return circle(x, y, 13 * k) + circle(x + 16 * k, y - 7 * k, 18 * k) + circle(x + 35 * k, y - 1 * k, 14 * k) + circle(x + 50 * k, y + 3 * k, 10 * k) + rect(x, y, 50 * k, 13 * k);
}

/** A far skyline: tower outlines (with the odd spire/stepped crown) from the horizon up. */
export function skyline(base: number, towers: [number, number, number][]) {
  return towers
    .map(([x, w, h], i) => {
      const top = base - h;
      if (i % 4 === 1) return `M${x} ${base}V${top + 8}h${n(w * 0.2)}v-8h${n(w * 0.6)}v8h${n(w * 0.2)}V${base}Z`;
      if (i % 5 === 2) return `M${x} ${base}V${top}h${n(w / 2 - 1)}v-14h2v14h${n(w / 2 - 1)}V${base}Z`;
      return rect(x, top, w, h);
    })
    .join('');
}
