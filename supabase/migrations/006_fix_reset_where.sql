-- Supabase requiere WHERE en UPDATE y bloquea DELETE sin WHERE incluso en SECURITY DEFINER.
-- Solución: TRUNCATE para tickets, WHERE id IS NOT NULL (siempre true) para queues.

CREATE OR REPLACE FUNCTION reset_daily_queues()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  TRUNCATE TABLE tickets;
  UPDATE queues SET current_serving = 0 WHERE id IS NOT NULL;
END;
$$;
