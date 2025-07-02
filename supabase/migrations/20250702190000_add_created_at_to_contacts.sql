ALTER TABLE contacts ADD COLUMN created_at timestamp with time zone;

-- Set created_at to first_seen if available, else now()
UPDATE contacts SET created_at = COALESCE(first_seen, now());

-- Set default for future inserts
ALTER TABLE contacts ALTER COLUMN created_at SET DEFAULT now(); 