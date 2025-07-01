import React from 'react';
import { useRecordContext, useGetList, useGetIdentity, Datagrid, TextField, DateField, FunctionField } from 'react-admin';
import { Box, Typography, Card, CardContent, Chip, Tooltip, Avatar, CircularProgress } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';
import PhoneIcon from '@mui/icons-material/Phone';
import EventIcon from '@mui/icons-material/Event';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import { CommunicationLog, Lead } from '../types';

const CommunicationLogIterator = () => {
    const lead = useRecordContext<Lead>();

    if (!lead) {
        return null;
    }

    const { data: logs, isLoading } = useGetList<CommunicationLog>(
        'communication_logs',
        {
            pagination: { page: 1, perPage: 100 },
            sort: { field: 'created_at', order: 'DESC' },
            filter: { lead_id: lead.id },
        }
    );

    if (isLoading) return <CircularProgress />;
    if (!logs || logs.length === 0) {
        return (
            <Card>
                <CardContent>
                    <Typography>No communication history.</Typography>
                </CardContent>
            </Card>
        );
    }

    const renderIcon = (log: CommunicationLog) => {
        switch (log.type) {
            case 'email':
                return log.status === 'opened' ? <MarkEmailReadIcon color="success" /> : <EmailIcon />;
            case 'sms':
                return <SmsIcon />;
            case 'call':
                return <PhoneIcon />;
            case 'meeting':
                return <EventIcon />;
            default:
                return null;
        }
    };

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>Communication History</Typography>
                {logs.map(log => (
                    <Box key={log.id} display="flex" alignItems="center" gap={2} mb={2}>
                        <Tooltip title={log.type}>
                           <Avatar>{renderIcon(log)}</Avatar>
                        </Tooltip>
                        <Box>
                            <Typography variant="body1">{log.content?.substring(0, 100)}...</Typography>
                            <Typography variant="body2" color="textSecondary">
                                {log.direction === 'outbound' ? 'Sent' : 'Received'} on <DateField record={log} source="created_at" showTime />
                            </Typography>
                        </Box>
                        <Chip label={log.status} size="small" />
                    </Box>
                ))}
            </CardContent>
        </Card>
    );
};

export default CommunicationLogIterator; 