import * as React from 'react';
import { ShowBase, SimpleShowLayout, TextField, EmailField, DateField, useRecordContext, ShowProps } from 'react-admin';
import { Button, Stack, Dialog, DialogTitle, DialogContent, DialogActions, TextField as MuiTextField } from '@mui/material';

const contactFields = [
  { source: 'first_name', label: 'First Name', type: 'text' },
  { source: 'last_name', label: 'Last Name', type: 'text' },
  { source: 'company_name', label: 'Company Name', type: 'text' },
  { source: 'email_work', label: 'Email', type: 'email' },
  { source: 'phone_work', label: 'Phone', type: 'text' },
  { source: 'status', label: 'Status', type: 'text' },
];

const leadFields = [
  { source: 'first_name', label: 'First Name', type: 'text' },
  { source: 'last_name', label: 'Last Name', type: 'text' },
  { source: 'company_name', label: 'Company Name', type: 'text' },
  { source: 'email_work', label: 'Email', type: 'email' },
  { source: 'phone_work', label: 'Phone', type: 'text' },
  { source: 'status', label: 'Status', type: 'text' },
  { source: 'owner_id', label: 'Owner', type: 'text' },
  { source: 'notes', label: 'Notes', type: 'text' },
];

function getFields(resource: 'contacts' | 'leads') {
  return resource === 'contacts' ? contactFields : leadFields;
}

export const UnifiedResourceShow = ({ resource, ...rest }: ShowProps & { resource: 'contacts' | 'leads' }) => {
  const fields = getFields(resource);
  const record = useRecordContext();
  // For leads, show convert-to-contact dialog/action
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    first_name: record?.first_name || '',
    last_name: record?.last_name || '',
    email: record?.email_work || '',
    phone: record?.phone_work || '',
    company: record?.company_name || '',
  });
  const [loading, setLoading] = React.useState(false);

  // Placeholder for convert logic
  const handleConvert = async () => {
    setLoading(true);
    // ... conversion logic here ...
    setTimeout(() => {
      setLoading(false);
      setOpen(false);
      // Optionally show notification or redirect
    }, 1000);
  };

  return (
    <ShowBase {...rest}>
      <SimpleShowLayout>
        {fields.map(f => {
          if (f.type === 'email') return <EmailField key={f.source} source={f.source} label={f.label} />;
          if (f.type === 'text') return <TextField key={f.source} source={f.source} label={f.label} />;
          return null;
        })}
        {resource === 'leads' && (
          <>
            <Stack direction="row" spacing={2} mb={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setOpen(true)}
                disabled={!record}
              >
                Convert to Contact
              </Button>
            </Stack>
            <Dialog open={open} onClose={() => setOpen(false)}>
              <DialogTitle>Convert Lead to Contact</DialogTitle>
              <DialogContent>
                <MuiTextField
                  margin="dense"
                  label="First Name"
                  name="first_name"
                  value={form.first_name}
                  onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                  fullWidth
                />
                <MuiTextField
                  margin="dense"
                  label="Last Name"
                  name="last_name"
                  value={form.last_name}
                  onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                  fullWidth
                />
                <MuiTextField
                  margin="dense"
                  label="Email"
                  name="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  fullWidth
                />
                <MuiTextField
                  margin="dense"
                  label="Phone"
                  name="phone"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  fullWidth
                />
                <MuiTextField
                  margin="dense"
                  label="Company (optional)"
                  name="company"
                  value={form.company}
                  onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                  fullWidth
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
                <Button onClick={handleConvert} color="primary" variant="contained" disabled={loading}>
                  Convert
                </Button>
              </DialogActions>
            </Dialog>
          </>
        )}
      </SimpleShowLayout>
    </ShowBase>
  );
}; 