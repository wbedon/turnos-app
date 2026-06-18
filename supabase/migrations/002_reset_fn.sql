-- SUPERSEDED por migration 006 (usa TRUNCATE + WHERE id IS NOT NULL).
-- Se conserva sólo como historia; la función activa en producción es la de 006.
-- Resetea turnos del día: cancela los pendientes y vuelve current_serving a 0
CREATE OR REPLACE FUNCTION reset_daily_queues()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE tickets
  SET status = 'cancelled'
  WHERE status IN ('waiting', 'called')
    AND created_at::date = current_date;

  UPDATE queues
  SET current_serving = 0;
END;
$$;
