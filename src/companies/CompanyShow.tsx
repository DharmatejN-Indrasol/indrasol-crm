import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { formatDistance } from 'date-fns';
import React, { Suspense, useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
  Button
} from '@mui/material';
import { ActivityLog } from '../activity/ActivityLog';
import { Avatar } from '../contacts/Avatar';
import { TagsList } from '../contacts/TagsList';
import { findDealLabel } from '../deals/deal';
import { Status } from '../misc/Status';
import { useConfigurationContext } from '../root/ConfigurationContext';
import { Company, Contact, Deal } from '../types';
import { CompanyAside } from './CompanyAside';
import {    
    RecordContextProvider,
    ReferenceManyField,
    ShowBase,
    SortButton,
    TabbedShowLayout,
    useListContext,
    useRecordContext,
    useShowContext,
} from 'react-admin';

import { Avatar as ContactAvatar } from '../contacts/Avatar';
import { getPredictiveScore, PredictiveScoreChip } from '../misc/predictiveScore';
import { getSmartReminders } from '../misc/smartReminders';

const LazyColdEmailModal = React.lazy(() => import('../misc/ColdEmailModal').then(m => ({ default: m.ColdEmailModal })));
const LazySmartRemindersList = React.lazy(() => import('../misc/smartReminders').then(m => ({ default: m.SmartRemindersList })));

export const CompanyShow = () => (
    <ShowBase>
        <CompanyShowContent />
    </ShowBase>
);

const CompanyShowContent = () => {
    const { record, isPending } = useShowContext<Company>();
    const [emailModalOpen, setEmailModalOpen] = useState(false);

    if (isPending || !record) return null;

    // Mock AI insights and suggestions
    const aiInsight = 'AI: This company is likely to close a deal this quarter!';
    const aiSuggestion = 'AI suggests updating company profile for better engagement.';
    const aiSummary = 'AI: 2 deals in progress. Next best action: Schedule a demo.';

    return (
        <Box mt={2} display="flex" gap={4}>
            <Box flex="1">
                <Card sx={{ boxShadow: 2, borderRadius: 3, p: 2, '&:hover': { boxShadow: 4 }, transition: 'box-shadow 0.2s' }}>
                    <CardContent sx={{ p: 0 }}>
                        <Stack gap={2}>
                            <Box display="flex" alignItems="center" gap={2} mb={1}>
                                <Avatar />
                                <Stack direction="row" alignItems="center" gap={1} flex={1}>
                                    <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 0.2, color: 'text.primary' }}>
                                        {record.name}
                                    </Typography>
                                </Stack>
                                <Button variant="outlined" sx={{ ml: 2 }} onClick={() => setEmailModalOpen(true)}>
                                    Generate Cold Email
                                </Button>
                            </Box>
                            <TabbedShowLayout
                                sx={{ '& .RaTabbedShowLayout-content': { p: 0 } }}
                            >
                                <TabbedShowLayout.Tab label="Activity">
                                    <ActivityLog
                                        companyId={record.id}
                                        context="company"
                                    />
                                </TabbedShowLayout.Tab>
                                <TabbedShowLayout.Tab
                                    label={
                                        !record.nb_contacts
                                            ? 'No Contacts'
                                            : record.nb_contacts === 1
                                              ? '1 Contact'
                                              : `${record.nb_contacts} Contacts`
                                    }
                                    path="contacts"
                                >
                                    <ReferenceManyField
                                        reference="contacts_summary"
                                        target="company_id"
                                        sort={{ field: 'last_name', order: 'ASC' }}
                                    >
                                        <Stack
                                            direction="row"
                                            justifyContent="flex-end"
                                            spacing={2}
                                            mt={1}
                                        >
                                            {!!record.nb_contacts && (
                                                <SortButton
                                                    fields={[
                                                        'last_name',
                                                        'first_name',
                                                        'last_seen',
                                                    ]}
                                                />
                                            )}
                                            <CreateRelatedContactButton />
                                        </Stack>
                                        <ContactsIterator />
                                    </ReferenceManyField>
                                </TabbedShowLayout.Tab>
                                {record.nb_deals ? (
                                    <TabbedShowLayout.Tab
                                        label={
                                            record.nb_deals === 1
                                                ? '1 deal'
                                                : `${record.nb_deals} deals`
                                        }
                                        path="deals"
                                    >
                                        <ReferenceManyField
                                            reference="deals"
                                            target="company_id"
                                            sort={{ field: 'name', order: 'ASC' }}
                                        >
                                            <DealsIterator />
                                        </ReferenceManyField>
                                    </TabbedShowLayout.Tab>
                                ) : null}
                            </TabbedShowLayout>
                        </Stack>
                    </CardContent>
                </Card>
                <Stack direction="row" alignItems="center" gap={1} mt={2} mb={1}>
                    <span style={{ fontWeight: 600, color: '#2563eb', fontSize: '1.1rem' }}>Smart Reminders</span>
                </Stack>
                <Suspense fallback={null}>
                    <LazySmartRemindersList reminders={getSmartReminders(record)} />
                </Suspense>
                <Suspense fallback={null}>
                    <LazyColdEmailModal open={emailModalOpen} onClose={() => setEmailModalOpen(false)} recipient={record} />
                </Suspense>
            </Box>
            <CompanyAside />
        </Box>
    );
};

const ContactsIterator = () => {
    const location = useLocation();
    const { data: contacts, error, isPending } = useListContext<Contact>();

    if (isPending || error) return null;

    const now = Date.now();
    return (
        <List dense sx={{ pt: 0 }}>
            {contacts.map(contact => (
                <RecordContextProvider key={contact.id} value={contact}>
                    <ListItem disablePadding>
                        <ListItemButton
                            component={RouterLink}
                            to={`/contacts/${contact.id}/show`}
                            state={{ from: location.pathname }}
                        >
                            <ListItemAvatar>
                                <Avatar />
                            </ListItemAvatar>
                            <ListItemText
                                primary={`${contact.first_name} ${contact.last_name}`}
                                secondary={
                                    <>
                                        {contact.title}
                                        {contact.nb_tasks
                                            ? ` - ${contact.nb_tasks} task${
                                                  contact.nb_tasks > 1
                                                      ? 's'
                                                      : ''
                                              }`
                                            : ''}
                                        &nbsp; &nbsp;
                                        <TagsList />
                                    </>
                                }
                            />
                            {contact.last_seen && (
                                <ListItemSecondaryAction>
                                    <Typography
                                        variant="body2"
                                        color="textSecondary"
                                        component="span"
                                    >
                                        last activity{' '}
                                        {formatDistance(contact.last_seen, now)}{' '}
                                        ago <Status status={contact.status} />
                                    </Typography>
                                </ListItemSecondaryAction>
                            )}
                        </ListItemButton>
                    </ListItem>
                </RecordContextProvider>
            ))}
        </List>
    );
};

const CreateRelatedContactButton = () => {
    const company = useRecordContext<Company>();
    return (
        <Button
            component={RouterLink}
            to="/contacts/create"
            state={company ? { record: { company_id: company.id } } : undefined}
            color="primary"
            size="small"
            startIcon={<PersonAddIcon />}
        >
            Add contact
        </Button>
    );
};

const DealsIterator = () => {
    const { data: deals, error, isPending } = useListContext<Deal>();
    const { dealStages } = useConfigurationContext();
    if (isPending || error) return null;

    const now = Date.now();
    return (
        <Box>
            <List dense>
                {deals.map(deal => (
                    <ListItem disablePadding key={deal.id}>
                        <ListItemButton
                            component={RouterLink}
                            to={`/deals/${deal.id}/show`}
                        >
                            <ListItemText
                                primary={deal.name}
                                secondary={
                                    <>
                                        {findDealLabel(dealStages, deal.stage)},{' '}
                                        {deal.amount.toLocaleString('en-US', {
                                            notation: 'compact',
                                            style: 'currency',
                                            currency: 'USD',
                                            currencyDisplay: 'narrowSymbol',
                                            minimumSignificantDigits: 3,
                                        })}
                                        {deal.category
                                            ? `, ${deal.category}`
                                            : ''}
                                    </>
                                }
                            />
                            <ListItemSecondaryAction>
                                <Typography
                                    variant="body2"
                                    color="textSecondary"
                                    component="span"
                                >
                                    last activity{' '}
                                    {formatDistance(deal.updated_at, now)}{' '}
                                    ago{' '}
                                </Typography>
                            </ListItemSecondaryAction>
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};
