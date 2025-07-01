import * as React from 'react';
import { Card, CardContent, Box } from '@mui/material';
import { CreateBase, EditBase, Form, Toolbar, SaveButton, useGetIdentity, useEditContext, TextInput, SelectInput } from 'react-admin';

type FieldDef = {
    source: string;
    label: string;
    type: 'text' | 'select' | 'multiline';
    required?: boolean;
    choices?: { id: string; name: string }[];
};

const contactFields: FieldDef[] = [
  { source: 'first_name', label: 'First Name', type: 'text', required: true },
  { source: 'last_name', label: 'Last Name', type: 'text', required: true },
  { source: 'company_name', label: 'Company Name', type: 'text', required: true },
  { source: 'email_work', label: 'Email', type: 'text' },
  { source: 'phone_work', label: 'Phone', type: 'text' },
  { source: 'status', label: 'Status', type: 'text' },
];

const leadFields: FieldDef[] = [
  { source: 'first_name', label: 'First Name', type: 'text', required: true },
  { source: 'last_name', label: 'Last Name', type: 'text', required: true },
  { source: 'company_name', label: 'Company Name', type: 'text', required: true },
  { source: 'email_work', label: 'Email', type: 'text' },
  { source: 'phone_work', label: 'Phone', type: 'text' },
  { source: 'status', label: 'Status', type: 'select', choices: [
    { id: 'New', name: 'New' },
    { id: 'Contacted', name: 'Contacted' },
    { id: 'Qualified', name: 'Qualified' },
    { id: 'Disqualified', name: 'Disqualified' },
    { id: 'Converted', name: 'Converted' },
  ] },
  { source: 'owner_id', label: 'Owner', type: 'text' },
  { source: 'notes', label: 'Notes', type: 'multiline' },
];

function getFields(resource: 'contacts' | 'leads') {
  return resource === 'contacts' ? contactFields : leadFields;
}

function renderField(field: FieldDef, props = {}) {
  const { source, label, type, required, choices } = field;
  if (!source) {
    console.error('UnifiedResourceForm: Field missing source property:', field);
    return null;
  }
  if (type === 'select') {
    return <SelectInput key={source} source={source} label={label} choices={choices} {...props} />;
  }
  if (type === 'multiline') {
    return <TextInput key={source} source={source} label={label} multiline {...props} />;
  }
  // Default to TextInput
  return <TextInput key={source} source={source} label={label} required={required} {...props} />;
}

export const UnifiedResourceForm = ({
  resource,
  mode,
  defaultValues = {},
  transform,
  ...rest
}: {
  resource: 'contacts' | 'leads';
  mode: 'create' | 'edit';
  defaultValues?: any;
  transform?: (data: any) => any;
  [key: string]: any;
}) => {
  const { identity } = useGetIdentity();
  const fields = getFields(resource);

  if (mode === 'create') {
    return (
      <CreateBase
        redirect="show"
        transform={transform}
        {...rest}
      >
        <Box mt={2} display="flex">
          <Box flex="1">
            <Form defaultValues={defaultValues}>
              <Card>
                <CardContent>
                  {fields.map(f => renderField(f, resource === 'contacts' && f.source === 'status' ? { defaultValue: 'Active' } : {}))}
                </CardContent>
                <Toolbar />
              </Card>
            </Form>
          </Box>
        </Box>
      </CreateBase>
    );
  }
  // Edit mode
  return (
    <EditBase redirect="show" {...rest}>
      <UnifiedResourceEditContent resource={resource} fields={fields} />
    </EditBase>
  );
};

const UnifiedResourceEditContent = ({ resource, fields }: { resource: 'contacts' | 'leads'; fields: FieldDef[] }) => {
  const { isPending, record } = useEditContext();
  if (isPending || !record) return null;
  // You can add AI/validation chips here if desired
  return (
    <Box mt={2} display="flex">
      <Box flex="1">
        <Form>
          <Card>
            <CardContent>
              {fields.map(f => renderField(f))}
            </CardContent>
            <Toolbar>
              <SaveButton />
            </Toolbar>
          </Card>
        </Form>
      </Box>
    </Box>
  );
}; 