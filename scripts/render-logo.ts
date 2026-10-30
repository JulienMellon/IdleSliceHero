// Renders the app icon and the splash image from src/components/logo-art.ts. Run: npx tsx scripts/render-logo.ts
// icon.png: 1024² on the HUD red, art inset (Apple masks the corners); splash-icon.png: 1024², transparent.
// @ts-expect-error playwright is installed in the build environment (screenshots), not as a project dependency
import { chromium } from 'playwright';
import { LOGO_RED, logoSvg } from '../src/components/logo-art';

async function render(svg: string, out: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
  await page.locator('svg').screenshot({ path: out, omitBackground: true });
  await browser.close();
}

(async () => {
  await render(logoSvg(1024, LOGO_RED, 14), 'assets/images/icon.png');
  await render(logoSvg(1024, null, 6), 'assets/images/splash-icon.png');
  console.log('wrote assets/images/icon.png and splash-icon.png');
})();
