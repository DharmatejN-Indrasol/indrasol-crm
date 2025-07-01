import * as React from 'react';
import { ShowBase, useShowContext, Button, TopToolbar, EditButton, ListButton } from 'react-admin';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { ContactAside } from './ContactAside';
import { Contact } from '../types';

export const ContactShow = () => (
    <ShowBase>
        <ContactShowContent />
    </ShowBase>
);

const ContactShowContent = () => {
    const { record, isPending } = useShowContext<Contact>();
    if (isPending || !record) return null;
    return (
        <Box mt={2} mb={2} display="flex" gap={4}>
            <Box flex="1">
                <Card sx={{ boxShadow: 2, borderRadius: 3, p: 2, '&:hover': { boxShadow: 4 }, transition: 'box-shadow 0.2s' }}>
                    <CardContent sx={{ p: 0 }}>
                        <Stack gap={2}>
                            <Box display="flex" alignItems="center" gap={2}>
                                <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 0.2, color: 'text.primary' }}>
                                    {record.first_name} {record.last_name}
                                </Typography>
                                <TopToolbar>
                                    <EditButton />
                                    <ListButton />
                                </TopToolbar>
                            </Box>
                            {/* Add more fields or sections as needed */}
                        </Stack>
                    </CardContent>
                </Card>
            </Box>
            <Box>
                <ContactAside link="show" />
            </Box>
        </Box>
    );
};
