-- Allow all permissions for authenticated users on all main tables (fixed)

-- companies
DROP POLICY IF EXISTS "Allow all for authenticated" ON companies;
CREATE POLICY "Allow all for authenticated" ON companies FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- contacts
DROP POLICY IF EXISTS "Allow all for authenticated" ON contacts;
CREATE POLICY "Allow all for authenticated" ON contacts FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- contactNotes
DROP POLICY IF EXISTS "Allow all for authenticated" ON contactNotes;
CREATE POLICY "Allow all for authenticated" ON contactNotes FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- dealNotes
DROP POLICY IF EXISTS "Allow all for authenticated" ON dealNotes;
CREATE POLICY "Allow all for authenticated" ON dealNotes FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- deals
DROP POLICY IF EXISTS "Allow all for authenticated" ON deals;
CREATE POLICY "Allow all for authenticated" ON deals FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- sales
DROP POLICY IF EXISTS "Allow all for authenticated" ON sales;
CREATE POLICY "Allow all for authenticated" ON sales FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- tags
DROP POLICY IF EXISTS "Allow all for authenticated" ON tags;
CREATE POLICY "Allow all for authenticated" ON tags FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- tasks
DROP POLICY IF EXISTS "Allow all for authenticated" ON tasks;
CREATE POLICY "Allow all for authenticated" ON tasks FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- leads
DROP POLICY IF EXISTS "Allow all for authenticated" ON leads;
CREATE POLICY "Allow all for authenticated" ON leads FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- campaigns
DROP POLICY IF EXISTS "Allow all for authenticated" ON campaigns;
CREATE POLICY "Allow all for authenticated" ON campaigns FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- sequences
DROP POLICY IF EXISTS "Allow all for authenticated" ON sequences;
CREATE POLICY "Allow all for authenticated" ON sequences FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- templates
DROP POLICY IF EXISTS "Allow all for authenticated" ON templates;
CREATE POLICY "Allow all for authenticated" ON templates FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- calendar_integrations
DROP POLICY IF EXISTS "Allow all for authenticated" ON calendar_integrations;
CREATE POLICY "Allow all for authenticated" ON calendar_integrations FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- calendar_events
DROP POLICY IF EXISTS "Allow all for authenticated" ON calendar_events;
CREATE POLICY "Allow all for authenticated" ON calendar_events FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- communication_logs
DROP POLICY IF EXISTS "Allow all for authenticated" ON communication_logs;
CREATE POLICY "Allow all for authenticated" ON communication_logs FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated'); 