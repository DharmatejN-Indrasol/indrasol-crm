CREATE OR REPLACE FUNCTION update_lead_email_tracking(p_lead_id uuid, p_tracking_event text)
RETURNS void AS $$
DECLARE
    current_tracking jsonb;
    event_count int;
BEGIN
    -- Get the current email_tracking jsonb
    SELECT email_tracking INTO current_tracking FROM leads WHERE id = p_lead_id;

    -- Initialize if null
    IF current_tracking IS NULL THEN
        current_tracking := '{}'::jsonb;
    END IF;

    -- Handle 'open' event
    IF p_tracking_event = 'open' THEN
        event_count := (COALESCE((current_tracking->>'opens')::int, 0) + 1);
        current_tracking := jsonb_set(
            jsonb_set(current_tracking, '{opens}', to_jsonb(event_count)),
            '{last_opened}', to_jsonb(now())
        );
    -- Handle 'click' event (for future use)
    ELSIF p_tracking_event = 'click' THEN
        event_count := (COALESCE((current_tracking->>'clicks')::int, 0) + 1);
        current_tracking := jsonb_set(
            jsonb_set(current_tracking, '{clicks}', to_jsonb(event_count)),
            '{last_clicked}', to_jsonb(now())
        );
    END IF;
    
    -- Update the lead record
    UPDATE leads
    SET 
        email_tracking = current_tracking,
        last_activity_at = now()
    WHERE id = p_lead_id;

END;
$$ LANGUAGE plpgsql; 