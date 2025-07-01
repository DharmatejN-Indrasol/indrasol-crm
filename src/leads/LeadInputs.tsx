import * as React from 'react';
import {
    Divider,
    Stack,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import {
    TextInput,
    SelectInput,
    ReferenceInput,
    AutocompleteInput,
    required,
    useCreate,
    useGetIdentity,
    useNotify,
} from 'react-admin';

const statusChoices = [
    { id: 'New', name: 'New' },
    { id: 'Contacted', name: 'Contacted' },
    { id: 'Qualified', name: 'Qualified' },
    { id: 'Disqualified', name: 'Disqualified' },
    { id: 'Converted', name: 'Converted' },
];

export const LeadInputs = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [create] = useCreate();
    const { identity } = useGetIdentity();
    const notify = useNotify();
    const handleCreateCompany = async (name?: string) => {
        if (!name) return;
        try {
            const newCompany = await create(
                'companies',
                {
                    data: {
                        name,
                        sales_id: identity?.id,
                        created_at: new Date().toISOString(),
                    },
                },
                { returnPromise: true }
            );
            return newCompany;
        } catch (error) {
            notify('An error occurred while creating the company', {
                type: 'error',
            });
        }
    };
    return (
        <Stack gap={2} p={1}>
            <Stack gap={3} direction={isMobile ? 'column' : 'row'}>
                <Stack gap={4} flex={4}>
                    <Typography variant="h6">Lead Info</Typography>
                    <TextInput source="first_name" label="First Name" validate={required()} helperText={false} />
                    <TextInput source="last_name" label="Last Name" validate={required()} helperText={false} />
                    <ReferenceInput source="company_id" reference="companies">
                        <AutocompleteInput label="Company" helperText={false} onCreate={handleCreateCompany} />
                    </ReferenceInput>
                    <TextInput source="email" label="Email" helperText={false} />
                    <TextInput source="phone" label="Phone" helperText={false} />
                </Stack>
                <Divider orientation={isMobile ? 'horizontal' : 'vertical'} flexItem />
                <Stack gap={4} flex={5}>
                    <Typography variant="h6">Status & Owner</Typography>
                    <SelectInput source="status" label="Status" choices={statusChoices} validate={required()} helperText={false} />
                    <ReferenceInput source="owner_id" reference="users">
                        <TextInput source="owner_id" label="Owner" helperText={false} />
                    </ReferenceInput>
                    <TextInput source="source" label="Source" helperText={false} />
                    <TextInput source="notes" label="Notes" multiline helperText={false} />
                </Stack>
            </Stack>
        </Stack>
    );
}; 