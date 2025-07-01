import React, { useState, useEffect } from 'react';
import { useDataProvider, useNotify, useGetIdentity, useRecordContext } from 'react-admin';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Stack, TextField, CircularProgress, Alert, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { CalendarIntegration, Lead } from '../types';
import { CalendarService } from '../providers/calendar/calendarService';

interface MeetingSchedulerProps {
    open: boolean;
    onClose: () => void;
}

const MeetingScheduler = ({ open, onClose }: MeetingSchedulerProps) => {
    const dataProvider = useDataProvider();
    const notify = useNotify();
    const { identity } = useGetIdentity();
    const lead = useRecordContext<Lead>();

    const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
    const [selectedIntegrationId, setSelectedIntegrationId] = useState<string>('');
    const [calendars, setCalendars] = useState<any[]>([]);
    const [selectedCalendarId, setSelectedCalendarId] = useState<string>('');
    const [start, setStart] = useState<Date | null>(new Date());
    const [end, setEnd] = useState<Date | null>(() => {
        const d = new Date();
        d.setHours(d.getHours() + 1);
        return d;
    });
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && identity) {
            dataProvider.getList<CalendarIntegration>('calendar_integrations', {
                pagination: { page: 1, perPage: 10 },
                sort: { field: 'provider', order: 'ASC' },
                filter: { user_id: identity.id },
            }).then(({ data }) => setIntegrations(data));
        }
    }, [open, identity, dataProvider]);

    useEffect(() => {
        if (selectedIntegrationId) {
            setLoading(true);
            const integration = integrations.find(int => int.id === selectedIntegrationId);
            if (integration) {
                const calendarService = new CalendarService(dataProvider, integration);
                calendarService.listCalendars()
                    .then((cals: any[]) => {
                        setCalendars(cals);
                        setLoading(false);
                    })
                    .catch((err: Error) => {
                        setError('Could not fetch calendars.');
                        console.error(err);
                        setLoading(false);
                    });
            }
        }
    }, [selectedIntegrationId, integrations, dataProvider]);
    
    const handleSchedule = async () => {
        const integration = integrations.find(int => int.id === selectedIntegrationId);
        if (!integration || !selectedCalendarId || !start || !end || !title || !lead) {
            notify('Please fill all fields', { type: 'warning' });
            return;
        }

        setLoading(true);
        const calendarService = new CalendarService(dataProvider, integration);
        const event = {
            summary: title,
            start: { dateTime: start.toISOString(), timeZone: 'UTC' },
            end: { dateTime: end.toISOString(), timeZone: 'UTC' },
            attendees: [{ email: lead.email }, { email: identity?.email }],
        };

        try {
            await calendarService.createEvent(selectedCalendarId, event);
            notify('Meeting scheduled successfully!', { type: 'success' });
            // Log this as a note
            await dataProvider.create('contactnotes', {
                data: {
                    contact_id: lead.id,
                    type: 'meeting',
                    text: `Meeting scheduled: ${title}`,
                    date: new Date().toISOString(),
                    sales_id: identity?.id,
                },
            });
            onClose();
        } catch (err) {
            notify('Failed to schedule meeting', { type: 'error' });
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Schedule a Meeting with {lead?.name}</DialogTitle>
            <DialogContent>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <Stack spacing={3} mt={2}>
                        {error && <Alert severity="error">{error}</Alert>}
                        <FormControl fullWidth>
                            <InputLabel id="integration-select-label">Calendar Account</InputLabel>
                            <Select
                                labelId="integration-select-label"
                                value={selectedIntegrationId}
                                label="Calendar Account"
                                onChange={(e) => setSelectedIntegrationId(e.target.value)}
                            >
                                {integrations.map(int => (
                                    <MenuItem key={int.id} value={int.id}>{int.profile_info.email} ({int.provider})</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {loading && <CircularProgress />}
                        {calendars.length > 0 && (
                            <FormControl fullWidth>
                                <InputLabel id="calendar-select-label">Calendar</InputLabel>
                                <Select
                                    labelId="calendar-select-label"
                                    value={selectedCalendarId}
                                    label="Calendar"
                                    onChange={(e) => setSelectedCalendarId(e.target.value)}
                                >
                                    {calendars.map(cal => (
                                        <MenuItem key={cal.id} value={cal.id}>{cal.summary}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                        <TextField
                            label="Meeting Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            fullWidth
                        />
                        <DateTimePicker
                            label="Start Time"
                            value={start}
                            onChange={setStart}
                            slots={{ textField: (params) => <TextField {...params} /> }}
                        />
                        <DateTimePicker
                            label="End Time"
                            value={end}
                            onChange={setEnd}
                            slots={{ textField: (params) => <TextField {...params} /> }}
                        />
                    </Stack>
                </LocalizationProvider>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSchedule} variant="contained" disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : 'Schedule'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default MeetingScheduler; 