// The audio output seam (card A1): the mixer calls only this. The contract lives in output-core.ts;
// output.web.ts (expo-audio, as before) and output.native.ts (react-native-audio-api for effects and stingers) are
// what Metro resolves for `./output` on each platform. Node and tsc resolve this file: a silent output.
import { createSilentOutput } from './output-core';

export * from './output-core';
export const createOutput = createSilentOutput;
