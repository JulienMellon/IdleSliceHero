// List the melodic presets of a soundfont as JSON: [{msb, lsb, program, name, drum}]. usage: node presets.mjs bank.sf2
import fs from 'node:fs';
import { SoundBankLoader, BasicSoundBank } from 'spessasynth_core';
await BasicSoundBank.ready;
const b = fs.readFileSync(process.argv[2]);
const bank = SoundBankLoader.fromArrayBuffer(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
console.log(JSON.stringify(bank.presets.map((p) => ({ msb: p.bankMSB, lsb: p.bankLSB, program: p.program, name: p.name, drum: !!p.isGMGSDrum }))));
