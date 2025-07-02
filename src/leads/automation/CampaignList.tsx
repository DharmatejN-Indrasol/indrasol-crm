import React, { useState } from 'react';
import {
    List,
    Datagrid,
    TextField,
    DateField,
    EditButton,
    DeleteButton,
    CreateButton,
    TextInput,
    SelectInput,
    required,
    useDataProvider,
    useNotify,
    useRefresh,
    Button,
    TopToolbar,
    FilterButton,
    SimpleForm,
    useCreate,
} from 'react-admin';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Stack,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { Campaign } from '../../types';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';
import PhoneIcon from '@mui/icons-material/Phone';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';

const CampaignListActions = () => (
    <TopToolbar>
        {/* <FilterButton /> */}
        {/* TODO: Implement CampaignImportButton if needed */}
        {/* <CampaignImportButton /> */}
        <CreateButton />
    </TopToolbar>
);

const CampaignFilters = [
    <TextInput source="name" alwaysOn />,
    <SelectInput source="status" choices={[
        { id: 'draft', name: 'Draft' },
        { id: 'active', name: 'Active' },
        { id: 'paused', name: 'Paused' },
        { id: 'completed', name: 'Completed' },
    ]} />,
    <SelectInput source="type" choices={[
        { id: 'email', name: 'Email' },
        { id: 'sms', name: 'SMS' },
        { id: 'call', name: 'Call' },
    ]} />,
];

const CampaignTypeIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'email':
            return <EmailIcon />;
        case 'sms':
            return <SmsIcon />;
        case 'call':
            return <PhoneIcon />;
        default:
            return null;
    }
};

const CampaignStatusChip = ({ record }: { record?: Campaign }) => {
    if (!record) return null;
    const status = record.status;
    const getColor = () => {
        switch (status) {
            case 'active':
                return 'success';
            case 'paused':
                return 'warning';
            case 'completed':
                return 'info';
            default:
                return 'default';
        }
    };

    return (
        <Chip
            label={status.charAt(0).toUpperCase() + status.slice(1)}
            color={getColor()}
            size="small"
        />
    );
};

const CampaignTypeField = ({ record }: { record?: Campaign }) => {
    if (!record) return null;
    return (
        <Box display="flex" alignItems="center" gap={1}>
            <CampaignTypeIcon type={record.type} />
            <TextField source="type" record={record} />
        </Box>
    );
};

const CampaignCreateDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
    const [create] = useCreate();
    const notify = useNotify();
    const refresh = useRefresh();

    const handleSubmit = async (values: any) => {
        try {
            await create('campaigns', { data: values });
            notify('Campaign created successfully');
            refresh();
            onClose();
        } catch (error) {
            notify('Error creating campaign', { type: 'error' });
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Create Campaign</DialogTitle>
            <DialogContent>
                <SimpleForm onSubmit={handleSubmit}>
                    <TextInput source="name" validate={required()} fullWidth />
                    <TextInput source="description" fullWidth multiline rows={3} />
                    <SelectInput
                        source="type"
                        choices={[
                            { id: 'email', name: 'Email Campaign' },
                            { id: 'sms', name: 'SMS Campaign' },
                            { id: 'call', name: 'Call Campaign' },
                        ]}
                        validate={required()}
                    />
                </SimpleForm>
            </DialogContent>
            <DialogActions>
                <Button label="Cancel" onClick={onClose} />
                <Button label="Create" type="submit" />
            </DialogActions>
        </Dialog>
    );
};

const CampaignList = () => {
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const dataProvider = useDataProvider();
    const notify = useNotify();

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            await dataProvider.update('campaigns', {
                id,
                data: { status: newStatus },
                previousData: {},
            });
            notify('Campaign status updated');
        } catch (error) {
            notify('Error updating campaign status', { type: 'error' });
        }
    };

    const CampaignActions = ({ record }: { record?: Campaign }) => {
        if (!record) return null;
        return (
            <Stack direction="row" spacing={1}>
                {record.status === 'draft' && (
                    <Button
                        label="Start"
                        onClick={() => handleStatusChange(record.id, 'active')}
                        startIcon={<PlayArrowIcon />}
                    />
                )}
                {record.status === 'active' && (
                    <Button
                        label="Pause"
                        onClick={() => handleStatusChange(record.id, 'paused')}
                        startIcon={<PauseIcon />}
                    />
                )}
                {record.status === 'paused' && (
                    <Button
                        label="Resume"
                        onClick={() => handleStatusChange(record.id, 'active')}
                        startIcon={<PlayArrowIcon />}
                    />
                )}
                {['active', 'paused'].includes(record.status || '') && (
                    <Button
                        label="Complete"
                        onClick={() => handleStatusChange(record.id, 'completed')}
                        startIcon={<StopIcon />}
                    />
                )}
                <EditButton />
                <DeleteButton />
            </Stack>
        );
    };

    return (
        <List
            actions={<CampaignListActions />}
            filters={CampaignFilters}
            sort={{ field: 'created_at', order: 'DESC' }}
        >
            <Datagrid rowClick="edit">
                <TextField source="name" />
                <TextField source="description" />
                <CampaignTypeField />
                <CampaignStatusChip />
                <DateField source="created_at" showTime />
                <DateField source="updated_at" showTime />
                <CampaignActions />
            </Datagrid>
            <CampaignCreateDialog
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
            />
        </List>
    );
};

export default CampaignList; 