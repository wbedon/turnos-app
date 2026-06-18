-- Corrige reset_daily_queues: usa TRUNCATE en lugar de DELETE sin WHERE.
-- Supabase bloquea DELETE sin cláusula WHERE como protección contra borrados accidentales.
-- TRUNCATE es equivalente pero más eficiente y no tiene esa restricción.

CREATE OR REPLACE FUNCTION reset_daily_queues()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  TRUNCATE TABLE tickets;
  UPDATE queues SET current_serving = 0;
END;
$$;
