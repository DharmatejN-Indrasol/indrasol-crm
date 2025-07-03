import { Draggable } from '@hello-pangea/dnd';
import { Box, Card, Typography, Chip, Stack, Tooltip } from '@mui/material';
import { ReferenceField, useRedirect } from 'react-admin';
import { CompanyAvatar } from '../companies/CompanyAvatar';
import { Deal } from '../types';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { getAINextAction, AINextActionResult } from '../misc/aiService';
import { useState, useEffect } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Divider from '@mui/material/Divider';

export const DealCard = ({ deal, index, draggable = true }: { deal: Deal; index: number; draggable?: boolean }) => {
    if (!deal) return null;
    if (!draggable) {
        // Render plain card content (no Draggable)
        return <DealCardContent deal={deal} />;
    }
    return (
        <Draggable draggableId={String(deal.id)} index={index}>
            {(provided, snapshot) => (
                <DealCardContent
                    provided={provided}
                    snapshot={snapshot}
                    deal={deal}
                />
            )}
        </Draggable>
    );
};

export const DealCardContent = ({
    provided,
    snapshot,
    deal,
}: {
    provided?: any;
    snapshot?: any;
    deal: Deal;
}) => {
    const redirect = useRedirect();
    const [hovered, setHovered] = useState(false);
    const [ai, setAI] = useState<{status?: string, error?: string}>({});
    const [aiLoading, setAILoading] = useState(true);
    const [aiError, setAIError] = useState<string | null>(null);
    useEffect(() => {
        let cancelled = false;
        setAILoading(true);
        // TODO: Replace with getAIStatus when available
        const aiStatus = Number(deal.id) % 2 === 0 ? 'AI: Hot' : 'AI: At risk';
        setAI({ status: aiStatus });
        setAILoading(false);
        return () => { cancelled = true; };
    }, [deal]);
    const handleClick = () => {
        redirect(`/deals/${deal.id}/show`, undefined, undefined, undefined, {
            _scrollToTop: false,
        });
    };
    const handleFeedback = (feedback: 'up' | 'down') => { /* TODO: send feedback to analytics */ };
    return (
        <Box
            sx={{
                marginBottom: 2,
                cursor: 'pointer',
                borderRadius: 3,
                boxShadow: hovered ? 6 : 2,
                background: hovered ? 'linear-gradient(90deg, #f8fafc 0%, #e0e7ef 100%)' : 'background.paper',
                transition: 'box-shadow 0.2s, transform 0.15s',
                '&:hover': { transform: 'translateY(-2px) scale(1.025)' },
                outline: 'none',
                position: 'relative',
            }}
            {...provided?.draggableProps}
            {...provided?.dragHandleProps}
            ref={provided?.innerRef}
            onClick={handleClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            tabIndex={0}
            aria-label={`View deal ${deal.name}`}
        >
            {/* Top: Avatar/logo and name */}
            <Box display="flex" flexDirection="column" alignItems="center" pt={2} pb={1}>
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 1,
                    }}
                >
                    <ReferenceField
                        source="company_id"
                        record={deal}
                        reference="companies"
                        link={false}
                    >
                        <CompanyAvatar width={32} height={32} />
                    </ReferenceField>
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', textAlign: 'center', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {deal.name}
                </Typography>
            </Box>
            <Divider sx={{ my: 0, mx: 2 }} />
            {/* Amount, category, quick actions */}
            <Box display="flex" alignItems="center" justifyContent="space-between" px={2} py={1.5}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1.1rem' }}>
                        {deal.amount.toLocaleString('en-US', {
                            notation: 'compact',
                            style: 'currency',
                            currency: 'USD',
                            currencyDisplay: 'narrowSymbol',
                            minimumSignificantDigits: 3,
                        })}
                    </Typography>
                    {deal.category && (
                        <Chip label={deal.category} size="small" sx={{ mt: 0.5, fontWeight: 500, background: '#e5e7eb', color: 'text.secondary' }} />
                    )}
                </Box>
                {/* Quick actions: bottom right, only on hover/focus */}
                {(hovered || document.activeElement === null) && (
                    <Box display="flex" gap={1}>
                        <Tooltip title="Edit deal"><EditIcon fontSize="small" color="primary" sx={{ cursor: 'pointer' }} onClick={e => { e.stopPropagation(); redirect(`/deals/${deal.id}/edit`); }} /></Tooltip>
                        <Tooltip title="View deal"><VisibilityIcon fontSize="small" color="info" sx={{ cursor: 'pointer' }} onClick={e => { e.stopPropagation(); redirect(`/deals/${deal.id}/show`); }} /></Tooltip>
                    </Box>
                )}
            </Box>
        </Box>
    );
};
