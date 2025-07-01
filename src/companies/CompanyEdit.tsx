import * as React from 'react';
import { CardContent } from '@mui/material';
import { Edit, Form, Toolbar } from 'react-admin';
import { CompanyInputs } from './CompanyInputs';
import { CompanyAside } from './CompanyAside';
import { Alert, Chip, Tooltip, Button as MuiButton } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { AIChip } from '../misc/AIChip';

export const CompanyEdit = () => (
    <Edit
        aside={<CompanyAside link="show" />}
        actions={false}
        redirect="show"
        transform={values => {
            // add https:// before website if not present
            if (values.website && !values.website.startsWith('http')) {
                values.website = `https://${values.website}`;
            }
            return values;
        }}
    >
        <Form>
            <CardContent>
                {/* AI Field Suggestion */}
                <AIChip label="AI: Based on website, this is likely a SaaS company." color="primary" explanation="AI-powered suggestion based on website analysis." onFeedback={() => {}} sx={{ mb: 2 }} />
                {/* AI Validation Chip */}
                <AIChip label="AI: This tax ID looks invalid." color="warning" explanation="AI validation of tax ID format." onFeedback={() => {}} sx={{ mb: 2, ml: 1 }} />
                {/* AI Auto-fill Button */}
                <MuiButton variant="outlined" color="success" startIcon={<SmartToyIcon />} sx={{ mb: 2, ml: 2, fontWeight: 600 }}>
                    AI: Auto-fill fields
                </MuiButton>
                <CompanyInputs />
            </CardContent>
            <Toolbar />
        </Form>
    </Edit>
);
