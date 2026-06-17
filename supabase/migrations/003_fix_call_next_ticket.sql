-- Fix ambiguous column reference "number" in call_next_ticket
-- Variable next_num was renamed to v_next_num to avoid collision
-- with the RETURNS TABLE output column also named "number"
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
  WHERE t.queue_id = q_id
    AND t.status = 'waiting'
  ORDER BY t.number ASC
  LIMIT 1;

  IF v_next_num IS NULL THEN
    RETURN;
  END IF;

  UPDATE tickets
  SET status = 'attended'
  WHERE tickets.queue_id = q_id
    AND tickets.status = 'called';

  UPDATE tickets
  SET status = 'called', called_at = now()
  WHERE tickets.queue_id = q_id
    AND tickets.number = v_next_num;

  UPDATE queues
  SET current_serving = v_next_num
  WHERE queues.id = q_id;

  RETURN QUERY
  SELECT t.token, t.number, false
  FROM tickets t
  WHERE t.queue_id = q_id
    AND t.status = 'waiting'
  ORDER BY t.number ASC
  LIMIT 3;
END;
$$;
