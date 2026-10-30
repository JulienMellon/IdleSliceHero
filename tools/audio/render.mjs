// Render a .mid to a stereo 44.1 kHz WAV with spessasynth_core and a General MIDI soundfont.
// usage: node render.mjs in.mid out.wav [tailSeconds]
// SF2 env var picks the soundfont (default: TimGM6mb).
import fs from 'node:fs';
import {
  SoundBankLoader, BasicMIDI, SpessaSynthProcessor, SpessaSynthSequencer, audioToWav, SpessaLog,
} from 'spessasynth_core';

const [, , inPath, outPath, tailArg] = process.argv;
const SF = process.env.SF2 || '/usr/share/sounds/sf2/TimGM6mb.sf2';
const SR = 44100;
const tail = Number(tailArg ?? 1.5);

try { SpessaLog.setLogging?.(false, false, false); } catch {}
const toAB = (b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
const bank = SoundBankLoader.fromArrayBuffer(toAB(fs.readFileSync(SF)));
const midi = BasicMIDI.fromArrayBuffer(toAB(fs.readFileSync(inPath)), inPath);

const synth = new SpessaSynthProcessor(SR, { effectsEnabled: true, eventsEnabled: false });
synth.soundBankManager.addSoundBank(bank, 'main');
await synth.processorInitialized;
const seq = new SpessaSynthSequencer(synth);
seq.loopCount = 0;
seq.skipToFirstNoteOn = false;
seq.loadNewSongList([midi]);
seq.play();

const total = Math.ceil((midi.duration + tail) * SR);
const L = new Float32Array(total), R = new Float32Array(total);
const BS = 128;
for (let i = 0; i < total; i += BS) {
  seq.processTick();
  synth.process(L, R, i, Math.min(BS, total - i));
}
// raw float32 interleaved so Python can post-process (loop seams, loudness) without WAV normalisation
const inter = new Float32Array(total * 2);
for (let i = 0; i < total; i++) { inter[2 * i] = L[i]; inter[2 * i + 1] = R[i]; }
fs.writeFileSync(outPath, Buffer.from(inter.buffer));
console.log(`${outPath} ${(total / SR).toFixed(2)}s`);
