import * as React from 'react';
import { ShowBase, useShowContext, Button, TopToolbar, EditButton, ListButton, ShowProps } from 'react-admin';
import { Box, Card, CardContent, Stack, Typography, Grid } from '@mui/material';
import { LeadAside } from './LeadAside';
import { Contact, Lead } from '../types';
import Breadcrumbs from '../misc/Breadcrumbs';
import PeopleIcon from '@mui/icons-material/People';
import EventIcon from '@mui/icons-material/Event';
import MeetingScheduler from './MeetingScheduler';
import { useState } from 'react';
import { useRecordContext } from 'react-admin';
import CommunicationLogIterator from './CommunicationLogIterator';

const LeadShow = (props: ShowProps) => (
    <ShowBase {...props}>
        <LeadShowContent />
    </ShowBase>
);

const LeadShowContent = () => {
    const { record, isPending } = useShowContext<Lead>();
    const [open, setOpen] = useState(false);
    
    if (isPending || !record) return null;

    return (
        <Box mt={2} mb={2} display="flex" gap={4}>
            <Box flex="1">
                <Breadcrumbs
                  items={[
                    { label: 'Leads', href: '/leads', icon: <PeopleIcon fontSize="small" /> },
                    { label: record.name ? record.name : 'Lead' }
                  ]}
                />
                <Card sx={{ boxShadow: 2, borderRadius: 3, p: 2, '&:hover': { boxShadow: 4 }, transition: 'box-shadow 0.2s' }}>
                    <CardContent sx={{ p: 0 }}>
                        <Stack gap={2}>
                            <Box display="flex" alignItems="center" gap={2}>
                                <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 0.2, color: 'text.primary' }}>
                                    {record.name}
                                </Typography>
                                <TopToolbar>
                                    <Button
                                        label="Schedule Meeting"
                                        onClick={() => setOpen(true)}
                                        startIcon={<EventIcon />}
                                    />
                                    <EditButton />
                                    <ListButton />
                                </TopToolbar>
                            </Box>
                            {/* Add more lead fields or sections as needed */}
                        </Stack>
                    </CardContent>
                </Card>

                <EmailTrackingStats />

                <CommunicationLogIterator />

            </Box>
            <Box>
                <LeadAside link="show" />
            </Box>
            <MeetingScheduler open={open} onClose={() => setOpen(false)} />
        </Box>
    );
};

const EmailTrackingStats = () => {
    const lead = useRecordContext<Lead>();
    if (!lead || !lead.email_tracking) return null;

    const { opens, clicks, last_opened } = lead.email_tracking;

    return (
        <Card sx={{ my: 2 }}>
            <CardContent>
                <Typography variant="h6">Email Engagement</Typography>
                <Grid container spacing={2} mt={1}>
                    <Grid item xs={4}>
                        <Typography variant="h4">{opens || 0}</Typography>
                        <Typography variant="body2" color="textSecondary">Opens</Typography>
                    </Grid>
                    <Grid item xs={4}>
                        <Typography variant="h4">{clicks || 0}</Typography>
                        <Typography variant="body2" color="textSecondary">Clicks</Typography>
                    </Grid>
                    <Grid item xs={4}>
                        <Typography variant="body1">
                            {last_opened ? new Date(last_opened).toLocaleString() : 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">Last Opened</Typography>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

export default LeadShow; 