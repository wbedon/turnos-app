import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://bqvgsloqmaywnmtvlavz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxdmdzbG9xbWF5d25tdHZsYXZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTYzNDI2NCwiZXhwIjoyMDk3MjEwMjY0fQ.JeaUkte8wSPjsoxMVL_mNSNb5Uo1anAonhK_E3_rPWA'
);

// Eliminar todos los tickets de días anteriores
const today = new Date().toISOString().slice(0, 10);
const { error, count } = await sb
  .from('tickets')
  .delete({ count: 'exact' })
  .lt('created_at', today);

if (error) {
  console.log('ERROR eliminando tickets:', error.message);
} else {
  console.log(`Tickets de días anteriores eliminados: ${count}`);
}

// Resetear current_serving en todas las colas
const { error: qErr } = await sb
  .from('queues')
  .update({ current_serving: 0 })
  .gte('id', '00000000-0000-0000-0000-000000000000');

if (qErr) {
  console.log('ERROR reseteando queues:', qErr.message);
} else {
  console.log('Queues reseteadas a current_serving = 0');
}

// Verificar estado final
const { data: tickets } = await sb.from('tickets').select('number, status').order('number');
const { data: queues } = await sb.from('queues').select('name, current_serving');
console.log('Tickets restantes:', JSON.stringify(tickets));
console.log('Queues:', JSON.stringify(queues));
