// Tiny event bus so the map can tell the HUD "a delivery just paid out" without re-rendering the screen.
type Listener = () => void;
const listeners = new Set<Listener>();

export function onPayout(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function emitPayout() {
  listeners.forEach((fn) => fn());
}
