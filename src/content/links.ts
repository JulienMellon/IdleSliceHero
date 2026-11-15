// The two public pages (published from site/ by .github/workflows/pages.yml): the privacy policy App Review and the privacy label point at, and the support page.
// One place. Settings opens them (src/components/store/links.ts re-exports these) and docs/STORE-LISTING.md quotes them.
// The host is the repository's GitHub Pages address; when the site moves to its own domain, change SITE_URL here, in site/**'s canonical links and in App Store Connect.
export const SITE_URL = 'https://julienmellon.github.io/IdleSliceHero';
export const PRIVACY_URL = `${SITE_URL}/privacy/`;
export const SUPPORT_URL = `${SITE_URL}/support/`;
