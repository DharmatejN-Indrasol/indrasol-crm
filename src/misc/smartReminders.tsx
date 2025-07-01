import React, { useState } from 'react';
import { Box, List, ListItem, ListItemText, IconButton, Tooltip, Typography, Chip, Collapse, Stack } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import SnoozeIcon from '@mui/icons-material/Snooze';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useNotify } from 'react-admin';
import SmartToyIcon from '@mui/icons-material/SmartToy';


export function getSmartReminders(record: any): string[] {
  // Mock: suggest follow-up if no activity in 14 days, or no tasks
  const reminders: string[] = [];
  if (record.last_seen) {
    const days = (Date.now() - new Date(record.last_seen).getTime()) / (1000 * 60 * 60 * 24);
    if (days > 14) reminders.push('No activity in 14+ days. Suggest follow-up.');
  }
  if (record.nb_tasks === 0 || record.nb_tasks === undefined) {
    reminders.push('No follow-up tasks scheduled.');
  }
  // Add more rules as needed
  return reminders;
}

function getReminderType(reminder: string) {
  if (reminder.includes('No activity')) return 'activity';
  if (reminder.includes('No follow-up')) return 'task';
  return 'info';
}

function getReminderIcon(type: string) {
  if (type === 'activity') return <AccessTimeIcon color="warning" fontSize="small" sx={{ mr: 1 }} />;
  if (type === 'task') return <EventNoteIcon color="info" fontSize="small" sx={{ mr: 1 }} />;
  return null;
}

function getReminderChip(type: string) {
  if (type === 'activity') return <Chip label="Activity" color="warning" size="small" sx={{ mr: 1 }} />;
  if (type === 'task') return <Chip label="Task" color="info" size="small" sx={{ mr: 1 }} />;
  return <Chip label="Info" color="default" size="small" sx={{ mr: 1 }} />;
}

export function SmartRemindersList({ reminders }: { reminders: string[] }) {
  const [dismissed, setDismissed] = useState<number[]>([]);
  const [snoozed, setSnoozed] = useState<number[]>([]);
  const notify = useNotify();
  return (
    <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, p: 1, boxShadow: 1 }}>
      <Stack direction="row" alignItems="center" gap={0.5} p={1}>
        <Chip icon={<SmartToyIcon fontSize="small" />} label="AI" color="primary" size="small" aria-label="AI feature" sx={{ fontWeight: 700, letterSpacing: 1, '&:focus-visible': { outline: '2px solid #2563eb', outlineOffset: 2 } }} />
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#2563eb' }}>Smart Reminders</Typography>
      </Stack>
      <List dense={false}>
        {reminders.map((reminder, idx) => {
          if (dismissed.includes(idx)) return null;
          const type = getReminderType(reminder);
          return (
            <Collapse in={!dismissed.includes(idx)} key={idx}>
              <ListItem secondaryAction={
                <>
                  <Tooltip title="Mark as done">
                    <IconButton edge="end" onClick={() => { setDismissed([...dismissed, idx]); notify('Reminder marked as done!', { type: 'success' }); }} aria-label="mark as done">
                      <CheckIcon color="success" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Snooze">
                    <IconButton edge="end" onClick={() => { setSnoozed([...snoozed, idx]); notify('Reminder snoozed!', { type: 'info' }); }} aria-label="snooze">
                      <SnoozeIcon color="warning" />
                    </IconButton>
                  </Tooltip>
                </>
              }>
                {getReminderIcon(type)}
                {getReminderChip(type)}
                <ListItemText primary={reminder + (snoozed.includes(idx) ? ' (Snoozed)' : '')} />
              </ListItem>
            </Collapse>
          );
        })}
        {reminders.length === 0 && <ListItem><ListItemText primary="No reminders!" /></ListItem>}
      </List>
    </Box>
  );
} 