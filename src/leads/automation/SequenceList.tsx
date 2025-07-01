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
    ArrayInput,
    SimpleFormIterator,
    NumberInput,
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
    Stepper,
    Step,
    StepLabel,
    StepContent,
} from '@mui/material';
import { Sequence } from '../../types';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';
import PhoneIcon from '@mui/icons-material/Phone';
import TaskIcon from '@mui/icons-material/Task';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ArchiveIcon from '@mui/icons-material/Archive';

const SequenceListActions = () => (
    <TopToolbar>
        {/* <FilterButton /> */}
        <CreateButton />
    </TopToolbar>
);

const SequenceFilters = [
    <TextInput source="name" alwaysOn />,
    <SelectInput source="status" choices={[
        { id: 'active', name: 'Active' },
        { id: 'paused', name: 'Paused' },
        { id: 'archived', name: 'Archived' },
    ]} />,
];

const StepTypeIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'email':
            return <EmailIcon />;
        case 'sms':
            return <SmsIcon />;
        case 'call':
            return <PhoneIcon />;
        case 'task':
            return <TaskIcon />;
        default:
            return null;
    }
};

const SequenceStatusChip = ({ record }: { record?: Sequence }) => {
    if (!record) return null;
    const status = record.status;
    const getColor = () => {
        switch (status) {
            case 'active':
                return 'success';
            case 'paused':
                return 'warning';
            case 'archived':
                return 'default';
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

const SequenceSteps = ({ record }: { record?: Sequence }) => {
    if (!record) return null;
    const steps = record.steps || [];
    return (
        <Stepper orientation="vertical">
            {steps.map((step, index) => (
                <Step key={index} active completed>
                    <StepLabel icon={<StepTypeIcon type={step.type} />}>
                        {step.type.charAt(0).toUpperCase() + step.type.slice(1)}
                    </StepLabel>
                    <StepContent>
                        <Typography variant="body2">
                            After {step.delay} {step.delay_unit}
                        </Typography>
                        {step.template_id && (
                            <Typography variant="body2" color="textSecondary">
                                Template: {step.template_id}
                            </Typography>
                        )}
                    </StepContent>
                </Step>
            ))}
        </Stepper>
    );
};

const SequenceCreateDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
    const [create] = useCreate();
    const notify = useNotify();
    const refresh = useRefresh();

    const handleSubmit = async (values: any) => {
        try {
            await create('sequences', { data: values });
            notify('Sequence created successfully');
            refresh();
            onClose();
        } catch (error) {
            notify('Error creating sequence', { type: 'error' });
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Create Sequence</DialogTitle>
            <DialogContent>
                <SimpleForm onSubmit={handleSubmit}>
                    <TextInput source="name" validate={required()} fullWidth />
                    <TextInput source="description" fullWidth multiline rows={3} />
                    <ArrayInput source="steps">
                        <SimpleFormIterator>
                            <SelectInput
                                source="type"
                                choices={[
                                    { id: 'email', name: 'Send Email' },
                                    { id: 'sms', name: 'Send SMS' },
                                    { id: 'call', name: 'Make Call' },
                                    { id: 'task', name: 'Create Task' },
                                ]}
                                validate={required()}
                            />
                            <SelectInput
                                source="template_id"
                                choices={[]} // TODO: Fetch templates
                            />
                            <NumberInput source="delay" validate={required()} />
                            <SelectInput
                                source="delay_unit"
                                choices={[
                                    { id: 'minutes', name: 'Minutes' },
                                    { id: 'hours', name: 'Hours' },
                                    { id: 'days', name: 'Days' },
                                ]}
                                validate={required()}
                            />
                        </SimpleFormIterator>
                    </ArrayInput>
                </SimpleForm>
            </DialogContent>
            <DialogActions>
                <Button label="Cancel" onClick={onClose} />
                <Button label="Create" type="submit" />
            </DialogActions>
        </Dialog>
    );
};

const SequenceList = () => {
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const dataProvider = useDataProvider();
    const notify = useNotify();

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            await dataProvider.update('sequences', {
                id,
                data: { status: newStatus },
                previousData: {},
            });
            notify('Sequence status updated');
        } catch (error) {
            notify('Error updating sequence status', { type: 'error' });
        }
    };

    const SequenceActions = ({ record }: { record?: Sequence }) => {
        if (!record) return null;
        return (
            <Stack direction="row" spacing={1}>
                {record.status === 'paused' && (
                    <Button
                        label="Activate"
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
                {['active', 'paused'].includes(record.status || '') && (
                    <Button
                        label="Archive"
                        onClick={() => handleStatusChange(record.id, 'archived')}
                        startIcon={<ArchiveIcon />}
                    />
                )}
                <EditButton />
                <DeleteButton />
            </Stack>
        );
    };

    return (
        <List
            actions={<SequenceListActions />}
            filters={SequenceFilters}
            sort={{ field: 'created_at', order: 'DESC' }}
        >
            <Datagrid expand={<SequenceSteps />}>
                <TextField source="name" />
                <TextField source="description" />
                <SequenceStatusChip />
                <DateField source="created_at" showTime />
                <DateField source="updated_at" showTime />
                <SequenceActions />
            </Datagrid>
            <SequenceCreateDialog
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
            />
        </List>
    );
};

export default SequenceList; 