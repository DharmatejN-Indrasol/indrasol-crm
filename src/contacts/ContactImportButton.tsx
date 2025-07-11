import { useState } from 'react';
import UploadIcon from '@mui/icons-material/Upload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { Button, useGetIdentity, useRefresh } from 'react-admin';
import { ContactImportDialog } from './ContactImportDialog';
import { fetchWithTimeout } from '../misc/fetchWithTimeout';
import { Alert, Snackbar, Backdrop, CircularProgress, Dialog, DialogTitle, DialogContent, TextField, Stack, Autocomplete, Chip, Box, Typography } from '@mui/material';
import { useContactImport } from './useContactImport';
import { UnifiedImportDialog } from '../misc/UnifiedImportDialog';
import React from 'react';

const industries = ['Software', 'Finance', 'Healthcare', 'Manufacturing', 'Retail', 'Education', 'Other'];
const managementLevels = ['C-Level', 'VP', 'Director', 'Manager', 'Staff', 'Other'];

function getFriendlyErrorMessage(error: string | null): string | null {
    if (!error) return null;
    const lower = error.toLowerCase();
    if (typeof lower === 'string' && lower.includes('quota')) return 'Your ZoomInfo API quota has been exceeded. Please contact your administrator or ZoomInfo support.';
    if (typeof lower === 'string' && (lower.includes('invalid credentials') || lower.includes('unauthorized'))) return 'Invalid ZoomInfo API credentials. Please check your API key and secret.';
    if (typeof lower === 'string' && lower.includes('timeout')) return 'The request to ZoomInfo timed out. Please try again later.';
    return error;
}

function FilterSummary({ filters }: { filters: Record<string, any> }) {
    const entries = Object.entries(filters).filter(([_, v]) => v);
    if (entries.length === 0) return null;
    return (
        <Box sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">Active Filters:</Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                {entries.map(([key, value]) => (
                    <Chip key={key} label={`${key}: ${value}`} size="small" />
                ))}
            </Stack>
        </Box>
    );
}

function ZoomInfoContactFilterDialog({ open, onClose, onApply, initialFilters }: {
    open: boolean;
    onClose: () => void;
    onApply: (filters: Record<string, any>) => void;
    initialFilters: Record<string, any>;
}) {
    const [jobTitle, setJobTitle] = useState(initialFilters.jobTitle || '');
    const [state, setState] = useState(initialFilters.state || '');
    const [industry, setIndustry] = useState(initialFilters.industry || '');
    const [managementLevel, setManagementLevel] = useState(initialFilters.managementLevel || '');
    const [emailDomain, setEmailDomain] = useState(initialFilters.emailDomain || '');
    const handleApply = () => {
        onApply({ jobTitle, state, industry, managementLevel, emailDomain });
        onClose();
    };
    const handleClear = () => {
        setJobTitle(''); setState(''); setIndustry(''); setManagementLevel(''); setEmailDomain('');
    };
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Filter ZoomInfo Contacts</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1, minWidth: 320 }}>
                    <TextField label="Job Title" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
                    <TextField label="State" value={state} onChange={e => setState(e.target.value)} />
                    <Autocomplete
                        options={industries}
                        value={industry}
                        onChange={(_, v) => setIndustry(v || '')}
                        renderInput={params => <TextField {...params} label="Industry" />}
                        freeSolo
                    />
                    <Autocomplete
                        options={managementLevels}
                        value={managementLevel}
                        onChange={(_, v) => setManagementLevel(v || '')}
                        renderInput={params => <TextField {...params} label="Management Level" />}
                        freeSolo
                    />
                    <TextField label="Email Domain" value={emailDomain} onChange={e => setEmailDomain(e.target.value)} />
                    <Stack direction="row" spacing={2}>
                        <Button variant="contained" onClick={handleApply}><span>Apply Filters & Import</span></Button>
                        <Button variant="outlined" onClick={handleClear}><span>Clear All</span></Button>
                    </Stack>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}

export const ContactImportButton = React.forwardRef<HTMLButtonElement, { importBtnRef?: React.RefObject<HTMLButtonElement | null> }>((props, ref) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ imported: number; errors: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [filterDialogOpen, setFilterDialogOpen] = useState(false);
    const [filters, setFilters] = useState({ jobTitle: '', state: '', industry: '', managementLevel: '', emailDomain: '' });
    const { identity } = useGetIdentity();
    const refresh = useRefresh();
    const processBatch = useContactImport();

    const handleOpenModal = () => {
        setModalOpen(true);
    };
    const handleCloseModal = () => {
        setModalOpen(false);
    };

    const handleZoomInfoImportWithFilters = async (newFilters: Record<string, any>) => {
        setFilters(newFilters as any);
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const res = await fetchWithTimeout('/functions/v1/import-zoominfo-contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newFilters),
                timeout: 20000,
            });
            let data;
            try {
                data = await res.json();
            } catch (e) {
                throw new Error('Failed to parse server response');
            }
            if (!res.ok) {
                setError(data?.error || data?.message || 'Failed to import from ZoomInfo');
            } else if (data.contacts && Array.isArray(data.contacts)) {
                await processBatch(data.contacts);
                setResult({ imported: data.contacts.length, errors: 0 });
                refresh();
            } else {
                setError('No contacts returned from ZoomInfo.');
            }
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setLoading(false);
            setSnackbarOpen(true);
        }
    };

    // Only show the ZoomInfo import button to admins
    const isAdmin = identity && (identity as any).administrator;

    return (
        <>
            <Button
                startIcon={<UploadIcon />}
                label="Import"
                onClick={() => setModalOpen(true)}
                ref={ref}
            />
            {isAdmin && (
                <>
                    <FilterSummary filters={filters} />
                    <Button
                        startIcon={<CloudDownloadIcon />}
                        label={loading ? 'Importing from ZoomInfo...' : 'Import from ZoomInfo'}
                        onClick={() => setFilterDialogOpen(true)}
                        disabled={loading}
                        color="info"
                    />
                    <Button
                        startIcon={<FilterAltIcon />}
                        label="ZoomInfo Filters"
                        onClick={() => setFilterDialogOpen(true)}
                        disabled={loading}
                        color="secondary"
                    />
                    <ZoomInfoContactFilterDialog
                        open={filterDialogOpen}
                        onClose={() => setFilterDialogOpen(false)}
                        onApply={handleZoomInfoImportWithFilters}
                        initialFilters={filters}
                    />
                </>
            )}
            <UnifiedImportDialog open={modalOpen} onClose={handleCloseModal} defaultResource="contacts" />
            {((result || error) && (
                <Snackbar open={snackbarOpen} onClose={() => setSnackbarOpen(false)}>
                    {result ? (
                        <Alert severity="success" onClose={() => setSnackbarOpen(false)}>
                            Imported {result.imported} contacts from ZoomInfo. {result.errors > 0 ? `${result.errors} errors.` : ''}
                        </Alert>
                    ) : error ? (
                        <Alert severity="error" onClose={() => setSnackbarOpen(false)}>
                            {getFriendlyErrorMessage(error)}
                        </Alert>
                    ) : undefined}
                </Snackbar>
            ))}
            <Backdrop open={loading} sx={{ zIndex: 2000, color: '#fff' }}>
                <CircularProgress color="inherit" />
            </Backdrop>
        </>
    );
});
