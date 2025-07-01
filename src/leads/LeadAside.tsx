import * as React from 'react';
import { Box, Divider, Stack, Typography } from '@mui/material';
import {
    DateField,
    EditButton,
    ShowButton,
    TextField,
    useRecordContext,
} from 'react-admin';
import { useLocation } from 'react-router';

export const LeadAside = ({ link = 'edit' }: { link?: 'edit' | 'show' }) => {
    const location = useLocation();
    const record = useRecordContext<any>();
    if (!record) return null;
    return (
        <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, boxShadow: 1, p: 2, mt: 1 }}>
            <Box mb={2} ml="-5px">
                {link === 'edit' ? <EditButton label="Edit Lead" /> : <ShowButton label="Show Lead" />}
            </Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>Lead Info</Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack gap={1}>
                <Typography variant="body2"><b>Status:</b> <TextField source="status" /></Typography>
                <Typography variant="body2"><b>Owner:</b> <TextField source="owner_id" /></Typography>
                <Typography variant="body2"><b>Source:</b> <TextField source="source" /></Typography>
                <Typography variant="body2"><b>Notes:</b> <TextField source="notes" /></Typography>
            </Stack>
            <Box mt={2}>
                <Typography component="span" variant="body2" color="textSecondary">Created on </Typography>
                <DateField source="created_at" options={{ year: 'numeric', month: 'long', day: 'numeric' }} color="textSecondary" />
                <br />
                <Typography component="span" variant="body2" color="textSecondary">Updated on </Typography>
                <DateField source="updated_at" options={{ year: 'numeric', month: 'long', day: 'numeric' }} color="textSecondary" />
            </Box>
        </Box>
    );
}; 