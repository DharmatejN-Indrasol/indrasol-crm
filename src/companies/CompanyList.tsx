import {
    TopToolbar,
    ExportButton,
    CreateButton,
    Pagination,
    useGetIdentity,
    ListBase,
    Title,
    ListToolbar,
    useListContext,
    SortButton,
} from 'react-admin';

import { Chip, Stack, Typography } from '@mui/material';
import { ImageList } from './GridList';
import { CompanyListFilter } from './CompanyListFilter';
import { CompanyEmpty } from './CompanyEmpty';
import { CompanyImportButton } from './CompanyImportButton';
import { getPredictiveScore, PredictiveScoreChip } from '../misc/predictiveScore';
import { useEffect, useState } from 'react';
import { Alert, IconButton, CircularProgress } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CloseIcon from '@mui/icons-material/Close';
import type { Exporter } from 'react-admin';
import { unparse as toCsv } from 'papaparse';

const ONBOARDING_COMPANIES_BANNER_KEY = 'crm_onboarding_companies_banner_dismissed';

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
            You have no companies yet. <b>Create or import your first company</b> to get started!
        </Alert>
    );
}

export const CompanyList = () => {
    const { identity } = useGetIdentity();
    if (!identity) return null;
    return (
        <ListBase perPage={25} sort={{ field: 'name', order: 'ASC' }}>
            <CompanyListLayout />
        </ListBase>
    );
};

const CompanyListLayout = () => {
    const [showBanner, setShowBanner] = useState(false);
    const { data, isPending, filterValues, isLoading, error } = useListContext();
    const hasFilters = filterValues && Object.keys(filterValues).length > 0;
    useEffect(() => {
        if (data && data.length === 0 && !localStorage.getItem(ONBOARDING_COMPANIES_BANNER_KEY)) {
            setShowBanner(true);
        }
    }, [data]);
    const handleBannerClose = () => {
        localStorage.setItem(ONBOARDING_COMPANIES_BANNER_KEY, '1');
        setShowBanner(false);
    };
    if (isLoading) {
        return <Stack alignItems="center" mt={4}><CircularProgress /></Stack>;
    }
    if (error) {
        return <Alert severity="error">Failed to load companies. Please try again later.</Alert>;
    }
    if (!data?.length && !hasFilters)
        return (
            <>
                {showBanner && <OnboardingBanner onClose={handleBannerClose} />}
                <CompanyEmpty />
            </>
        );
    return (
        <Stack direction="row" gap={3}>
            <CompanyListFilter />
            <Stack sx={{ width: '100%' }} gap={2}>
                {showBanner && <OnboardingBanner onClose={handleBannerClose} />}
                <Stack direction="row" alignItems="center" gap={1} mb={1}>
                    <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 0.2, fontSize: '1.3rem', color: 'text.primary' }}>Companies</Typography>
                </Stack>
                <ListToolbar actions={<CompanyListActions />} />
                <ImageList />
                <Pagination rowsPerPageOptions={[10, 25, 50, 100]} />
            </Stack>
        </Stack>
    );
};

const exporter: Exporter<any> = (records) => {
    const data = records.map(({ id, ...record }) => record);
    const csv = toCsv(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'companies_export.csv';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
};

const CompanyListActions = () => {
    return (
        <TopToolbar>
            <SortButton fields={['name', 'created_at', 'nb_contacts']} />
            <CompanyImportButton />
            <ExportButton exporter={exporter} />
            <CreateButton
                variant="contained"
                label="New Company"
                sx={{ marginLeft: 2 }}
            />
        </TopToolbar>
    );
};
