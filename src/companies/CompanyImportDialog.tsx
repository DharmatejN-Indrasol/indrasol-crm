import { Box, CircularProgress, Stack, Typography } from '@mui/material';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MuiLink from '@mui/material/Link';
import {
    Button,
    FileField,
    FileInput,
    Form,
    Toolbar,
    useRefresh,
} from 'react-admin';
import { Link } from 'react-router-dom';
import { DialogCloseButton } from '../misc/DialogCloseButton';
import { usePapaParse } from '../misc/usePapaParse';
import { CompanyImportSchema, useCompanyImport } from './useCompanyImport';
import { MouseEvent, useEffect, useState } from 'react';
// TODO: Replace with actual sample CSV for companies
const SAMPLE_URL = '/companies_sample.csv';

type CompanyImportModalProps = {
    open: boolean;
    onClose(): void;
};

export function CompanyImportDialog({
    open,
    onClose,
}: CompanyImportModalProps) {
    const refresh = useRefresh();
    const processBatch = useCompanyImport();
    const { importer, parseCsv, reset } = usePapaParse<CompanyImportSchema>({
        batchSize: 10,
        processBatch,
    });
    const [file, setFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    useEffect(() => {
        if (importer.state === 'complete') {
            refresh();
        }
    }, [importer.state, refresh]);
    const handleFileChange = (file: File | null) => {
        setFile(file);
    };
    const startImport = () => {
        if (!file) return;
        parseCsv(file);
    };
    const handleClose = () => {
        reset();
        onClose();
    };
    const handleReset = (e: MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        reset();
    };
    const handleDragEnter = () => setIsDragOver(true);
    const handleDragLeave = () => setIsDragOver(false);
    const handleDrop = () => setIsDragOver(false);
    return (
        <Dialog open={open} maxWidth="md" fullWidth aria-labelledby="company-import-dialog-title">
            <DialogCloseButton onClose={handleClose} />
            <DialogTitle id="company-import-dialog-title">Import</DialogTitle>
            <DialogContent sx={{ pb: 1.5 }}>
                <Form>
                    <Stack spacing={2}>
                        {importer.state === 'running' && (
                            <Stack gap={2}>
                                <Alert
                                    severity="info"
                                    action={
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                height: '100%',
                                                alignItems: 'center',
                                                padding: '0',
                                            }}
                                        >
                                            <CircularProgress size={20} />
                                        </Box>
                                    }
                                    sx={{
                                        alignItems: 'center',
                                        '& .MuiAlert-action': {
                                            padding: 0,
                                            marginRight: 0,
                                        },
                                    }}
                                >
                                    The import is running, please do not close this tab.
                                </Alert>
                                <Typography variant="body2">
                                    Imported <strong>{importer.importCount} / {importer.rowCount}</strong> companies, with <strong>{importer.errorCount}</strong> errors.
                                    {importer.remainingTime !== null && (
                                        <>
                                            {' '}Estimated remaining time: <strong>{millisecondsToTime(importer.remainingTime ?? 0)}</strong>.
                                            {' '}
                                            <MuiLink href="#" onClick={handleReset} color="error">Stop import</MuiLink>
                                        </>
                                    )}
                                </Typography>
                            </Stack>
                        )}
                        {importer.state === 'error' && (
                            <Alert severity="error">Failed to import this file, please make sure your provided a valid CSV file.</Alert>
                        )}
                        {importer.state === 'complete' && (
                            <Alert severity="success">Companies import complete. Imported {importer.importCount} companies, with {importer.errorCount} errors</Alert>
                        )}
                        {importer.state === 'idle' && (
                            <>
                                <Alert
                                    severity="info"
                                    action={
                                        <a
                                            href={SAMPLE_URL}
                                            download="crm_companies_sample.csv"
                                            style={{ textDecoration: 'none' }}
                                        >
                                            <Button
                                                color="info"
                                                variant="contained"
                                                size="small"
                                            >
                                                Download CSV sample
                                            </Button>
                                        </a>
                                    }
                                >
                                    Here is a sample CSV file you can use as a template
                                </Alert>
                                <Box
                                    onDragEnter={handleDragEnter}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    sx={{
                                        border: isDragOver ? '2px solid #1976d2' : '2px dashed #ccc',
                                        background: isDragOver ? '#e3f2fd' : 'transparent',
                                        borderRadius: 2,
                                        p: 2,
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <FileInput
                                        source="csv"
                                        label="CSV File"
                                        accept={{ 'text/csv': ['.csv'] }}
                                        onChange={handleFileChange}
                                    >
                                        <FileField source="src" title="title" />
                                    </FileInput>
                                </Box>
                            </>
                        )}
                    </Stack>
                </Form>
            </DialogContent>
            <Box sx={{ borderTop: '1px solid #e0e7ef', px: 2, py: 1.5, display: 'flex', gap: 1, justifyContent: 'flex-start' }}>
                <Toolbar sx={{ width: '100%' }}>
                    {importer.state === 'idle' ? (
                        <Button label="Import" variant="contained" onClick={startImport} disabled={!file} />
                    ) : (
                        <Button label="Close" onClick={handleClose} disabled={importer.state === 'running'} />
                    )}
                </Toolbar>
            </Box>
        </Dialog>
    );
}

function millisecondsToTime(ms: number) {
    var seconds = Math.floor((ms / 1000) % 60);
    var minutes = Math.floor((ms / (60 * 1000)) % 60);
    return `${minutes}m ${seconds}s`;
} 