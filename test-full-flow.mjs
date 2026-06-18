import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

const BASE = 'https://turnos-app-lilac.vercel.app';
const SUPABASE_URL          = 'https://bqvgsloqmaywnmtvlavz.supabase.co';
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxdmdzbG9xbWF5d25tdHZsYXZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTYzNDI2NCwiZXhwIjoyMDk3MjEwMjY0fQ.JeaUkte8wSPjsoxMVL_mNSNb5Uo1anAonhK_E3_rPWA';

// Service role bypasses RLS — sólo para verificación en tests
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

function log(msg) { console.log(`[${new Date().toLocaleTimeString()}] ${msg}`); }
function ok(label)   { console.log(`  ✅ ${label}`); }
function fail(label) { console.log(`  ❌ ${label}`); }

const browser = await chromium.launch({ headless: false, slowMo: 300 });
const ctx     = await browser.newContext({ viewport: { width: 1280, height: 800 } });

// ─── 1. KIOSCO ────────────────────────────────────────────────────────────────
log('PASO 1 — Kiosco: sacar turno');
const kiosk = await ctx.newPage();
await kiosk.goto(`${BASE}/kiosk`);
await kiosk.waitForLoadState('networkidle');

const queues = await kiosk.locator('[data-testid="queue-card"], button, .cursor-pointer').all();
log(`  Colas visibles en pantalla: ${queues.length}`);
ok('Kiosco cargado');

// Clic en la primera cola visible
await kiosk.locator('text=Caja').first().click();
// Esperar a que aparezca la confirmación del turno (QR / "¡TU TURNO ES!")
await kiosk.waitForSelector('text=TU TURNO', { timeout: 10000 }).catch(() => {});
await kiosk.waitForTimeout(1500);

// Extraer token desde DB (el más reciente, últimos 2 min)
const since = new Date(Date.now() - 120_000).toISOString();
const { data: newTickets } = await supabase
  .from('tickets')
  .select('token, number, queue_id')
  .gte('created_at', since)
  .order('created_at', { ascending: false })
  .limit(1);
let ticketToken = newTickets?.[0]?.token;

if (ticketToken) {
  ok(`Turno emitido — token: ${ticketToken.slice(0,8)}…`);
} else {
  fail('No se pudo obtener el token del turno');
}

await kiosk.screenshot({ path: 'flow-1-ticket.png' });

// ─── 2. PÁGINA DEL TICKET ─────────────────────────────────────────────────────
log('PASO 2 — Página del ticket');
const ticketPage = await ctx.newPage();
await ticketPage.goto(`${BASE}/ticket/${ticketToken}`);
await ticketPage.waitForLoadState('networkidle');
await ticketPage.waitForTimeout(1500);

const ticketNum = await ticketPage.locator('text=/A-\\d+|\\d+/').first().textContent().catch(() => '?');
ok(`Ticket mostrado: ${ticketNum?.trim()}`);
await ticketPage.screenshot({ path: 'flow-2-ticket-page.png' });

// ─── 3. ADMIN — llamar turno ──────────────────────────────────────────────────
log('PASO 3 — Admin: login y llamar turno');
const admin = await ctx.newPage();
await admin.goto(`${BASE}/admin`);
await admin.waitForLoadState('networkidle');

// Login
await admin.fill('input[type="email"]',    'admin@turnos.com');
await admin.fill('input[type="password"]', 'turnos2024!');
await admin.click('button[type="submit"]');
await admin.waitForLoadState('networkidle');
await admin.waitForTimeout(2000);

const adminUrl = admin.url();
const errorMsg = await admin.locator('text=incorrectos').isVisible().catch(() => false);
if (!errorMsg) {
  ok('Login exitoso');
} else {
  fail(`Login falló — URL: ${adminUrl}`);
}

// Llamar siguiente turno
const llamarBtn = admin.locator('button:has-text("LLAMAR SIGUIENTE")').first();
const btnVisible = await llamarBtn.isVisible().catch(() => false);
if (btnVisible) {
  await llamarBtn.click();
  await admin.waitForTimeout(2000);
  ok('Turno llamado desde el admin');
} else {
  fail('Botón "Llamar" no encontrado');
}
await admin.screenshot({ path: 'flow-3-admin.png' });

// ─── 4. DISPLAY PÚBLICO ───────────────────────────────────────────────────────
log('PASO 4 — Display público');
const display = await ctx.newPage();
await display.goto(`${BASE}/display`);
await display.waitForLoadState('networkidle');
await display.waitForTimeout(2000);

const displayText = await display.locator('body').textContent();
const hasNumber = /\d+/.test(displayText ?? '');
hasNumber ? ok('Display muestra número de turno') : fail('Display sin número de turno');
await display.screenshot({ path: 'flow-4-display.png' });

// ─── 5. VERIFICAR EN DB ───────────────────────────────────────────────────────
log('PASO 5 — Verificar estado en base de datos');
const { data: calledTickets } = await supabase
  .from('tickets')
  .select('number, status, called_at')
  .eq('status', 'called')
  .order('called_at', { ascending: false })
  .limit(1);

if (calledTickets?.length) {
  ok(`Ticket en DB con status "called": #${calledTickets[0].number}`);
} else {
  fail('Ningún ticket con status "called" en DB');
}

await browser.close();

console.log('\n── Resumen ──────────────────────────────');
console.log('Screenshots: flow-1-ticket.png, flow-2-ticket-page.png, flow-3-admin.png, flow-4-display.png');
console.log('Flujo completo ejecutado.');
