import * as React from 'react';
import { CardContent } from '@mui/material';
import { Edit, Form, Toolbar } from 'react-admin';
import { CompanyInputs } from './CompanyInputs';
import { CompanyAside } from './CompanyAside';
import { Alert, Chip, Tooltip, Button as MuiButton } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';

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
