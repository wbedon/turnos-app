-- ─────────────────────────────────────────────────────────────────
-- Estimación de tiempo de espera basada en datos históricos
-- ─────────────────────────────────────────────────────────────────

-- 1. Columna attended_at (emisión → llamado → atención)
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS attended_at timestamptz;

-- 2. Índice para queries históricas rápidas
CREATE INDEX IF NOT EXISTS idx_tickets_attended
  ON tickets(queue_id, attended_at DESC)
  WHERE status = 'attended';

-- 3. Actualizar call_next_ticket para registrar attended_at
DROP FUNCTION IF EXISTS call_next_ticket(uuid);

CREATE FUNCTION call_next_ticket(q_id uuid)
RETURNS TABLE(token uuid, number int, is_current boolean)
LANGUAGE plpgsql
AS $$
DECLARE
  v_next_num int;
BEGIN
  SELECT t.number INTO v_next_num
  FROM tickets t
  WHERE t.queue_id = q_id AND t.status = 'waiting'
  ORDER BY t.number ASC LIMIT 1;

  IF v_next_num IS NULL THEN RETURN; END IF;

  -- Marcar ticket anterior como attended CON timestamp
  UPDATE tickets
  SET status = 'attended', attended_at = now()
  WHERE tickets.queue_id = q_id AND tickets.status = 'called';

  -- Llamar siguiente
  UPDATE tickets
  SET status = 'called', called_at = now()
  WHERE tickets.queue_id = q_id AND tickets.number = v_next_num;

  -- Actualizar cola
  UPDATE queues SET current_serving = v_next_num WHERE queues.id = q_id;

  RETURN QUERY
  SELECT t.token, t.number, false
  FROM tickets t
  WHERE t.queue_id = q_id AND t.status = 'waiting'
  ORDER BY t.number ASC LIMIT 3;
END;
$$;

-- 4. Tiempo promedio de atención (called_at → attended_at)
--    Mide cuánto tarda el operador en atender a cada persona
CREATE OR REPLACE FUNCTION get_avg_service_minutes(
  p_queue_id uuid,
  p_sample   int     DEFAULT 50,
  p_default  numeric DEFAULT 5
)
RETURNS numeric
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE v_avg numeric;
BEGIN
  SELECT ROUND(
    AVG(EXTRACT(EPOCH FROM (attended_at - called_at)) / 60)::numeric, 1
  ) INTO v_avg
  FROM (
    SELECT attended_at, called_at
    FROM tickets
    WHERE queue_id    = p_queue_id
      AND status      = 'attended'
      AND attended_at IS NOT NULL
      AND called_at   IS NOT NULL
      AND attended_at > called_at      -- descarta datos corruptos
    ORDER BY attended_at DESC
    LIMIT p_sample
  ) sub;
  RETURN COALESCE(v_avg, p_default);
END;
$$;

-- 5. Tiempo promedio de espera (created_at → called_at)
--    Mide cuánto espera cada persona desde que saca el turno hasta ser llamada
CREATE OR REPLACE FUNCTION get_avg_wait_minutes(
  p_queue_id uuid,
  p_sample   int     DEFAULT 50,
  p_default  numeric DEFAULT 5
)
RETURNS numeric
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE v_avg numeric;
BEGIN
  SELECT ROUND(
    AVG(EXTRACT(EPOCH FROM (called_at - created_at)) / 60)::numeric, 1
  ) INTO v_avg
  FROM (
    SELECT called_at, created_at
    FROM tickets
    WHERE queue_id = p_queue_id
      AND called_at IS NOT NULL
      AND status IN ('called', 'attended')
      AND called_at > created_at       -- descarta datos corruptos
    ORDER BY called_at DESC
    LIMIT p_sample
  ) sub;
  RETURN COALESCE(v_avg, p_default);
END;
$$;

-- 6. Función combinada: devuelve ambas métricas + cantidad de muestras disponibles
CREATE OR REPLACE FUNCTION get_queue_timing(
  p_queue_id uuid,
  p_sample   int     DEFAULT 50,
  p_default  numeric DEFAULT 5
)
RETURNS json
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
  v_service_avg numeric;
  v_wait_avg    numeric;
  v_sample_count int;
BEGIN
  -- Contar muestras reales disponibles
  SELECT COUNT(*) INTO v_sample_count
  FROM tickets
  WHERE queue_id    = p_queue_id
    AND status      = 'attended'
    AND attended_at IS NOT NULL
    AND called_at   IS NOT NULL;

  -- Tiempo de atención
  SELECT ROUND(
    AVG(EXTRACT(EPOCH FROM (attended_at - called_at)) / 60)::numeric, 1
  ) INTO v_service_avg
  FROM (
    SELECT attended_at, called_at FROM tickets
    WHERE queue_id = p_queue_id AND status = 'attended'
      AND attended_at IS NOT NULL AND called_at IS NOT NULL
      AND attended_at > called_at
    ORDER BY attended_at DESC LIMIT p_sample
  ) s;

  -- Tiempo de espera
  SELECT ROUND(
    AVG(EXTRACT(EPOCH FROM (called_at - created_at)) / 60)::numeric, 1
  ) INTO v_wait_avg
  FROM (
    SELECT called_at, created_at FROM tickets
    WHERE queue_id = p_queue_id AND called_at IS NOT NULL
      AND status IN ('called', 'attended') AND called_at > created_at
    ORDER BY called_at DESC LIMIT p_sample
  ) w;

  RETURN json_build_object(
    'avg_service_minutes', COALESCE(v_service_avg, p_default),
    'avg_wait_minutes',    COALESCE(v_wait_avg, p_default),
    'sample_count',        v_sample_count,
    'is_historical',       v_sample_count >= 5   -- mínimo 5 tickets para considerar dato real
  );
END;
$$;
