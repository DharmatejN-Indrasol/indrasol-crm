-- Create calendar_integrations table to store user's calendar connection settings
CREATE TABLE IF NOT EXISTS calendar_integrations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    provider text NOT NULL, -- e.g., 'google', 'outlook'
    refresh_token text NOT NULL,
    access_token text NOT NULL,
    expires_at timestamptz NOT NULL,
    scopes text[],
    profile_info jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, provider)
);

-- RLS policies for calendar_integrations
ALTER TABLE calendar_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own calendar integrations"
    ON calendar_integrations FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own calendar integrations"
    ON calendar_integrations FOR SELECT
    USING (auth.uid() = user_id); 