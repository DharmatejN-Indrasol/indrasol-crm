CREATE TABLE "public"."leads" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "first_name" text NOT NULL,
    "last_name" text NOT NULL,
    "company_name" text,
    "company_id" bigint,
    "owner_id" uuid,
    "status" text,
    "source" text,
    "notes" text,
    "created_by" uuid,

    -- ZoomInfo Contact Fields
    "zoominfo_contact_id" text,
    "middle_name" text,
    "salutation" text,
    "suffix" text,
    "job_title" text,
    "management_level" text,
    "job_start_date" date,
    "job_function" text,
    "department" text,
    "company_division_name" text,
    "direct_phone_number" text,
    "email_address" text,
    "email_domain" text,
    "mobile_phone" text,
    "highest_level_of_education" text,
    "contact_accuracy_score" text,
    "contact_accuracy_grade" text,
    "zoominfo_contact_profile_url" text,
    "linkedin_contact_profile_url" text,
    "notice_provided_date" text,
    "person_street" text,
    "person_city" text,
    "person_state" text,
    "person_zip_code" text,
    "country" text,

    -- ZoomInfo Company Fields
    "zoominfo_company_id" text,
    "website" text,
    "founded_year" integer,
    "company_hq_phone" text,
    "fax" text,
    "ticker" text,
    "revenue" text,
    "revenue_range" text,
    "employees" integer,
    "employee_range" text,
    "sic_codes" text,
    "naics_codes" text,
    "primary_industry" text,
    "primary_sub_industry" text,
    "all_industries" text,
    "all_sub_industries" text,
    "industry_hierarchical_category" text,
    "secondary_industry_hierarchical_category" text,
    "alexa_rank" integer,
    "zoominfo_company_profile_url" text,
    "linkedin_company_profile_url" text,
    "facebook_company_profile_url" text,
    "twitter_company_profile_url" text,
    "ownership_type" text,
    "business_model" text,
    "certified_active_company" text,
    "certification_date" text,
    "total_funding_amount" bigint,

    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    CONSTRAINT "leads_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
    CONSTRAINT "leads_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT "leads_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own leads"
    ON leads FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can manage their own leads"
    ON leads FOR ALL
    USING (auth.uid() = owner_id); 