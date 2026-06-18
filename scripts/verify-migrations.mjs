import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://bqvgsloqmaywnmtvlavz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxdmdzbG9xbWF5d25tdHZsYXZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTYzNDI2NCwiZXhwIjoyMDk3MjEwMjY0fQ.JeaUkte8wSPjsoxMVL_mNSNb5Uo1anAonhK_E3_rPWA'
);

const cajaId = '9176dd66-07d4-4d2b-ad46-26078514d107';

// Reset inicial para partir de cero
const { error: r0 } = await sb.rpc('reset_daily_queues');
console.log('Reset inicial:', r0 ? 'ERROR: ' + r0.message : 'OK');

// Crear 3 tickets
for (let i = 0; i < 3; i++) {
  const { data: n } = await sb.rpc('next_ticket_number', { q_id: cajaId });
  await sb.from('tickets').insert({ queue_id: cajaId, number: n });
  console.log('  Ticket creado: #' + n);
}

// Reset del día
const { error: resetErr } = await sb.rpc('reset_daily_queues');
console.log('reset_daily_queues:', resetErr ? 'ERROR: ' + resetErr.message : 'OK');

// Verificar estado post-reset
const { count } = await sb.from('tickets').select('*', { count: 'exact', head: true });
console.log('Tickets tras reset:', count, '(esperado: 0)');

const { data: queues } = await sb.from('queues').select('name, current_serving');
const allZero = queues?.every(q => q.current_serving === 0);
console.log('Queues current_serving = 0:', allZero ? 'SI' : 'NO');

// Primer número del nuevo día debe ser 1
const { data: n1 } = await sb.rpc('next_ticket_number', { q_id: cajaId });
console.log('Primer número post-reset:', n1, '(esperado: 1)');
