import {
    CreateButton,
    ExportButton,
    FilterButton,
    ListBase,
    ListToolbar,
    ReferenceInput,
    SearchInput,
    SelectInput,
    Title,
    TopToolbar,
    useGetIdentity,
    useListContext,
} from 'react-admin';
import { matchPath, useLocation, useMatch } from 'react-router';
import { useEffect, useState, useRef } from 'react';
import { Alert, Box, Card, Chip, IconButton, Stack, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import { useConfigurationContext } from '../root/ConfigurationContext';
import { DealArchivedList } from './DealArchivedList';
import { DealCreate } from './DealCreate';
import { DealEdit } from './DealEdit';
import { DealEmpty } from './DealEmpty';
import { DealListContent } from './DealListContent';
import { DealShow } from './DealShow';
import { OnlyMineInput } from './OnlyMineInput';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { DealCard } from './DealCard';

const ONBOARDING_DEALS_BANNER_KEY = 'crm_onboarding_deals_banner_dismissed';

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
            You have no deals yet. <b>Create your first deal</b> to start tracking your pipeline!
        </Alert>
    );
}

const DealList = () => {
    const { identity } = useGetIdentity();
    // TODO: Restore filters when ready
    // const { dealCategories } = useConfigurationContext();
    if (!identity) return null;
    // const dealFilters = [ ... ];
    return (
        <ListBase
            perPage={25}
            filter={{
                'archived_at@is': null,
            }}
            sort={{ field: 'index', order: 'DESC' }}
            // filters={dealFilters}
        >
            <DealLayout />
        </ListBase>
    );
};

const DealLayout = () => {
    const location = useLocation();
    const matchCreate = useMatch('/deals/create');
    const matchShow = useMatch('/deals/:id/show');
    const matchEdit = useMatch('/deals/:id');
    // TODO: Restore filters when ready
    // const { dealCategories } = useConfigurationContext();
    // const dealFilters = [ ... ];
    const [showBanner, setShowBanner] = useState(false);
    const { data, isPending, filterValues } = useListContext();
    const hasFilters = filterValues && Object.keys(filterValues).length > 0;
    const listRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (data && data.length === 0 && !localStorage.getItem(ONBOARDING_DEALS_BANNER_KEY)) {
            setShowBanner(true);
        }
    }, [data]);
    useEffect(() => {
        if (listRef.current) {
            // Animate cards in on mount
            const cards = listRef.current.querySelectorAll('.deal-card-animated');
            cards.forEach((card, i) => {
                (card as HTMLElement).style.opacity = '0';
                (card as HTMLElement).style.transform = 'translateY(20px)';
                setTimeout(() => {
                    (card as HTMLElement).style.transition = 'opacity 0.4s cubic-bezier(0.4,0,0.2,1), transform 0.4s cubic-bezier(0.4,0,0.2,1)';
                    (card as HTMLElement).style.opacity = '1';
                    (card as HTMLElement).style.transform = 'none';
                }, 80 * i);
            });
        }
    }, [data]);
    const handleBannerClose = () => {
        localStorage.setItem(ONBOARDING_DEALS_BANNER_KEY, '1');
        setShowBanner(false);
    };
    if (isPending) return null;
    if (!data?.length && !hasFilters)
        return (
            <>
                {showBanner && <OnboardingBanner onClose={handleBannerClose} />}
                <DealEmpty>
                    <DealShow open={!!matchShow} id={matchShow?.params.id} />
                    <DealArchivedList />
                </DealEmpty>
            </>
        );
    return (
        <Stack component="div" sx={{ width: '100%', maxWidth: '100%', overflowX: 'auto', px: 0 }} gap={0.5}>
            {showBanner && <OnboardingBanner onClose={handleBannerClose} />}
            <Stack direction="row" alignItems="center" gap={0.5} mb={0.5}>
                <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 0.2, fontSize: '1.3rem', color: 'text.primary' }}>Deals</Typography>
                <Chip icon={<SmartToyIcon fontSize="small" />} label="AI" color="primary" size="small" sx={{ fontWeight: 700, letterSpacing: 1 }} />
            </Stack>
            <Title title={'Deals'} />
            <ListToolbar /* filters={dealFilters} */ actions={<DealActions />} />
            <Box ref={listRef} sx={{ width: '100%', maxWidth: '100%', px: 0, py: 2, minHeight: 200, overflowX: 'auto' }}>
                <Stack direction="row" flexWrap="wrap" gap={2} alignItems="flex-start" sx={{ width: '100%', minWidth: 0 }}>
                    {(data || []).map((deal, i) => (
                        <Box
                            key={deal.id}
                            className="deal-card-animated"
                            tabIndex={0}
                            aria-label={`Deal card for ${deal.name}`}
                            sx={{
                                minWidth: 260,
                                maxWidth: 320,
                                flex: '1 1 260px',
                                outline: 'none',
                                '&:focus': {
                                    boxShadow: '0 0 0 3px #2563eb55',
                                    zIndex: 2,
                                },
                            }}
                        >
                            <DealCard deal={deal} index={i} draggable={false} />
                        </Box>
                    ))}
                </Stack>
            </Box>
            <DealArchivedList />
            <DealCreate open={!!matchCreate} />
            <DealEdit
                open={!!matchEdit && !matchCreate}
                id={matchEdit?.params.id}
            />
            <DealShow open={!!matchShow} id={matchShow?.params.id} />
        </Stack>
    );
};

const DealActions = () => {
    return (
        <TopToolbar>
            {/* <FilterButton /> */}
            <ExportButton />
            <CreateButton
                variant="contained"
                label="New Deal"
                sx={{ marginLeft: 2 }}
            />
        </TopToolbar>
    );
};

export default DealList;
