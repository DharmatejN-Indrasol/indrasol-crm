import * as React from 'react';
import {
    Divider,
    Stack,
    Typography,
    useMediaQuery,
    useTheme,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
    TextInput,
    SelectInput,
    ReferenceInput,
    AutocompleteInput,
    required,
    useCreate,
    useGetIdentity,
    useNotify,
    DateInput,
    NumberInput,
} from 'react-admin';

const statusChoices = [
    { id: 'New', name: 'New' },
    { id: 'Contacted', name: 'Contacted' },
    { id: 'Qualified', name: 'Qualified' },
    { id: 'Disqualified', name: 'Disqualified' },
    { id: 'Converted', name: 'Converted' },
];

export const LeadInputs = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [create] = useCreate();
    const { identity } = useGetIdentity();
    const notify = useNotify();
    const handleCreateCompany = async (name?: string) => {
        if (!name) return;
        try {
            const newCompany = await create(
                'companies',
                {
                    data: {
                        name,
                        sales_id: identity?.id,
                        created_at: new Date().toISOString(),
                    },
                },
                { returnPromise: true }
            );
            return newCompany;
        } catch (error) {
            notify('An error occurred while creating the company', {
                type: 'error',
            });
        }
    };
    return (
        <Stack gap={2} p={1}>
            <Stack gap={3} direction={isMobile ? 'column' : 'row'}>
                <Stack gap={4} flex={4}>
                    <Typography variant="h6">Personal Info</Typography>
                    <TextInput source="first_name" label="First Name" validate={required()} helperText={false} />
                    <TextInput source="middle_name" label="Middle Name" helperText={false} />
                    <TextInput source="last_name" label="Last Name" validate={required()} helperText={false} />
                    <TextInput source="salutation" label="Salutation" helperText={false} />
                    <TextInput source="suffix" label="Suffix" helperText={false} />
                </Stack>
                <Divider orientation={isMobile ? 'horizontal' : 'vertical'} flexItem />
                <Stack gap={4} flex={5}>
                    <Typography variant="h6">Contact Info</Typography>
                    <TextInput source="direct_phone_number" label="Direct Phone" helperText={false} />
                    <TextInput source="mobile_phone" label="Mobile Phone" helperText={false} />
                    <TextInput source="email_address" label="Email Address" helperText={false} />
                    <TextInput source="email_domain" label="Email Domain" helperText={false} />
                    <TextInput source="linkedin_contact_profile_url" label="LinkedIn Profile (Contact)" helperText={false} />
                </Stack>
            </Stack>
            <Divider />
            <Typography variant="h6">Company Info</Typography>
            <ReferenceInput source="company_id" reference="companies">
                <AutocompleteInput label="Company" helperText={false} onCreate={handleCreateCompany} />
            </ReferenceInput>
            <TextInput source="company_name" label="Company Name" helperText={false} />
            <TextInput source="website" label="Website" helperText={false} />
            <TextInput source="company_hq_phone" label="Company HQ Phone" helperText={false} />
            <TextInput source="fax" label="Fax" helperText={false} />
            <TextInput source="ticker" label="Ticker" helperText={false} />
            <TextInput source="revenue" label="Revenue" helperText={false} />
            <TextInput source="revenue_range" label="Revenue Range" helperText={false} />
            <NumberInput source="employees" label="Employees" helperText={false} />
            <TextInput source="employee_range" label="Employee Range" helperText={false} />
            <TextInput source="sic_codes" label="SIC Codes" helperText={false} />
            <TextInput source="naics_codes" label="NAICS Codes" helperText={false} />
            <TextInput source="primary_industry" label="Primary Industry" helperText={false} />
            <TextInput source="primary_sub_industry" label="Primary Sub Industry" helperText={false} />
            <TextInput source="all_industries" label="All Industries" helperText={false} />
            <TextInput source="all_sub_industries" label="All Sub Industries" helperText={false} />
            <TextInput source="industry_hierarchical_category" label="Industry Hierarchical Category" helperText={false} />
            <TextInput source="secondary_industry_hierarchical_category" label="Secondary Industry Hierarchical Category" helperText={false} />
            <NumberInput source="alexa_rank" label="Alexa Rank" helperText={false} />
            <TextInput source="linkedin_company_profile_url" label="LinkedIn Profile (Company)" helperText={false} />
            <TextInput source="facebook_company_profile_url" label="Facebook Profile (Company)" helperText={false} />
            <TextInput source="twitter_company_profile_url" label="Twitter Profile (Company)" helperText={false} />
        
            <Divider />
            <Typography variant="h6">Status & Owner</Typography>
            <SelectInput source="status" label="Status" choices={statusChoices} helperText={false} />
            <TextInput source="owner_id" label="Owner" helperText={false} />
            <TextInput source="source" label="Source" helperText={false} />
            <TextInput source="notes" label="Notes" multiline helperText={false} />
            <Divider />
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">Advanced Fields</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <TextInput source="zoominfo_contact_id" label="ZoomInfo Contact ID" helperText={false} />
                    <TextInput source="job_title" label="Job Title" helperText={false} />
                    <TextInput source="management_level" label="Management Level" helperText={false} />
                    <DateInput source="job_start_date" label="Job Start Date" helperText={false} />
                    <TextInput source="job_function" label="Job Function" helperText={false} />
                    <TextInput source="department" label="Department" helperText={false} />
                    <TextInput source="company_division_name" label="Company Division Name" helperText={false} />
                    <TextInput source="highest_level_of_education" label="Highest Level of Education" helperText={false} />
                    <TextInput source="contact_accuracy_score" label="Contact Accuracy Score" helperText={false} />
                    <TextInput source="contact_accuracy_grade" label="Contact Accuracy Grade" helperText={false} />
                    <TextInput source="zoominfo_contact_profile_url" label="ZoomInfo Contact Profile URL" helperText={false} />
                    <TextInput source="notice_provided_date" label="Notice Provided Date" helperText={false} />
                    <TextInput source="person_street" label="Person Street" helperText={false} />
                    <TextInput source="person_city" label="Person City" helperText={false} />
                    <TextInput source="person_state" label="Person State" helperText={false} />
                    <TextInput source="person_zip_code" label="Person Zip Code" helperText={false} />
                    <TextInput source="country" label="Country" helperText={false} />
                    <TextInput source="zoominfo_company_id" label="ZoomInfo Company ID" helperText={false} />
                    <TextInput source="founded_year" label="Founded Year" helperText={false} />
                    <TextInput source="ownership_type" label="Ownership Type" helperText={false} />
                    <TextInput source="business_model" label="Business Model" helperText={false} />
                    <TextInput source="certified_active_company" label="Certified Active Company" helperText={false} />
                    <TextInput source="certification_date" label="Certification Date" helperText={false} />
                    <NumberInput source="total_funding_amount" label="Total Funding Amount" helperText={false} />
                </AccordionDetails>
            </Accordion>
        </Stack>
    );
}; 