import { useEffect, useRef, useState } from 'react';

// ---------- animation clock ----------
export function useClock(fps: number, paused: boolean) {
  const [t, setT] = useState(0);
  const base = useRef({ wall: Date.now(), t: 0 });
  useEffect(() => {
    if (paused) return;
    base.current = { wall: Date.now(), t: base.current.t };
    const id = setInterval(() => setT(base.current.t + (Date.now() - base.current.wall) / 1000), 1000 / fps);
    return () => {
      base.current.t += (Date.now() - base.current.wall) / 1000;
      clearInterval(id);
    };
  }, [fps, paused]);
  return t;
}

/** Linear interpolation along a polyline at fraction k (0..1) of its length. */
export function along(path: [number, number][], k: number): [number, number] {
  const segs = path.slice(1).map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1]));
  const total = segs.reduce((a, b) => a + b, 0) || 1;
  let d = Math.max(0, Math.min(1, k)) * total;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const f = segs[i] ? Math.min(1, d / segs[i]) : 1;
      return [path[i][0] + (path[i + 1][0] - path[i][0]) * f, path[i][1] + (path[i + 1][1] - path[i][1]) * f];
    }
    d -= segs[i];
  }
  return path[path.length - 1];
}
