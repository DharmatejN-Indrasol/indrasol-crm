import * as React from 'react';
import { Box, Paper, Skeleton, Typography } from '@mui/material';
import { RecordContextProvider, useListContext } from 'react-admin';
import { FixedSizeGrid as Grid } from 'react-window';
import { CompanyCard } from './CompanyCard';
import { Company } from '../types';

const CARD_WIDTH = 200;
const CARD_HEIGHT = 220;
const GRID_GAP = 16;
const COLUMN_COUNT = 4; // Adjust as needed for your layout

const times = (nbChildren: number, fn: (key: number) => any) =>
    Array.from({ length: nbChildren }, (_, key) => fn(key));

const LoadingGridList = () => (
    <Box display="flex" flexWrap="wrap" gap={2}>
        {times(15, key => (
            <Paper
                sx={{
                    height: 200,
                    width: 194,
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'grey.200',
                    boxShadow: 2,
                    borderRadius: 3,
                    transition: 'box-shadow 0.2s',
                }}
                key={key}
            />
        ))}
    </Box>
);

const LoadedGridList = React.memo(() => {
    const { data, error, isPending } = useListContext<Company>();
    if (isPending) {
        return (
            <Box gap={2} display="grid" gridTemplateColumns="repeat(auto-fill, minmax(240px, 1fr))">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} variant="rectangular" height={240} sx={{ borderRadius: 3, boxShadow: 2, transition: 'box-shadow 0.2s' }} />
                ))}
            </Box>
        );
    }
    if (error) return null;
    if (!data || data.length === 0) {
        return <Typography p={2}>No companies found</Typography>;
    }
    return (
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr', lg: '1fr 1fr 1fr 1fr' }} gap={3}>
            {data.map(record => (
                <RecordContextProvider key={record.id} value={record}>
                    <MemoCompanyCard />
                </RecordContextProvider>
            ))}
        </Box>
    );
});

const MemoCompanyCard = React.memo(CompanyCard);

export const ImageList = React.memo(() => {
    const { isPending } = useListContext();
    return isPending ? <LoadingGridList /> : <LoadedGridList />;
});
