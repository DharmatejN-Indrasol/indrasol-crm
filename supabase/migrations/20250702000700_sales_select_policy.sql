-- Uncomment the following line to allow all authenticated users to select all sales
CREATE POLICY "Allow select for authenticated" ON sales FOR SELECT USING (auth.role() = 'authenticated'); 