import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

const BASE = 'https://turnos-app-lilac.vercel.app';
const sb = createClient(
  'https://bqvgsloqmaywnmtvlavz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxdmdzbG9xbWF5d25tdHZsYXZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTYzNDI2NCwiZXhwIjoyMDk3MjEwMjY0fQ.JeaUkte8wSPjsoxMVL_mNSNb5Uo1anAonhK_E3_rPWA'
);

const ok   = (s) => console.log(`  ✅ ${s}`);
const fail = (s) => console.log(`  ❌ ${s}`);

const browser = await chromium.launch({ headless: false, slowMo: 300 });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });

// 1. Kiosco
console.log('1 — Kiosco');
const kiosk = await ctx.newPage();
await kiosk.goto(`${BASE}/kiosk`);
await kiosk.waitForLoadState('networkidle');
await kiosk.locator('text=Caja').first().click();
await kiosk.waitForSelector('text=TU TURNO', { timeout: 10000 }).catch(() => {});
await kiosk.waitForTimeout(1500);
const { data: [ticket] = [] } = await sb.from('tickets').select('token,number').order('created_at', { ascending: false }).limit(1);
ticket ? ok(`Turno emitido — A-${String(ticket.number).padStart(3,'0')}`) : fail('Sin turno en DB');

// 2. Ticket page
console.log('2 — Ticket');
const tPage = await ctx.newPage();
await tPage.goto(`${BASE}/ticket/${ticket?.token}`);
await tPage.waitForLoadState('networkidle');
await tPage.waitForTimeout(1000);
const hasNum = await tPage.locator(`text=A-${String(ticket?.number).padStart(3,'0')}`).isVisible().catch(() => false);
hasNum ? ok('Página del ticket carga') : fail('Número no visible');

// 3. Admin
console.log('3 — Admin');
const admin = await ctx.newPage();
await admin.goto(`${BASE}/admin`);
await admin.waitForLoadState('networkidle');
await admin.fill('input[type="email"]', 'admin@turnos.com');
await admin.fill('input[type="password"]', 'turnos2024!');
await admin.click('button[type="submit"]');
await admin.waitForTimeout(2000);
const loginOk = !await admin.locator('text=incorrectos').isVisible().catch(() => false);
loginOk ? ok('Login') : fail('Login falló');
await admin.locator('button:has-text("LLAMAR SIGUIENTE")').first().click();
await admin.waitForTimeout(2000);
ok('Turno llamado');

// 4. Display
console.log('4 — Display');
const display = await ctx.newPage();
await display.goto(`${BASE}/display`);
await display.waitForLoadState('networkidle');
await display.waitForTimeout(1500);
const hasDisplay = /\d+/.test(await display.locator('body').textContent());
hasDisplay ? ok('Display muestra número') : fail('Display sin número');

// 5. DB
console.log('5 — DB');
const { data: [called] = [] } = await sb.from('tickets').select('number,status').eq('status','called').limit(1);
called ? ok(`Ticket #${called.number} con status "called"`) : fail('Ningún ticket called en DB');

await browser.close();
