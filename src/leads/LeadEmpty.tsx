import { Stack, Typography } from '@mui/material';
import { CreateButton } from 'react-admin';
import useAppBarHeight from '../misc/useAppBarHeight';
import LeadImportButton from './LeadImportButton';

export const LeadEmpty = () => {
    console.log('LeadEmpty rendered');
    const appbarHeight = useAppBarHeight();
    return (
        <Stack
            justifyContent="center"
            alignItems="center"
            gap={4}
            sx={{ height: `calc(100dvh - ${appbarHeight}px)` }}
        >
            <img src="./img/empty.svg" alt="No leads found" />
            <Stack gap={1} alignItems="center">
                <Typography variant="h6" fontWeight="bold">No leads found</Typography>
                <Typography variant="body2" align="center" color="text.secondary" gutterBottom>It seems your lead list is empty.</Typography>
            </Stack>
            <Stack spacing={2} direction="row" sx={{ border: '2px dashed red', background: '#fffbe6', p: 2 }}>
                <CreateButton variant="contained" label="New Lead" data-testid="new-lead-btn" />
                <span data-testid="lead-import-btn-debug">
                  <LeadImportButton />
                </span>
            </Stack>
        </Stack>
    );
}; 