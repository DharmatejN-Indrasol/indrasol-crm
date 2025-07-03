import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import { ActivityLog } from '../activity/ActivityLog';
import Stack from '@mui/material/Stack';

export function DashboardActivityLog() {
    return (
        <Card sx={{ p: 2, boxShadow: 2, borderRadius: 3, '&:hover': { boxShadow: 4 }, transition: 'box-shadow 0.2s', mb: 0.5 }}>
            <Stack>
                <Box display="flex" alignItems="center" mb={1}>
                    <Box mr={1} display="flex">
                        <AccessTimeIcon color="disabled" fontSize="medium" aria-label="Latest Activity" />
                    </Box>
                    <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 0.2, fontSize: '1.1rem' }}>
                        Latest Activity
                    </Typography>
                </Box>
                <Box maxHeight={520} overflow="auto">
                    <ActivityLog pageSize={10} />
                </Box>
            </Stack>
        </Card>
    );
}
