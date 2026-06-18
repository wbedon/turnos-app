-- Corrige next_ticket_number para que no filtre por fecha.
-- El filtro AND created_at::date = current_date causaba duplicados al cruzar días
-- porque la constraint unique(queue_id, number) es independiente de la fecha.
-- La solución correcta es usar MAX global y delegar el "reinicio de numeración"
-- a reset_daily_queues (que borra los tickets, no sólo los cancela).

CREATE OR REPLACE FUNCTION next_ticket_number(q_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  n int;
BEGIN
  SELECT COALESCE(MAX(number), 0) + 1
  INTO n
  FROM tickets
  WHERE queue_id = q_id;
  RETURN n;
END;
$$;

-- Corrige reset_daily_queues para BORRAR tickets en lugar de cancelarlos.
-- Borrar los tickets permite que next_ticket_number vuelva a 1 en el día siguiente.
CREATE OR REPLACE FUNCTION reset_daily_queues()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM tickets;
  UPDATE queues SET current_serving = 0;
END;
$$;
