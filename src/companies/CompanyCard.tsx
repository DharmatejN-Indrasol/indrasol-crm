import * as React from 'react';
import { useState } from 'react';
import { AvatarGroup, Box, Chip, Paper, Stack, Typography, Tooltip, IconButton } from '@mui/material';
import DealIcon from '@mui/icons-material/MonetizationOn';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
    useCreatePath,
    SelectField,
    useRecordContext,
    Link,
    ReferenceManyField,
    useListContext,
} from 'react-admin';
import Divider from '@mui/material/Divider';

import { CompanyAvatar } from './CompanyAvatar';
import { Company } from '../types';
import { useConfigurationContext } from '../root/ConfigurationContext';
import { Avatar } from '../contacts/Avatar';
import { AIChip } from '../misc/AIChip';

export const CompanyCard = (props: { record?: Company }) => {
    const { companySectors } = useConfigurationContext();
    const [elevation, setElevation] = useState(1);
    const createPath = useCreatePath();
    const record = useRecordContext<Company>(props);
    const [hovered, setHovered] = useState(false);
    if (!record) return null;
    // Mock AI highlight: hot if even id, at risk if odd id
    const isHot = Number(record.id) % 2 === 0;
    const isAtRisk = Number(record.id) % 3 === 0;
    // Contact avatars logic
    const ContactAvatars = (
        <ReferenceManyField reference="contacts" target="company_id">
            <AvatarGroupIterator max={3} />
        </ReferenceManyField>
    );
    return (
        <Paper
            sx={{
                height: 260,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                p: 0,
                boxShadow: hovered ? 6 : 2,
                borderRadius: 3,
                transition: 'box-shadow 0.2s, transform 0.15s',
                background: hovered ? 'linear-gradient(90deg, #f8fafc 0%, #e0e7ef 100%)' : 'background.paper',
                position: 'relative',
                cursor: 'pointer',
                '&:hover': { transform: 'translateY(-2px) scale(1.025)' },
                outline: 'none',
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            tabIndex={0}
            aria-label={`View company ${record.name}`}
        >
            {/* Top: Avatar/logo with background circle */}
            <Box display="flex" flexDirection="column" alignItems="center" pt={2} pb={1}>
                <Box
                    sx={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        background: '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 1,
                    }}
                >
                    <CompanyAvatar width={40} height={40} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', textAlign: 'center', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {record.name}
                </Typography>
                {/* Sector as pill */}
                <Stack direction="row" justifyContent="center" mt={0.5} mb={1}>
                    <SelectField
                        color="textSecondary"
                        source="sector"
                        choices={companySectors.map(sector => ({ id: sector, name: sector }))}
                        sx={{ fontSize: '0.95rem', px: 1.5, py: 0.5, borderRadius: 2, background: '#e5e7eb', fontWeight: 500 }}
                    />
                </Stack>
            </Box>
            {/* Divider */}
            <Divider sx={{ my: 0, mx: 2 }} />
            {/* AI chips row */}
            <Stack direction="row" alignItems="center" gap={1} justifyContent="center" mt={1} mb={1}>
                <AIChip label="AI" color="primary" explanation="AI-powered company insights." sx={{ minHeight: 24 }} />
                {isHot && <AIChip label="AI: Hot" color="error" explanation="AI predicts this company is highly engaged." onFeedback={() => {}} sx={{ fontWeight: 700 }} />}
                {isAtRisk && <AIChip label="AI: At risk" color="warning" explanation="AI predicts this company may churn soon." onFeedback={() => {}} sx={{ fontWeight: 700 }} />}
            </Stack>
            {/* Divider */}
            <Divider sx={{ my: 0, mx: 2 }} />
            {/* Stats row */}
            <Box display="flex" alignItems="center" justifyContent="space-between" px={2} py={1.5}>
                {/* Contacts avatars */}
                <Box display="flex" alignItems="center" gap={1}>
                    {record.nb_contacts ? ContactAvatars : null}
                </Box>
                {/* Deals count */}
                {record.nb_deals ? (
                    <Box display="flex" alignItems="center" gap={0.5}>
                        <DealIcon color="disabled" />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1rem' }}>{record.nb_deals}</Typography>
                        <Typography variant="caption" color="textSecondary">{record.nb_deals > 1 ? 'deals' : 'deal'}</Typography>
                    </Box>
                ) : null}
            </Box>
            {/* Quick actions: bottom right, only on hover/focus */}
            {(hovered || document.activeElement === null) && (
                <Box position="absolute" bottom={10} right={10} zIndex={2} display="flex" gap={1}>
                    <Tooltip title="Edit company"><IconButton size="small" color="primary" aria-label="Edit company" component={Link} to={createPath({ resource: 'companies', id: record.id, type: 'edit' })} onClick={(e: React.MouseEvent) => e.stopPropagation()} tabIndex={0}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="View company"><IconButton size="small" color="info" aria-label="View company" component={Link} to={createPath({ resource: 'companies', id: record.id, type: 'show' })} onClick={(e: React.MouseEvent) => e.stopPropagation()} tabIndex={0}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                </Box>
            )}
        </Paper>
    );
};

const AvatarGroupIterator = ({ max }: { max: number }) => {
    const { data, total, error, isPending } = useListContext();
    if (isPending || error) return null;
    return (
        <AvatarGroup
            max={max}
            total={total}
            spacing="medium"
            sx={{
                '& .MuiAvatar-circular': {
                    width: 20,
                    height: 20,
                    fontSize: '0.6rem',
                },
            }}
        >
            {data.map((record: any) => (
                <Avatar
                    key={record.id}
                    record={record}
                    width={20}
                    height={20}
                    title={`${record.first_name} ${record.last_name}`}
                />
            ))}
        </AvatarGroup>
    );
};
