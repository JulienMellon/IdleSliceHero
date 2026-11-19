// The Test panel's registry: one entry per titled block. Cards X2 to X4 append to PANEL_SECTIONS (one entry each) and give it a `Body`;
// until then a block is just its title. Nothing here may be imported from outside src/dev/ (src/dev/README.md).
import type { ComponentType } from 'react';

export interface PanelSection {
  id: string;
  title: string;
  /** The block's rows; none yet = an empty body. */
  Body?: ComponentType;
}

export const PANEL_SECTIONS: PanelSection[] = [
  { id: 'money', title: 'Money' },
  { id: 'hoods', title: 'Neighbourhoods' },
  { id: 'time', title: 'Time' },
  { id: 'story', title: 'Story & save' },
];
