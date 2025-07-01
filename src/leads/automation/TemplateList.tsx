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
    RichTextField,
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
import { Template } from '../../types';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';
import PhoneIcon from '@mui/icons-material/Phone';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import { RichTextInput } from 'ra-input-rich-text';

const TemplateListActions = () => (
    <TopToolbar>
        {/* <FilterButton /> */}
        <CreateButton />
    </TopToolbar>
);

const TemplateFilters = [
    <TextInput source="name" alwaysOn />,
    <SelectInput source="type" choices={[
        { id: 'email', name: 'Email' },
        { id: 'sms', name: 'SMS' },
        { id: 'call_script', name: 'Call Script' },
    ]} />,
];

const TemplateTypeIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'email':
            return <EmailIcon />;
        case 'sms':
            return <SmsIcon />;
        case 'call_script':
            return <PhoneIcon />;
        default:
            return null;
    }
};

const TemplateTypeChip = ({ record }: { record?: Template }) => {
    if (!record) return null;
    const type = record.type;
    const getColor = () => {
        switch (type) {
            case 'email':
                return 'primary';
            case 'sms':
                return 'success';
            case 'call_script':
                return 'warning';
            default:
                return 'default';
        }
    };

    return (
        <Chip
            icon={<TemplateTypeIcon type={type} />}
            label={type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            color={getColor()}
            size="small"
        />
    );
};

const TemplateCreateDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
    const [create] = useCreate();
    const notify = useNotify();
    const refresh = useRefresh();

    const handleSubmit = async (values: any) => {
        try {
            await create('templates', { data: values });
            notify('Template created successfully');
            refresh();
            onClose();
        } catch (error) {
            notify('Error creating template', { type: 'error' });
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Create Template</DialogTitle>
            <DialogContent>
                <SimpleForm onSubmit={handleSubmit}>
                    <TextInput source="name" validate={required()} fullWidth />
                    <TextInput source="description" fullWidth multiline rows={2} />
                    <SelectInput
                        source="type"
                        choices={[
                            { id: 'email', name: 'Email Template' },
                            { id: 'sms', name: 'SMS Template' },
                            { id: 'call_script', name: 'Call Script' },
                        ]}
                        validate={required()}
                    />
                    <TextInput
                        source="subject"
                        fullWidth
                        helperText="Required for email templates"
                    />
                    <RichTextInput
                        source="content"
                        validate={required()}
                        fullWidth
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

const TemplateList = () => {
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const dataProvider = useDataProvider();
    const notify = useNotify();

    const handleDuplicate = async (template: Template) => {
        try {
            const { id, created_at, updated_at, ...templateData } = template;
            await dataProvider.create('templates', {
                data: {
                    ...templateData,
                    name: `${templateData.name} (Copy)`,
                },
            });
            notify('Template duplicated successfully');
        } catch (error) {
            notify('Error duplicating template', { type: 'error' });
        }
    };

    const TemplateActions = ({ record }: { record?: Template }) => {
        if (!record) return null;
        return (
            <Stack direction="row" spacing={1}>
                <Button
                    label="Duplicate"
                    onClick={() => handleDuplicate(record)}
                    startIcon={<FileCopyIcon />}
                />
                <EditButton />
                <DeleteButton />
            </Stack>
        );
    };

    return (
        <List
            actions={<TemplateListActions />}
            filters={TemplateFilters}
            sort={{ field: 'created_at', order: 'DESC' }}
        >
            <Datagrid>
                <TextField source="name" />
                <TextField source="description" />
                <TemplateTypeChip />
                <TextField source="subject" />
                <RichTextField source="content" />
                <DateField source="created_at" showTime />
                <DateField source="updated_at" showTime />
                <TemplateActions />
            </Datagrid>
            <TemplateCreateDialog
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
            />
        </List>
    );
};

export default TemplateList; 