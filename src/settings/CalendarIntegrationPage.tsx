import React, { useState, useEffect } from 'react';
import { useDataProvider, useNotify, useGetIdentity, Title, useRefresh } from 'react-admin';
import { Card, CardContent, Typography, Button, Box, Avatar, Stack, Chip, CircularProgress, Alert } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import GoogleIcon from '@mui/icons-material/Google';
import MicrosoftIcon from '@mui/icons-material/Microsoft';
import { CalendarIntegration } from '../types';

const getOAuthUrl = (provider: 'google' | 'outlook') => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const redirectUri = `${window.location.origin}/auth-callback`;
    let url = '';
    if (provider === 'google') {
        url = `${supabaseUrl}/auth/v1/authorize?provider=google&options[redirect_to]=${redirectUri}&options[scopes]=https://www.googleapis.com/auth/calendar`;
    } else {
        url = `${supabaseUrl}/auth/v1/authorize?provider=azure&options[redirect_to]=${redirectUri}&options[scopes]=Calendars.ReadWrite`;
    }
    return url;
};

const CalendarIntegrationPage = () => {
    const dataProvider = useDataProvider();
    const notify = useNotify();
    const { identity } = useGetIdentity();
    const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const refresh = useRefresh();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        if (searchParams.get('success')) {
            notify('Calendar connected successfully!', { type: 'success' });
            navigate(location.pathname, { replace: true });
            refresh();
        }
        if (searchParams.get('error')) {
            notify(`Error connecting calendar: ${searchParams.get('error')}`, { type: 'error' });
            navigate(location.pathname, { replace: true });
        }
    }, [location, notify, refresh, navigate]);

    useEffect(() => {
        if (identity) {
            setLoading(true);
            dataProvider.getList<CalendarIntegration>('calendar_integrations', {
                pagination: { page: 1, perPage: 10 },
                sort: { field: 'provider', order: 'ASC' },
                filter: { user_id: identity.id },
            })
            .then(({ data }) => {
                setIntegrations(data);
                setLoading(false);
            })
            .catch(err => {
                setError('Could not fetch calendar integrations.');
                console.error(err);
                setLoading(false);
            });
        }
    }, [identity, dataProvider]);

    const handleDisconnect = async (id: string) => {
        const integration = integrations.find(int => int.id === id);
        if (!integration) return;
        try {
            await dataProvider.delete('calendar_integrations', { id, previousData: integration });
            setIntegrations(integrations.filter(int => int.id !== id));
            notify('Calendar integration disconnected successfully.', { type: 'success' });
        } catch (err) {
            notify('Failed to disconnect calendar integration.', { type: 'error' });
            console.error(err);
        }
    };

    const isConnected = (provider: 'google' | 'outlook') => integrations.some(int => int.provider === provider);
    const getIntegration = (provider: 'google' | 'outlook') => integrations.find(int => int.provider === provider);

    if (loading) {
        return <CircularProgress />;
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    return (
        <Box>
            <Title title="Calendar Integration" />
            <Typography variant="h4" gutterBottom>Calendar Integration</Typography>
            <Typography variant="body1" paragraph>
                Connect your calendar to schedule meetings and sync events with your leads and contacts.
            </Typography>

            <Stack spacing={4} mt={4}>
                <Card variant="outlined">
                    <CardContent>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <GoogleIcon fontSize="large" color="primary" />
                            <Box flexGrow={1}>
                                <Typography variant="h6">Google Calendar</Typography>
                                {isConnected('google') ? (
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Avatar src={getIntegration('google')?.profile_info?.picture} sx={{ width: 24, height: 24 }}/>
                                        <Typography variant="body2">{getIntegration('google')?.profile_info?.email}</Typography>
                                        <Chip label="Connected" color="success" size="small" />
                                    </Stack>
                                ) : (
                                    <Typography variant="body2" color="textSecondary">Not connected</Typography>
                                )}
                            </Box>
                            {isConnected('google') ? (
                                <Button
                                    variant="contained"
                                    color="error"
                                    onClick={() => handleDisconnect(getIntegration('google')?.id || '')}
                                >
                                    Disconnect
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    href={getOAuthUrl('google')}
                                >
                                    Connect
                                </Button>
                            )}
                        </Stack>
                    </CardContent>
                </Card>

                <Card variant="outlined">
                    <CardContent>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <MicrosoftIcon fontSize="large" color="secondary" />
                            <Box flexGrow={1}>
                                <Typography variant="h6">Outlook Calendar</Typography>
                                {isConnected('outlook') ? (
                                     <Stack direction="row" spacing={1} alignItems="center">
                                        <Avatar src={getIntegration('outlook')?.profile_info?.picture} sx={{ width: 24, height: 24 }}/>
                                        <Typography variant="body2">{getIntegration('outlook')?.profile_info?.email}</Typography>
                                        <Chip label="Connected" color="success" size="small" />
                                    </Stack>
                                ) : (
                                    <Typography variant="body2" color="textSecondary">Not connected</Typography>
                                )}
                            </Box>
                             {isConnected('outlook') ? (
                                <Button
                                    variant="contained"
                                    color="error"
                                    onClick={() => handleDisconnect(getIntegration('outlook')?.id || '')}
                                >
                                    Disconnect
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    href={getOAuthUrl('outlook')}
                                >
                                    Connect
                                </Button>
                            )}
                        </Stack>
                    </CardContent>
                </Card>
            </Stack>
        </Box>
    );
};

export default CalendarIntegrationPage; 