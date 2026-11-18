// The part of a scrolled wide shop that is on screen, for the one scene overlay that clamps to it (the jam's label, D512). A context, not a prop on every overlay, so the
// seven memoised overlays do not re-render while the shop scrolls (U25): only a consumer does. Null: the shop does not scroll, the overlay has its whole width.
import { createContext } from 'react';

import type { Span } from './viewport';

export const SceneViewContext = createContext<Span | null>(null);
