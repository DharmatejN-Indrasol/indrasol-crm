-- Add created_at to tasks
aLTER TABLE tasks ADD COLUMN created_at timestamp with time zone DEFAULT now();

-- Add created_at to tags
ALTER TABLE tags ADD COLUMN created_at timestamp with time zone DEFAULT now();

-- Add created_at to dealNotes
ALTER TABLE dealNotes ADD COLUMN created_at timestamp with time zone;
UPDATE dealNotes SET created_at = COALESCE(date, now());
ALTER TABLE dealNotes ALTER COLUMN created_at SET DEFAULT now();

-- Add created_at to contactNotes
ALTER TABLE contactNotes ADD COLUMN created_at timestamp with time zone;
UPDATE contactNotes SET created_at = COALESCE(date, now());
ALTER TABLE contactNotes ALTER COLUMN created_at SET DEFAULT now();

-- Add created_at to sales
ALTER TABLE sales ADD COLUMN created_at timestamp with time zone DEFAULT now(); 