-- Drop all RLS policies for all main tables

-- companies
DROP POLICY IF EXISTS "Allow select for authenticated" ON companies;

-- contacts
DROP POLICY IF EXISTS "Allow select for authenticated" ON contacts;

-- contactNotes
DROP POLICY IF EXISTS "Authenticated users can view all contact notes" ON contactNotes;
DROP POLICY IF EXISTS "Authenticated users can manage all contact notes" ON contactNotes;
DROP POLICY IF EXISTS "Allow select for authenticated" ON contactNotes;

-- dealNotes
DROP POLICY IF EXISTS "Authenticated users can view all deal notes" ON dealNotes;
DROP POLICY IF EXISTS "Authenticated users can manage all deal notes" ON dealNotes;
DROP POLICY IF EXISTS "Allow select for authenticated" ON dealNotes;

-- deals
DROP POLICY IF EXISTS "Allow select for authenticated" ON deals;

-- sales
DROP POLICY IF EXISTS "Admins can access all" ON sales;
DROP POLICY IF EXISTS "Users can access their row" ON sales;
DROP POLICY IF EXISTS "Allow select for authenticated" ON sales;

-- tags
DROP POLICY IF EXISTS "Allow select for authenticated" ON tags;

-- tasks
DROP POLICY IF EXISTS "Allow select for authenticated" ON tasks;

-- leads
DROP POLICY IF EXISTS "Allow select for authenticated" ON leads;

-- campaigns
DROP POLICY IF EXISTS "Allow select for authenticated" ON campaigns;

-- sequences
DROP POLICY IF EXISTS "Allow select for authenticated" ON sequences;

-- templates
DROP POLICY IF EXISTS "Allow select for authenticated" ON templates;

-- calendar_integrations
DROP POLICY IF EXISTS "Allow select for authenticated" ON calendar_integrations;

-- calendar_events
DROP POLICY IF EXISTS "Allow select for authenticated" ON calendar_events;

-- communication_logs
DROP POLICY IF EXISTS "Allow select for authenticated" ON communication_logs; 