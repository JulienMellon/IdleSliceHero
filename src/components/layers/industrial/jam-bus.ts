// The jam pulses for the audio lane: `jam` when an oven jams, `jamfixed` when it is fixed (by the wrench, or by the Head Baker). Same shape
// as pulse-bus.ts (onX returns the unsubscribe); emitted by jam-pulses.tsx, which is mounted whichever shop is on screen.
type Listener = () => void;

function pulse() {
  const listeners = new Set<Listener>();
  return {
    on(fn: Listener) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    emit() {
      listeners.forEach((fn) => fn());
    },
  };
}

const jam = pulse();
const fixed = pulse();

export const onJam = jam.on;
export const emitJam = jam.emit;
export const onJamFixed = fixed.on;
export const emitJamFixed = fixed.emit;
