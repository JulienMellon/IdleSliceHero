import { FOOTPRINTS } from '../../../content/tuning';
import { cameoGeom, sayLines, sayHeight, linesOf } from '../cameo';
import { layout } from '../layout';
import { staffFaces } from '../stations';
import { bubbleWidth, bubbleX, bubbleWalls } from '../moments';
const r = (a: any) => Object.fromEntries(Object.entries(a).map(([k, v]) => [k, Math.round(v as number)]));
test('dbg', () => {
  const DS = [2, 2, 3, 3, 4];
  for (let fp = 0; fp < FOOTPRINTS.length; fp++) for (const staff of [1, 2, 3]) {
    const lay = layout(fp, FOOTPRINTS[fp].ovenSlots, fp === 0 ? 2 : 3, staff, 8, DS[fp], 1);
    const g = cameoGeom(lay, 'Nonna · 6d 4h');
    const line = sayLines(linesOf('nonna')[0]);
    const w = Math.max(...line.map(bubbleWidth));
    const cx = bubbleX(g.tailX, w, bubbleWalls(lay));
    console.log(JSON.stringify({ fp, staff, body: r(g.body), tag: r(g.tag), say: r({ x0: cx - w / 2, x1: cx + w / 2, y0: g.sayY - sayHeight(line), y1: g.sayY }), faces: staffFaces(lay).map(r) }));
  }
});
