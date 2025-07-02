/* eslint-disable import/no-anonymous-default-export */
import { Alert, Box, Button, Card, Chip, IconButton, Stack, Tooltip, Typography, CircularProgress } from '@mui/material';
import jsonExport from 'jsonexport/dist';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CloseIcon from '@mui/icons-material/Close';
import type { Exporter } from 'react-admin';
import {
    BulkActionsToolbar,
    BulkDeleteButton,
    BulkExportButton,
    CreateButton,
    downloadCSV,
    ExportButton,
    ListBase,
    ListToolbar,
    Pagination,
    SortButton,
    Title,
    TopToolbar,
    useGetIdentity,
    useListContext,
} from 'react-admin';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Company, Contact, Sale, Tag } from '../types';
import { ContactEmpty } from './ContactEmpty';
import { ContactImportButton } from './ContactImportButton';
import ContactListFilter from './ContactListFilter';
import { getPredictiveScore, PredictiveScoreChip } from '../misc/predictiveScore';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import TableChartIcon from '@mui/icons-material/TableChart';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import { ContactListContent } from './ContactListContent';

const ONBOARDING_CONTACTS_BANNER_KEY = 'crm_onboarding_contacts_banner_dismissed';
const GUIDED_TOUR_CONTACTS_IMPORT_KEY = 'crm_guided_tour_contacts_import_dismissed';

function OnboardingBanner({ onClose }: { onClose: () => void }) {
    return (
        <Alert
            severity="info"
            sx={{ mb: 2, borderRadius: 2, boxShadow: '0 2px 8px 0 rgba(30,41,59,0.08)', alignItems: 'center' }}
            action={
                <IconButton aria-label="close" color="inherit" size="small" onClick={onClose}>
                    <CloseIcon fontSize="inherit" />
                </IconButton>
            }
        >
            You have no contacts yet. <b>Import your first contacts</b> to get started!
        </Alert>
    );
}

function GuidedTooltip({ anchorRef, open, onClose }: { anchorRef: React.RefObject<HTMLButtonElement | null>, open: boolean, onClose: () => void }) {
    if (!open || !anchorRef.current) return null;
    return (
        <Tooltip
            open
            title={
                <Box sx={{ maxWidth: 260 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Start by importing your contacts!</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Click here to upload a CSV or add contacts manually.
                    </Typography>
                    <Button size="small" variant="contained" onClick={onClose} sx={{ mt: 1, fontWeight: 600 }}>Got it</Button>
                </Box>
            }
            placement="bottom"
            arrow
            PopperProps={{
                anchorEl: anchorRef.current,
                disablePortal: false,
                modifiers: [
                    { name: 'offset', options: { offset: [0, 12] } },
                ],
            }}
        >
            <span />
        </Tooltip>
    );
}

export const ContactList = () => {
    const { identity } = useGetIdentity();
    if (!identity) return null;
    return (
        <ListBase
            perPage={25}
            sort={{ field: 'created_at', order: 'DESC' }}
            exporter={exporter}
            filters={<ContactListFilter />}
        >
            <ContactListLayout />
        </ListBase>
    );
};

const ContactListLayout = () => {
    const { data, isPending, filterValues } = useListContext();
    const { identity } = useGetIdentity();
    const [showBanner, setShowBanner] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const importBtnRef = useRef<HTMLButtonElement>(null);
    const hasFilters = filterValues && Object.keys(filterValues).length > 0;
    const [view, setView] = useState<'table' | 'kanban'>('table');
    const { isLoading, error } = useListContext();

    useEffect(() => {
        if (data && data.length === 0 && !localStorage.getItem(ONBOARDING_CONTACTS_BANNER_KEY)) {
            setShowBanner(true);
        }
    }, [data]);
    useEffect(() => {
        if (
            data && data.length === 0 &&
            !localStorage.getItem(GUIDED_TOUR_CONTACTS_IMPORT_KEY)
        ) {
            setShowTooltip(true);
        }
    }, [data]);
    const handleBannerClose = () => {
        localStorage.setItem(ONBOARDING_CONTACTS_BANNER_KEY, '1');
        setShowBanner(false);
    };
    const handleTooltipClose = () => {
        localStorage.setItem(GUIDED_TOUR_CONTACTS_IMPORT_KEY, '1');
        setShowTooltip(false);
    };
    if (isLoading) {
        return <Stack alignItems="center" mt={4}><CircularProgress /></Stack>;
    }
    if (error) {
        return <Alert severity="error">Failed to load contacts. Please try again later.</Alert>;
    }
    if (!data?.length && !hasFilters)
        return (
            <>
                {showBanner && <OnboardingBanner onClose={handleBannerClose} />}
                <GuidedTooltip anchorRef={importBtnRef} open={showTooltip} onClose={handleTooltipClose} />
                <ContactEmpty />
            </>
        );
    return (
        <Stack direction="row" gap={0.5}>
            <ContactListFilter />
            <Stack sx={{ width: '100%' }} gap={0.5}>
                {showBanner && <OnboardingBanner onClose={handleBannerClose} />}
                <Stack direction="row" alignItems="center" gap={0.5} mb={0.5}>
                    <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 0.2, fontSize: '1.3rem', color: 'text.primary' }}>Contacts</Typography>
                    <Chip icon={<SmartToyIcon fontSize="small" />} label="AI" color="primary" size="small" sx={{ fontWeight: 700, letterSpacing: 1 }} />
                </Stack>
                <Stack direction="row" alignItems="center" gap={1} mb={1}>
                    <ToggleButtonGroup
                        value={view}
                        exclusive
                        onChange={(_, next) => next && setView(next)}
                        size="small"
                        sx={{ ml: 0 }}
                    >
                        <ToggleButton value="table" aria-label="Table View">
                            <Tooltip title="Table View"><TableChartIcon /></Tooltip>
                        </ToggleButton>
                        <ToggleButton value="kanban" aria-label="Kanban View">
                            <Tooltip title="Kanban View"><ViewKanbanIcon /></Tooltip>
                        </ToggleButton>
                    </ToggleButtonGroup>
                    {view === 'table' && <ListToolbar actions={<ContactListActions importBtnRef={importBtnRef} />} />}
                </Stack>
                {view === 'table' && (
                    <BulkActionsToolbar>
                        <BulkExportButton />
                        <BulkDeleteButton />
                    </BulkActionsToolbar>
                )}
                {view === 'table' && (
                    <Card sx={{ p: 0.5, boxShadow: 2, borderRadius: 2, '&:hover': { boxShadow: 4, transform: 'translateY(-0.5px) scale(1.002)' }, transition: 'box-shadow 0.15s, transform 0.15s', animation: 'fadeInCard 0.2s cubic-bezier(0.4,0,0.2,1)' }}>
                        <ContactListContent />
                    </Card>
                )}
                {view === 'table' && <Pagination rowsPerPageOptions={[10, 25, 50, 100]} />}
            </Stack>
        </Stack>
    );
};

const ContactListActions = ({ importBtnRef }: { importBtnRef: React.RefObject<HTMLButtonElement | null> }) => (
    <TopToolbar>
        <SortButton fields={['last_name', 'first_name', 'last_seen']} />
        <ContactImportButton importBtnRef={importBtnRef} />
        <ExportButton />
        <CreateButton
            variant="contained"
            label="New Contact"
            sx={{ marginLeft: 2 }}
        />
    </TopToolbar>
);

const exporter: Exporter<Contact> = async (records, fetchRelatedRecords) => {
    const companies = await fetchRelatedRecords<Company>(
        records,
        'company_id',
        'companies'
    );
    const sales = await fetchRelatedRecords<Sale>(records, 'sales_id', 'sales');
    const tags = await fetchRelatedRecords<Tag>(records, 'tags', 'tags');

    const contacts = records.map(contact => {
        const exportedContact = {
            ...contact,
            company:
                contact.company_id != null
                    ? companies[contact.company_id].name
                    : undefined,
            sales: `${sales[contact.sales_id].first_name} ${sales[contact.sales_id].last_name
                }`,
            tags: contact.tags.map(tagId => tags[tagId].name).join(', '),
            email_work: contact.email_jsonb?.find(
                email => email.type === 'Work'
            )?.email,
            email_home: contact.email_jsonb?.find(
                email => email.type === 'Home'
            )?.email,
            email_other: contact.email_jsonb?.find(
                email => email.type === 'Other'
            )?.email,
            email_jsonb: JSON.stringify(contact.email_jsonb),
            email_fts: undefined,
            phone_work: contact.phone_jsonb?.find(
                phone => phone.type === 'Work'
            )?.number,
            phone_home: contact.phone_jsonb?.find(
                phone => phone.type === 'Home'
            )?.number,
            phone_other: contact.phone_jsonb?.find(
                phone => phone.type === 'Other'
            )?.number,
            phone_jsonb: JSON.stringify(contact.phone_jsonb),
            phone_fts: undefined,
        };
        delete exportedContact.email_fts;
        delete exportedContact.phone_fts;
        return exportedContact;
    });
    return jsonExport(contacts, {}, (_err: any, csv: string) => {
        downloadCSV(csv, 'contacts');
    });
};