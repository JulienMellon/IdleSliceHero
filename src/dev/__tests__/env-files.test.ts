/// <reference types="jest" />
// Card X1: the switch is turned on only by the person making a test build, never by a file in the repo that an App Store build would read.
import * as fs from 'fs';
import * as path from 'path';

const REPO = path.resolve(__dirname, '..', '..', '..');
const SWITCH = 'EXPO_PUBLIC_TEST_MODE';

/** The repo-root files that are env files (`.env`, `.env.production`, `.env.local`, ...). */
const envFiles = () => fs.readdirSync(REPO).filter((n) => n === '.env' || n.startsWith('.env.'));

/** Whether a build profile of eas.json sets the switch, itself or through the profiles it extends. */
export function profileSets(eas: { build?: Record<string, { env?: Record<string, string>; extends?: string }> }, name: string, seen: string[] = []): boolean {
  const p = eas.build?.[name];
  if (!p || seen.includes(name)) return false;
  if (p.env && SWITCH in p.env) return true;
  return !!p.extends && profileSets(eas, p.extends, [...seen, name]);
}

describe('env files', () => {
  it(`no .env* file at the repo root mentions ${SWITCH}`, () => {
    for (const f of envFiles()) expect([f, fs.readFileSync(path.join(REPO, f), 'utf8').includes(SWITCH)]).toEqual([f, false]);
  });
  it(`eas.json's production profile (if the file exists) does not set ${SWITCH}`, () => {
    const file = path.join(REPO, 'eas.json');
    if (!fs.existsSync(file)) return;
    expect(profileSets(JSON.parse(fs.readFileSync(file, 'utf8')), 'production')).toBe(false);
  });
  it('the check itself sees a profile that sets it, directly or through extends', () => {
    const eas = { build: { base: { env: { [SWITCH]: '1' } }, production: { extends: 'base' }, other: { env: { [SWITCH]: '1' } }, clean: {} } };
    expect(profileSets(eas, 'production')).toBe(true);
    expect(profileSets(eas, 'other')).toBe(true);
    expect(profileSets(eas, 'clean')).toBe(false);
    expect(profileSets({}, 'production')).toBe(false);
  });
  it('.gitignore keeps stray env files out of git (.env, .env.*; the local ones too)', () => {
    const ignore = fs
      .readFileSync(path.join(REPO, '.gitignore'), 'utf8')
      .split('\n')
      .map((l) => l.trim());
    expect(ignore).toEqual(expect.arrayContaining(['.env', '.env.*', '.env*.local', 'dist-test/']));
  });
});
