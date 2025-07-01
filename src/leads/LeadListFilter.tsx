import * as React from 'react';
import {
    FilterList,
    FilterLiveSearch,
    FilterListItem,
    useGetIdentity,
    useGetList,
} from 'react-admin';
import { Box, Chip, IconButton, Tooltip, Divider, Collapse, Drawer, Stack, Typography } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import TuneIcon from '@mui/icons-material/Tune';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const STATUS_CHOICES = [
    { id: 'New', name: 'New' },
    { id: 'Contacted', name: 'Contacted' },
    { id: 'Qualified', name: 'Qualified' },
    { id: 'Disqualified', name: 'Disqualified' },
    { id: 'Converted', name: 'Converted' },
];

const SIDEBAR_COLLAPSED_KEY = 'lead_sidebar_collapsed';

const LeadListFilter = () => {
    const { identity } = useGetIdentity();
    const { data: tags } = useGetList('tags', {
        pagination: { page: 1, perPage: 50 },
        sort: { field: 'name', order: 'ASC' },
    });
    const { data: leads } = useGetList('leads', {
        pagination: { page: 1, perPage: 1000 },
        sort: { field: 'created_at', order: 'DESC' },
    });
    const owners = React.useMemo(() => Array.from(new Set((leads || []).map(l => l.owner_id).filter(Boolean))), [leads]);
    const sources = React.useMemo(() => Array.from(new Set((leads || []).map(l => l.source).filter(Boolean))), [leads]);
    const [collapsed, setCollapsed] = React.useState(() => {
        const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
        return saved === '1';
    });
    const [showMore, setShowMore] = React.useState(false);
    React.useEffect(() => {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
    }, [collapsed]);

    return (
        <Box
            sx={{
                width: collapsed ? 64 : 220,
                minWidth: collapsed ? 64 : 220,
                maxWidth: collapsed ? 64 : 220,
                bgcolor: 'background.paper',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: 1,
                p: collapsed ? 1 : 2,
                mt: 5,
                mr: 2,
                position: 'sticky',
                top: 80,
                height: 'fit-content',
                zIndex: 10,
                transition: 'all 0.2s',
            }}
        >
            <Stack direction="row" alignItems="center" justifyContent={collapsed ? 'center' : 'space-between'} sx={{ mb: 1 }}>
                {collapsed ? (
                    <Tooltip title="Expand filters"><IconButton size="small" onClick={() => setCollapsed(false)}><FilterListIcon /></IconButton></Tooltip>
                ) : (
                    <>
                        <Box fontWeight={700} fontSize={16} sx={{ letterSpacing: 0.5 }}>Filters</Box>
                        <IconButton size="small" onClick={() => setCollapsed(true)}><ExpandLessIcon /></IconButton>
                    </>
                )}
            </Stack>
            <Divider sx={{ mb: 1 }} />
            {!collapsed ? (
                <>
                    <FilterLiveSearch hiddenLabel sx={{ display: 'block', mb: 1, '& .MuiFilledInput-root': { width: '100%' } }} placeholder="Search name, company, etc." />
                    <FilterList label="Status" icon={<TrendingUpIcon />}>
                        {STATUS_CHOICES.map(status => (
                            <FilterListItem key={status.id} label={status.name} value={{ status: status.id }} />
                        ))}
                    </FilterList>
                    <FilterList label="Owner" icon={<PersonIcon />}>
                        {owners.map(owner => (
                            <FilterListItem key={owner} label={owner} value={{ owner_id: owner }} />
                        ))}
                    </FilterList>
                    <FilterList label="Source" icon={<BusinessIcon />}>
                        {sources.map(source => (
                            <FilterListItem key={source} label={source} value={{ source }} />
                        ))}
                    </FilterList>
                    <FilterList label="Tags" icon={<LocalOfferIcon />}>
                        {tags && tags.map(record => (
                            <FilterListItem
                                key={record.id}
                                label={<Chip label={record?.name} size="small" style={{ backgroundColor: record?.color, border: 0, cursor: 'pointer' }} />}
                                value={{ 'tags@cs': `{${record.id}}` }}
                            />
                        ))}
                    </FilterList>
                    <Divider sx={{ my: 1 }} />
                    <Box>
                        <Tooltip title={showMore ? 'Hide more filters' : 'Show more filters'}>
                            <IconButton size="small" onClick={() => setShowMore(v => !v)}>
                                {showMore ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                        </Tooltip>
                        <Typography variant="body2" component="span" sx={{ ml: 1, fontWeight: 500 }}>
                            More filters
                        </Typography>
                    </Box>
                    <Collapse in={showMore}>
                        <FilterList label="Account manager" icon={<SupervisorAccountIcon />}>
                            <FilterListItem label="Me" value={{ owner_id: identity?.id }} />
                        </FilterList>
                    </Collapse>
                </>
            ) : (
                <Stack spacing={2} alignItems="center">
                    <Tooltip title="Status"><IconButton size="small"><TrendingUpIcon /></IconButton></Tooltip>
                    <Tooltip title="Owner"><IconButton size="small"><PersonIcon /></IconButton></Tooltip>
                    <Tooltip title="Source"><IconButton size="small"><BusinessIcon /></IconButton></Tooltip>
                    <Tooltip title="Tags"><IconButton size="small"><LocalOfferIcon /></IconButton></Tooltip>
                    <Tooltip title="More filters"><IconButton size="small"><TuneIcon /></IconButton></Tooltip>
                </Stack>
            )}
        </Box>
    );
};

export default LeadListFilter; 