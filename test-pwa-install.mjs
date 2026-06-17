import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const userDataDir = './tmp-chrome-profile';
mkdirSync(userDataDir, { recursive: true });

// Contexto persistente = Chrome con perfil real, no incógnito
// Esto permite que beforeinstallprompt se dispare
const context = await chromium.launchPersistentContext(userDataDir, {
  channel: 'chrome',
  headless: false,
  args: ['--enable-features=WebAppInstallation'],
});

const page = await context.newPage();

// Inyectar listener antes de que cargue la página
await page.addInitScript(() => {
  window.__installPromptFired = false;
  window.addEventListener('beforeinstallprompt', () => {
    window.__installPromptFired = true;
  });
});

console.log('Navegando a la app...');
await page.goto('https://turnos-app-lilac.vercel.app/kiosk');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(5000);

// Verificar evento y componentes en UI
const promptFired  = await page.evaluate(() => window.__installPromptFired);
const bannerVisible = await page.locator('text=Instalá la app').isVisible().catch(() => false);
const btnVisible    = await page.locator('button:has-text("Instalar")').isVisible().catch(() => false);

console.log(`beforeinstallprompt disparado: ${promptFired  ? '✅ SÍ' : '❌ NO'}`);
console.log(`Banner "Instalá la app":       ${bannerVisible ? '✅ SÍ' : '❌ NO'}`);
console.log(`Botón "Instalar" visible:      ${btnVisible    ? '✅ SÍ' : '❌ NO'}`);

await page.screenshot({ path: 'pwa-install-banner.png' });
console.log('Screenshot guardado: pwa-install-banner.png');

await context.close();
