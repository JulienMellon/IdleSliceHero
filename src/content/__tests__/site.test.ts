// Step 1 and 2 of card L1: the public pages exist, say what the code does, and the two URLs the app opens are the pages the site publishes.
import * as fs from 'fs';
import * as path from 'path';

import { PRIVACY_URL, SITE_URL, SUPPORT_URL } from '../links';
import { EVENTS } from '../../services/events';

const ROOT = path.resolve(__dirname, '../../..');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const privacy = read('site/privacy/index.html');
const support = read('site/support/index.html');
const index = read('site/index.html');
const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ');

describe('links', () => {
  it('are the pages site/ publishes', () => {
    expect(PRIVACY_URL).toBe(`${SITE_URL}/privacy/`);
    expect(SUPPORT_URL).toBe(`${SITE_URL}/support/`);
    expect(PRIVACY_URL.startsWith('https://')).toBe(true);
    expect(fs.existsSync(path.join(ROOT, 'site/privacy/index.html'))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, 'site/support/index.html'))).toBe(true);
  });

  it('the pages workflow publishes site/', () => {
    const wf = read('.github/workflows/pages.yml');
    expect(wf).toMatch(/upload-pages-artifact/);
    expect(wf).toMatch(/path: site/);
  });
});

describe('the privacy policy follows the code (card L1 step 2)', () => {
  const pkg = JSON.parse(read('package.json')).dependencies as Record<string, string>;
  const sdks: [string, string][] = [
    ['posthog-react-native', 'PostHog'],
    ['@sentry/react-native', 'Sentry'],
    ['react-native-purchases', 'RevenueCat'],
    ['react-native-google-mobile-ads', 'AdMob'],
  ];

  it.each(sdks)('%s is shipped, so the policy names %s', (dep, name) => {
    expect(pkg[dep]).toBeDefined();
    expect(text(privacy)).toContain(name);
  });

  it('says what the opt-out covers and where it is in Settings', () => {
    expect(text(privacy)).toContain('Share anonymous analytics');
    expect(text(privacy)).toContain('Install ID');
    expect(text(support)).toContain('Install ID');
  });

  it('does not claim a location from PostHog (the code turns the lookup off)', () => {
    const src = read('src/services/analytics.native.ts');
    expect(src).toMatch(/disableGeoip:\s*true/);
    expect(text(privacy)).not.toMatch(/approximate country/i);
  });

  it('names every analytics event the code defines', () => {
    // the policy describes them by meaning; this keeps the list from growing unnoticed: five groups, nine events
    expect(Object.keys(EVENTS)).toHaveLength(9);
    for (const word of ['session', 'ad was offered', 'purchase', 'story scene', 'pizzeria was built']) expect(text(privacy)).toContain(word);
  });

  it('keeps its placeholders visible, and only these', () => {
    const ph = [...privacy.matchAll(/<span class="ph">([^<]+)<\/span>/g)].map((m) => m[1]);
    expect(new Set(ph)).toEqual(new Set(['EFFECTIVE_DATE', 'COMPANY_NAME', 'COMPANY_LOCATION', 'SUPPORT_EMAIL', 'RETENTION_MONTHS']));
  });
});

describe('the pages', () => {
  it('the landing page has the name, three screenshots and a support link', () => {
    expect(index).toContain('<h1>Slice Empire</h1>');
    expect((index.match(/<img /g) ?? []).length).toBe(3);
    for (const n of [1, 2, 3]) expect(fs.existsSync(path.join(ROOT, `site/img/shot-${n}.jpg`))).toBe(true);
    expect(index).toMatch(/href="support\/"/);
    expect(index).toMatch(/href="privacy\/"/);
  });

  it('every image has alt text', () => {
    for (const html of [index, privacy, support]) for (const tag of html.match(/<img [^>]*>/g) ?? []) expect(tag).toMatch(/alt="[^"]+"/);
  });

  it('the support page has the contact placeholder and the data-request steps', () => {
    expect(support).toContain('SUPPORT_EMAIL');
    expect(support).toContain('id="data"');
    expect(privacy).toContain('support/#data');
  });
});
