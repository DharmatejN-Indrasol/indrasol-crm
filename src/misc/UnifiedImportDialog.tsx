import React, { useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Stack, Typography, Table, TableHead, TableRow, TableCell, TableBody, Chip, CircularProgress, Snackbar, Alert, Autocomplete, TextField, Dialog as MuiDialog
} from '@mui/material';
import { useRefresh } from 'react-admin';
import { usePapaParse } from './usePapaParse';
import { useContactImport, ContactImportSchema } from '../contacts/useContactImport';
import { useLeadImport, LeadImportSchema } from '../leads/useLeadImport';
import { mapZoomInfoCsvRowToContact } from '../contacts/mapCsvRowToContact';

// Sample CSVs (stub for leads)
import * as contactSampleCsv from '../contacts/contacts_export.csv?raw';
const leadSampleCsv = `first_name,last_name,email_work,phone_work,company_name,status\nAlice,Smith,alice@company.com,555-1234,Acme,New`;

const SAMPLE_CSVS = {
  contacts: `data:text/csv;name=crm_contacts_sample.csv;charset=utf-8,${encodeURIComponent(contactSampleCsv.default)}`,
  leads: `data:text/csv;name=crm_leads_sample.csv;charset=utf-8,${encodeURIComponent(leadSampleCsv)}`,
};

const REQUIRED_FIELDS = {
  contacts: ['first_name', 'last_name', 'company_name'],
  leads: ['first_name', 'last_name', 'company_name'],
};

const FIELD_LABELS: { [key: string]: string } = {
  first_name: 'First Name',
  last_name: 'Last Name',
  company_name: 'Company Name',
  email_work: 'Email',
  phone_work: 'Phone',
  status: 'Status',
};

const ENTITY_FIELDS = {
  contacts: ['first_name', 'last_name', 'company_name', 'email_work', 'phone_work', 'status'],
  leads: ['first_name', 'last_name', 'company_name', 'email_work', 'phone_work', 'status'],
};

export function mapCsvRowToLead(row: any): LeadImportSchema {
  return {
    first_name: row['first_name'] || row['First Name'] || '',
    last_name: row['last_name'] || row['Last Name'] || '',
    company_name: row['company_name'] || row['Company Name'] || '',
    email_work: row['email_work'] || row['Email'] || '',
    phone_work: row['phone_work'] || row['Phone'] || '',
    status: row['status'] || row['Status'] || 'New',
    ...row,
  };
}

type UnifiedImportDialogProps = {
  open: boolean;
  onClose: () => void;
  defaultResource?: 'contacts' | 'leads';
};

type ZoomInfoFilter = {
  jobTitle: string;
  state: string;
  industry: string;
  managementLevel: string;
  emailDomain: string;
};

const defaultZoomInfoFilter: ZoomInfoFilter = {
  jobTitle: '',
  state: '',
  industry: '',
  managementLevel: '',
  emailDomain: '',
};

export const UnifiedImportDialog: React.FC<UnifiedImportDialogProps> = ({ open, onClose, defaultResource = 'contacts' }) => {
  const resource = defaultResource;
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; errors: number } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [showZoomInfoDialog, setShowZoomInfoDialog] = useState(false);
  const [zoomInfoFilter, setZoomInfoFilter] = useState<ZoomInfoFilter>(defaultZoomInfoFilter);
  const [zoomInfoPreview, setZoomInfoPreview] = useState<any[]>([]);
  const [zoomInfoLoading, setZoomInfoLoading] = useState(false);
  const [zoomInfoError, setZoomInfoError] = useState<string | null>(null);
  const refresh = useRefresh();
  const processContactBatch = useContactImport();
  const processLeadBatch = useLeadImport();
  const { importer, parseCsv, reset } = usePapaParse<any>({
    batchSize: 10,
    processBatch: async (batch) => {
      if (resource === 'contacts') {
        await processContactBatch(batch.map(row => mapZoomInfoCsvRowToContact(applyMapping(row, mapping))));
      } else {
        await processLeadBatch(batch.map(row => mapCsvRowToLead(applyMapping(row, mapping))));
      }
    },
    mapRow: row => resource === 'contacts' ? mapZoomInfoCsvRowToContact(applyMapping(row, mapping)) : mapCsvRowToLead(applyMapping(row, mapping)),
  });

  // CSV file change handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    PapaParsePreview(f);
  };

  // CSV preview logic
  const PapaParsePreview = (f: File) => {
    import('papaparse').then(Papa => {
      Papa.parse(f, {
        header: true,
        skipEmptyLines: true,
        complete: (results: any) => {
          setPreviewRows(results.data.slice(0, 10));
          setHeaders(results.meta.fields || []);
          // Auto-mapping
          const autoMap: Record<string, string> = {};
          ENTITY_FIELDS[resource].forEach(field => {
            const found = results.meta.fields.find((h: string) => h.toLowerCase().replace(/\s/g, '') === field.toLowerCase().replace(/_/g, ''));
            if (found) autoMap[field] = found;
          });
          setMapping(autoMap);
        },
      });
    });
  };

  // Mapping logic
  function applyMapping(row: any, mapping: Record<string, string>) {
    const mapped: any = {};
    Object.entries(mapping).forEach(([field, col]) => {
      mapped[field] = row[col];
    });
    return { ...row, ...mapped };
  }

  // Import start
  const startImport = () => {
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    setImportError(null);
    parseCsv(file);
  };

  // Importer state effect
  React.useEffect(() => {
    if (importer.state === 'complete') {
      setImporting(false);
      setImportResult({ imported: importer.importCount || 0, errors: importer.errorCount || 0 });
      setSnackbarOpen(true);
      refresh();
    } else if (importer.state === 'error') {
      setImporting(false);
      setImportError('Failed to import file. Please check your CSV.');
      setSnackbarOpen(true);
    }
  }, [importer.state, importer.importCount, importer.errorCount, refresh]);

  // Reset dialog state on close
  const handleClose = () => {
    setFile(null);
    setPreviewRows([]);
    setHeaders([]);
    setImporting(false);
    setImportResult(null);
    setImportError(null);
    setMapping({});
    setShowZoomInfoDialog(false);
    setZoomInfoPreview([]);
    setZoomInfoError(null);
    reset();
    onClose();
  };

  // Validation logic
  const missingRequired = useMemo(() => {
    if (!previewRows.length) return [];
    return REQUIRED_FIELDS[resource].filter(field =>
      previewRows.some(row => !row[mapping[field]] || row[mapping[field]].toString().trim() === '')
    );
  }, [previewRows, resource, mapping]);

  // ZoomInfo import logic
  const handleZoomInfoImport = async () => {
    setShowZoomInfoDialog(true);
    setZoomInfoPreview([]);
    setZoomInfoError(null);
    setZoomInfoLoading(false);
  };

  const fetchZoomInfo = async () => {
    setZoomInfoLoading(true);
    setZoomInfoError(null);
    setZoomInfoPreview([]);
    try {
      const endpoint = resource === 'contacts' ? '/functions/v1/import-zoominfo-contacts' : '/functions/v1/import-zoominfo-leads';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zoomInfoFilter),
      });
      const data = await res.json();
      if (!res.ok || !data || !Array.isArray(data[resource])) {
        throw new Error(data?.error || data?.message || 'Failed to import from ZoomInfo');
      }
      setZoomInfoPreview(data[resource].slice(0, 10));
    } catch (e: any) {
      setZoomInfoError(e.message);
    } finally {
      setZoomInfoLoading(false);
    }
  };

  const confirmZoomInfoImport = async () => {
    setImporting(true);
    setShowZoomInfoDialog(false);
    setImportResult(null);
    setImportError(null);
    try {
      const endpoint = resource === 'contacts' ? '/functions/v1/import-zoominfo-contacts' : '/functions/v1/import-zoominfo-leads';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zoomInfoFilter),
      });
      const data = await res.json();
      if (!res.ok || !data || !Array.isArray(data[resource])) {
        throw new Error(data?.error || data?.message || 'Failed to import from ZoomInfo');
      }
      if (resource === 'contacts') {
        await processContactBatch(data[resource]);
      } else {
        await processLeadBatch(data[resource]);
      }
      setImportResult({ imported: data[resource].length, errors: 0 });
      setSnackbarOpen(true);
      refresh();
    } catch (e: any) {
      setImportError(e.message);
      setSnackbarOpen(true);
    } finally {
      setImporting(false);
    }
  };

  // Mapping UI
  const mappingRow = (
    <TableRow>
      {ENTITY_FIELDS[resource].map(field => (
        <TableCell key={field} sx={{ background: '#f5f5f5', minWidth: 120 }}>
          <Autocomplete
            size="small"
            options={headers}
            value={mapping[field] || ''}
            onChange={(_, v) => setMapping(m => ({ ...m, [field]: v || '' }))}
            renderInput={params => <TextField {...params} label={FIELD_LABELS[field] || field} />}
            disableClearable
            isOptionEqualToValue={(option, value) => option === value}
          />
        </TableCell>
      ))}
    </TableRow>
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Import {resource === 'contacts' ? 'Contacts' : 'Leads'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant="outlined"
              component="label"
              disabled={importing}
            >
              Choose CSV File
              <input type="file" accept=".csv" hidden onChange={handleFileChange} />
            </Button>
            <Button
              variant="contained"
              color="info"
              href={SAMPLE_CSVS[resource]}
              download={resource === 'contacts' ? 'crm_contacts_sample.csv' : 'crm_leads_sample.csv'}
            >
              Download Sample CSV
            </Button>
            <Button variant="contained" color="secondary" onClick={handleZoomInfoImport} disabled={importing}>
              Import from ZoomInfo
            </Button>
          </Stack>
          {file && previewRows.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Preview (first 10 rows):</Typography>
              <Table size="small">
                <TableHead>
                  {mappingRow}
                  <TableRow>
                    {ENTITY_FIELDS[resource].map(field => (
                      <TableCell key={field}>{FIELD_LABELS[field] || field}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewRows.map((row, i) => (
                    <TableRow key={i}>
                      {ENTITY_FIELDS[resource].map(field => (
                        <TableCell key={field}>
                          {row[mapping[field]]}
                          {Array.isArray(REQUIRED_FIELDS[resource]) && REQUIRED_FIELDS[resource].includes(field) && (!row[mapping[field]] || row[mapping[field]].toString().trim() === '') && (
                            <Chip label="Required" color="error" size="small" sx={{ ml: 1 }} />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {missingRequired.length > 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Missing required fields: {missingRequired.map(f => FIELD_LABELS[f as keyof typeof FIELD_LABELS] || f).join(', ')}
                </Alert>
              )}
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={importing}>Cancel</Button>
        <Button
          onClick={startImport}
          variant="contained"
          disabled={importing || !file || missingRequired.length > 0}
        >
          {importing ? <CircularProgress size={20} /> : 'Import'}
        </Button>
      </DialogActions>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)}>
        {importResult ? (
          <Alert severity="success" onClose={() => setSnackbarOpen(false)}>
            Imported {importResult.imported} {resource}. {importResult.errors > 0 ? `${importResult.errors} errors.` : ''}
          </Alert>
        ) : importError ? (
          <Alert severity="error" onClose={() => setSnackbarOpen(false)}>
            {importError}
          </Alert>
        ) : undefined}
      </Snackbar>
      {/* ZoomInfo Filter Dialog */}
      <MuiDialog open={showZoomInfoDialog} onClose={() => setShowZoomInfoDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>ZoomInfo Filters</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Job Title" value={zoomInfoFilter.jobTitle} onChange={e => setZoomInfoFilter(f => ({ ...f, jobTitle: e.target.value }))} />
            <TextField label="State" value={zoomInfoFilter.state} onChange={e => setZoomInfoFilter(f => ({ ...f, state: e.target.value }))} />
            <TextField label="Industry" value={zoomInfoFilter.industry} onChange={e => setZoomInfoFilter(f => ({ ...f, industry: e.target.value }))} />
            <TextField label="Management Level" value={zoomInfoFilter.managementLevel} onChange={e => setZoomInfoFilter(f => ({ ...f, managementLevel: e.target.value }))} />
            <TextField label="Email Domain" value={zoomInfoFilter.emailDomain} onChange={e => setZoomInfoFilter(f => ({ ...f, emailDomain: e.target.value }))} />
            <Button variant="contained" onClick={fetchZoomInfo} disabled={zoomInfoLoading}>Preview from ZoomInfo</Button>
            {zoomInfoLoading && <CircularProgress size={24} sx={{ mt: 1 }} />}
            {zoomInfoError && <Alert severity="error">{zoomInfoError}</Alert>}
            {zoomInfoPreview.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Preview (first 10 rows):</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {ENTITY_FIELDS[resource].map(field => (
                        <TableCell key={field}>{FIELD_LABELS[field] || field}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {zoomInfoPreview.map((row, i) => (
                      <TableRow key={i}>
                        {ENTITY_FIELDS[resource].map(field => (
                          <TableCell key={field}>{row[field]}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={confirmZoomInfoImport}>
                  Import All
                </Button>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowZoomInfoDialog(false)}>Close</Button>
        </DialogActions>
      </MuiDialog>
    </Dialog>
  );
}; 