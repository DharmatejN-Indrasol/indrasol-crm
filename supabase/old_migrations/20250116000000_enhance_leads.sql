-- Create campaigns table for email campaigns
CREATE TABLE IF NOT EXISTS campaigns (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    status text DEFAULT 'draft',
    type text DEFAULT 'email',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    metadata jsonb DEFAULT '{}'
);

-- Create sequences table for follow-up sequences
CREATE TABLE IF NOT EXISTS sequences (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    steps jsonb[] DEFAULT '{}',
    status text DEFAULT 'active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    metadata jsonb DEFAULT '{}'
);

-- Create templates table for email/message templates
CREATE TABLE IF NOT EXISTS templates (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    type text DEFAULT 'email',
    subject text,
    content text NOT NULL,
    variables jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    metadata jsonb DEFAULT '{}'
);

-- Create calendar_events table for meeting scheduling
CREATE TABLE IF NOT EXISTS calendar_events (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    title text NOT NULL,
    description text,
    start_time timestamptz NOT NULL,
    end_time timestamptz NOT NULL,
    timezone text,
    location text,
    meeting_link text,
    attendees jsonb DEFAULT '[]',
    lead_id uuid REFERENCES leads(id),
    status text DEFAULT 'scheduled',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    metadata jsonb DEFAULT '{}'
);

-- Create communication_logs table for tracking all communications
CREATE TABLE IF NOT EXISTS communication_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id uuid REFERENCES leads(id),
    type text NOT NULL,
    direction text NOT NULL,
    status text NOT NULL,
    content text,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    template_id uuid REFERENCES templates(id),
    campaign_id uuid REFERENCES campaigns(id),
    sequence_id uuid REFERENCES sequences(id)
);

-- Enhance leads table with additional fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_score integer DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_activity_at timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_follow_up_at timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES campaigns(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sequence_id uuid REFERENCES sequences(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sequence_step integer DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_tracking jsonb DEFAULT '{}';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS communication_preferences jsonb DEFAULT '{}';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_sequence_id ON leads(sequence_id);
CREATE INDEX IF NOT EXISTS idx_leads_next_follow_up ON leads(next_follow_up_at);
CREATE INDEX IF NOT EXISTS idx_leads_last_activity ON leads(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_communication_logs_lead_id ON communication_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_lead_id ON calendar_events(lead_id);

-- Add RLS policies
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Users can view their own campaigns"
    ON campaigns FOR SELECT
    USING (auth.uid() = created_by);

CREATE POLICY "Users can manage their own campaigns"
    ON campaigns FOR ALL
    USING (auth.uid() = created_by);

CREATE POLICY "Users can view their own sequences"
    ON sequences FOR SELECT
    USING (auth.uid() = created_by);

CREATE POLICY "Users can manage their own sequences"
    ON sequences FOR ALL
    USING (auth.uid() = created_by);

CREATE POLICY "Users can view their own templates"
    ON templates FOR SELECT
    USING (auth.uid() = created_by);

CREATE POLICY "Users can manage their own templates"
    ON templates FOR ALL
    USING (auth.uid() = created_by);

CREATE POLICY "Users can view their own calendar events"
    ON calendar_events FOR SELECT
    USING (auth.uid() = created_by);

CREATE POLICY "Users can manage their own calendar events"
    ON calendar_events FOR ALL
    USING (auth.uid() = created_by);

CREATE POLICY "Users can view their own communication logs"
    ON communication_logs FOR SELECT
    USING (auth.uid() IN (
        SELECT created_by FROM leads WHERE id = lead_id
    ));

CREATE POLICY "Users can create communication logs"
    ON communication_logs FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT created_by FROM leads WHERE id = lead_id
    )); 