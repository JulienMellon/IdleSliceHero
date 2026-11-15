// The web build: expo-audio for everything, as before the output seam. Nothing plays until the first pointer press
// (the director holds back until then), and scripts/screenshots.py logs every play().
import { createExpoOutput } from './expo-output';
import type { AudioOutput } from './output-core';

export const createOutput = (): AudioOutput => createExpoOutput();
