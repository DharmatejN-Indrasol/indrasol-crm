import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import React, { useEffect, useState } from 'react';
import { SalesImportButton } from './SalesImportButton';
import {
    CreateButton,
    DatagridConfigurable,
    ExportButton,
    List,
    ListBase,
    SearchInput,
    TextField,
    TopToolbar,
    useListContext,
    useRecordContext,
} from 'react-admin';

const SalesListActions = () => (
    <TopToolbar>
        <SalesImportButton />
        <ExportButton />
        <CreateButton variant="contained" label="New user" />
    </TopToolbar>
);

const filters = [<SearchInput source="q" alwaysOn />];

const OptionsField = React.memo((_props: { label?: string | boolean }) => {
    const record = useRecordContext();
    if (!record) return null;
    return (
        <Stack direction="row" gap={1}>
            {record.administrator && (
                <Chip
                    label="Admin"
                    size="small"
                    variant="outlined"
                    color="primary"
                />
            )}
            {record.disabled && (
                <Chip
                    label="Disabled"
                    size="small"
                    variant="outlined"
                    color="warning"
                />
            )}
        </Stack>
    );
});

const ONBOARDING_SALES_BANNER_KEY = 'crm_onboarding_sales_banner_dismissed';

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
            No users yet. <b>Invite your team</b> to collaborate!
        </Alert>
    );
}

export const SalesList = () => {
    return (
        <Stack gap={4}>
            <List
                filters={filters}
                actions={<SalesListActions />}
                sort={{ field: 'first_name', order: 'ASC' }}
            >
                <SalesListLayout />
            </List>
        </Stack>
    );
};

const SalesListLayout = () => {
    const [showBanner, setShowBanner] = useState(false);
    const { data } = useListContext();
    useEffect(() => {
        if (data && data.length === 0 && !localStorage.getItem(ONBOARDING_SALES_BANNER_KEY)) {
            setShowBanner(true);
        }
    }, [data]);
    const handleBannerClose = () => {
        localStorage.setItem(ONBOARDING_SALES_BANNER_KEY, '1');
        setShowBanner(false);
    };
    return (
        <>
            {showBanner && <OnboardingBanner onClose={handleBannerClose} />}
            <DatagridConfigurable rowClick="edit" bulkActionButtons={false}>
                <TextField source="first_name" />
                <TextField source="last_name" />
                <TextField source="email" />
                <OptionsField label={false} />
            </DatagridConfigurable>
        </>
    );
};
