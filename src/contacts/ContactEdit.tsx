import * as React from 'react';
import {
    EditBase,
    Form,
    SaveButton,
    Toolbar,
    useEditContext,
} from 'react-admin';
import { Box, Card, CardContent, Alert, Chip, Tooltip, Button as MuiButton } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';

import { ContactInputs } from './ContactInputs';
import { ContactAside } from './ContactAside';
import { Contact } from '../types';
import { AIChip } from '../misc/AIChip';

export const ContactEdit = () => (
    <EditBase redirect="show">
        <ContactEditContent />
    </EditBase>
);

const ContactEditContent = () => {
    const { isPending, record } = useEditContext<Contact>();
    if (isPending || !record) return null;
    // Mock AI suggestions
    const aiFieldSuggestion = 'AI: Based on email, this is likely a CEO.';
    const aiValidation = 'AI: This phone number looks invalid.';
    return (
        <Box mt={2} display="flex">
            <Box flex="1">
                <Form>
                    <Card>
                        <CardContent>
                            {/* AI Field Suggestion */}
                            <AIChip label={aiFieldSuggestion} color="primary" explanation="AI-powered suggestion based on email analysis." onFeedback={() => {}} sx={{ mb: 2 }} />
                            {/* AI Validation Chip */}
                            <AIChip label={aiValidation} color="warning" explanation="AI validation of phone number format." onFeedback={() => {}} sx={{ mb: 2, ml: 1 }} />
                            {/* AI Auto-fill Button */}
                            <MuiButton variant="outlined" color="success" startIcon={<SmartToyIcon />} sx={{ mb: 2, ml: 2, fontWeight: 600 }}>
                                AI: Auto-fill fields
                            </MuiButton>
                            <ContactInputs />
                        </CardContent>
                        <Toolbar>
                            <SaveButton />
                        </Toolbar>
                    </Card>
                </Form>
            </Box>
            <ContactAside link="show" />
        </Box>
    );
};
