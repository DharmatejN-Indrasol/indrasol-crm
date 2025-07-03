import { Chip, LinearProgress, Stack, Typography } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { CreateButton, useGetList } from 'react-admin';
import { matchPath, useLocation } from 'react-router';
import { Link } from 'react-router-dom';
import useAppBarHeight from '../misc/useAppBarHeight';
import { Contact } from '../types';
import { DealCreate } from './DealCreate';
import { DealImportButton } from './DealImportButton';

export const DealEmpty = ({ children }: { children?: React.ReactNode }) => {
    const location = useLocation();
    const matchCreate = matchPath('/deals/create', location.pathname);
    const appbarHeight = useAppBarHeight();

    // get Contact data (no loading check)
    const { data: contacts } = useGetList<Contact>(
        'contacts',
        {
            pagination: { page: 1, perPage: 1 },
        }
    );

    return (
        <Stack
            justifyContent="center"
            alignItems="center"
            gap={4}
            sx={{ height: `calc(100dvh - ${appbarHeight}px)` }}
        >
            <img src="./img/empty.svg" alt="No deals found" />
            {contacts && contacts.length > 0 ? (
                <>
                    <Stack gap={1} alignItems="center">
                        <Typography variant="h6" fontWeight="bold">No deals found</Typography>
                        <Typography variant="body2" align="center" color="text.secondary" gutterBottom>It seems your deal list is empty.</Typography>
                    </Stack>
                    <Stack spacing={2} direction="row">
                        <CreateButton variant="contained" label="Create deal" />
                        <DealImportButton />
                    </Stack>
                    <DealCreate open={!!matchCreate} />
                    {children}
                </>
            ) : (
                <Stack gap={0} alignItems="center">
                    <Typography variant="h6" fontWeight="bold">
                        No deals found
                    </Typography>
                    <Typography
                        variant="body2"
                        align="center"
                        color="text.secondary"
                        gutterBottom
                    >
                        It seems your contact list is empty.
                        <br />
                        <Link to="/contacts/create">
                            Add your first contact
                        </Link>{' '}
                        before creating a deal.
                    </Typography>
                </Stack>
            )}
        </Stack>
    );
};
