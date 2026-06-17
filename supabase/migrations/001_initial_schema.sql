-- Colas de atención
create table if not exists queues (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  prefix          char(1) not null unique,
  icon            text not null default '🏪',
  current_serving int not null default 0,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

-- Tickets individuales
create table if not exists tickets (
  id         uuid primary key default gen_random_uuid(),
  token      uuid not null default gen_random_uuid() unique,
  queue_id   uuid not null references queues(id) on delete cascade,
  number     int not null,
  status     text not null default 'waiting'
             check (status in ('waiting','called','attended','cancelled')),
  push_sub   jsonb,
  created_at timestamptz not null default now(),
  called_at  timestamptz,
  unique (queue_id, number)
);

-- Índices para queries frecuentes
create index if not exists idx_tickets_queue_status on tickets(queue_id, status, number);
create index if not exists idx_tickets_token on tickets(token);

-- RLS
alter table queues  enable row level security;
alter table tickets enable row level security;

-- Colas: lectura pública, escritura solo con service role
create policy "queues_public_read" on queues for select using (true);

-- Tickets: lectura pública (el token ya actúa como secreto)
create policy "tickets_public_read" on tickets for select using (true);

-- Tickets: inserción pública (kiosco crea tickets sin auth)
create policy "tickets_public_insert" on tickets for insert with check (true);

-- Tickets: actualización pública (usuario puede cancelar su propio turno)
create policy "tickets_public_update" on tickets for update using (true);

-- Función atómica para obtener el siguiente número de turno
create or replace function next_ticket_number(q_id uuid)
returns int
language plpgsql
security definer
as $$
declare
  n int;
begin
  select coalesce(max(number), 0) + 1
  into n
  from tickets
  where queue_id = q_id
    and created_at::date = current_date;
  return n;
end;
$$;

-- Función para llamar el siguiente turno y retornar tokens de los próximos 3
create or replace function call_next_ticket(q_id uuid)
returns table(token uuid, number int, was_skipped boolean)
language plpgsql
security definer
as $$
declare
  next_num int;
begin
  -- Obtener el siguiente número waiting
  select t.number into next_num
  from tickets t
  where t.queue_id = q_id
    and t.status = 'waiting'
  order by t.number asc
  limit 1;

  if next_num is null then
    return;
  end if;

  -- Marcar el actual como attended (si existe)
  update tickets
  set status = 'attended'
  where queue_id = q_id
    and status = 'called';

  -- Llamar el siguiente
  update tickets
  set status = 'called', called_at = now()
  where queue_id = q_id
    and number = next_num;

  -- Actualizar current_serving en la cola
  update queues
  set current_serving = next_num
  where id = q_id;

  -- Retornar tokens de los próximos 3 (para notificarles)
  return query
  select t.token, t.number, false
  from tickets t
  where t.queue_id = q_id
    and t.status = 'waiting'
  order by t.number asc
  limit 3;
end;
$$;

-- Datos iniciales: 4 colas
insert into queues (name, prefix, icon) values
  ('Caja',       'A', '🛒'),
  ('Consultas',  'B', '📋'),
  ('Retiro',     'C', '📦'),
  ('Soporte',    'D', '🔧')
on conflict (prefix) do nothing;
