/**
 * Aplica SQL directamente al proyecto Supabase usando la API de administración.
 * Requiere SUPABASE_ACCESS_TOKEN (personal access token del dashboard de Supabase).
 *
 * Si no tenés el token: copiá el contenido del archivo SQL y ejecutalo en
 * https://supabase.com/dashboard/project/bqvgsloqmaywnmtvlavz/sql/new
 */
import { readFileSync } from 'fs';

const PROJECT_REF = 'bqvgsloqmaywnmtvlavz';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error('ERROR: SUPABASE_ACCESS_TOKEN no está definido.');
  console.error('Configuralo con: $env:SUPABASE_ACCESS_TOKEN="tu-token"');
  console.error('O ejecutá el SQL manualmente en:');
  console.error(`  https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`);
  process.exit(1);
}

const migrationFile = process.argv[2] ?? './supabase/migrations/005_fix_reset_fn.sql';
const sql = readFileSync(migrationFile, 'utf8');
console.log('Aplicando:', migrationFile);

const resp = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  }
);

if (resp.ok) {
  console.log('✅ Migration aplicada correctamente');
} else {
  const text = await resp.text();
  console.error('❌ Error:', resp.status, text);
}
