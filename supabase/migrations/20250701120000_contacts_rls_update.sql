-- Migration to update RLS policies for contacts

-- Drop old user-based policies if they exist
DROP POLICY IF EXISTS "Users can view their contacts" ON contacts;
DROP POLICY IF EXISTS "Users can update their contacts" ON contacts;

-- Add new open policies for all authenticated users
CREATE POLICY "Authenticated users can view all contacts" ON contacts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage all contacts" ON contacts FOR ALL USING (auth.role() = 'authenticated'); 