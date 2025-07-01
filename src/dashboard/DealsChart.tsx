import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { Box, Stack, Typography, Card } from '@mui/material';
// import { ResponsiveBar } from '@nivo/bar';
import { format, startOfMonth } from 'date-fns';
import { useMemo } from 'react';
import { useGetList } from 'react-admin';

import { Deal } from '../types';

const multiplier = {
    opportunity: 0.2,
    'proposal-sent': 0.5,
    'in-negociation': 0.8,
    delayed: 0.3,
};

const threeMonthsAgo = new Date(
    new Date().setMonth(new Date().getMonth() - 6)
).toISOString();

export const DealsChart = () => {
    const { data, isPending } = useGetList<Deal>('deals', {
        pagination: { perPage: 100, page: 1 },
        sort: {
            field: 'created_at',
            order: 'ASC',
        },
        filter: {
            'created_at@gte': threeMonthsAgo,
        },
    });
    const months = useMemo(() => {
        if (!data) return [];
        const dealsByMonth = data.reduce((acc, deal) => {
            const month = startOfMonth(
                deal.created_at ?? new Date()
            ).toISOString();
            if (!acc[month]) {
                acc[month] = [];
            }
            acc[month].push(deal);
            return acc;
        }, {} as any);

        const amountByMonth = Object.keys(dealsByMonth).map(month => {
            return {
                date: format(month, 'MMM'),
                won: dealsByMonth[month]
                    .filter((deal: Deal) => deal.stage === 'won')
                    .reduce((acc: number, deal: Deal) => {
                        acc += deal.amount;
                        return acc;
                    }, 0),
                pending: dealsByMonth[month]
                    .filter(
                        (deal: Deal) => !['won', 'lost'].includes(deal.stage)
                    )
                    .reduce((acc: number, deal: Deal) => {
                        // @ts-ignore
                        acc += deal.amount * multiplier[deal.stage];
                        return acc;
                    }, 0),
                lost: dealsByMonth[month]
                    .filter((deal: Deal) => deal.stage === 'lost')
                    .reduce((acc: number, deal: Deal) => {
                        acc -= deal.amount;
                        return acc;
                    }, 0),
            };
        });

        return amountByMonth;
    }, [data]);

    if (isPending) return null; // FIXME return skeleton instead
    const range = months.reduce(
        (acc, month) => {
            acc.min = Math.min(acc.min, month.lost);
            acc.max = Math.max(acc.max, month.won + month.pending);
            return acc;
        },
        { min: 0, max: 0 }
    );
    return (
        <Card sx={{ p: 2, boxShadow: 2, borderRadius: 3, '&:hover': { boxShadow: 4 }, transition: 'box-shadow 0.2s', mb: 2 }}>
            <Stack>
                <Box display="flex" alignItems="center" mb={1}>
                    <Box mr={1} display="flex">
                        <AttachMoneyIcon color="disabled" fontSize="medium" aria-label="Upcoming Deal Revenue" />
                    </Box>
                    <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 0.2, fontSize: '1.1rem' }}>
                        Upcoming Deal Revenue
                    </Typography>
                </Box>                
            </Stack>
        </Card>
    );
};
