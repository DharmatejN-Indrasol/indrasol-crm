import * as React from 'react';
import {
    EditBase,
    Form,
    SaveButton,
    Toolbar,
    useEditContext,
} from 'react-admin';
import { Box, Card, CardContent, Button as MuiButton, Stack, Typography } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { LeadInputs } from './LeadInputs';
import { LeadAside } from './LeadAside';
import { Contact } from '../types';
import Breadcrumbs from '../misc/Breadcrumbs';
import PeopleIcon from '@mui/icons-material/People';

export const LeadEdit = () => (
    <EditBase redirect="show">
        <LeadEditContent />
    </EditBase>
);

export default LeadEdit;

const LeadEditContent = () => {
    const { isPending, record } = useEditContext<Contact>();
    if (isPending || !record) return null;
    // Mock AI suggestions
    const aiFieldSuggestion = 'AI: Based on email, this is likely a decision maker.';
    const aiValidation = 'AI: This phone number looks invalid.';
    return (
        <Box mt={2} display="flex">
            <Box flex="1">
                <Breadcrumbs
                    items={[
                        { label: 'Leads', href: '/leads', icon: <PeopleIcon fontSize="small" /> },
                        { label: record.first_name ? `${record.first_name} ${record.last_name || ''}`.trim() : 'Lead', href: `/leads/${record.id}/show` },
                        { label: 'Edit' }
                    ]}
                />
                <Form>
                    <Card>
                        <CardContent>
                            {/* AI Field Suggestion */}
                            <Stack direction="row" gap={2} mb={2}>
                                <MuiButton variant="outlined" color="success" startIcon={<SmartToyIcon />} sx={{ fontWeight: 600 }}>
                                    AI: Auto-fill fields
                                </MuiButton>
                                <Typography variant="body2" color="primary.main">{aiFieldSuggestion}</Typography>
                                <Typography variant="body2" color="warning.main">{aiValidation}</Typography>
                            </Stack>
                            <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 0.2, color: 'text.primary' }}>
                                {record.first_name} {record.last_name}
                            </Typography>
                            <LeadInputs />
                        </CardContent>
                        <Toolbar>
                            <SaveButton />
                            <MuiButton
                                onClick={() => window.history.back()}
                                color="primary"
                                sx={{ ml: 2 }}
                            >
                                Cancel
                            </MuiButton>
                        </Toolbar>
                    </Card>
                </Form>
            </Box>
            <LeadAside link="show" />
        </Box>
    );
}; 