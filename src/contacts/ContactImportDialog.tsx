import { Box, CircularProgress, Stack, Typography, Paper } from '@mui/material';
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
import { ContactImportSchema, useContactImport } from './useContactImport';

import { MouseEvent, useEffect, useState, useCallback, useRef } from 'react';
import * as sampleCsv from './contacts_export.csv?raw';
import { mapZoomInfoCsvRowToContact } from './mapCsvRowToContact';

const SAMPLE_URL = `data:text/csv;name=crm_contacts_sample.csv;charset=utf-8,${encodeURIComponent(sampleCsv.default)}`;

type ContactImportModalProps = {
    open: boolean;
    onClose(): void;
};

export function ContactImportDialog({
    open,
    onClose,
}: ContactImportModalProps) {
    const refresh = useRefresh();
    const processBatch = useContactImport();
    const { importer, parseCsv, reset } = usePapaParse<ContactImportSchema>({
        batchSize: 10,
        processBatch,
        mapRow: mapZoomInfoCsvRowToContact,
    });

    const [file, setFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (importer.state === 'complete') {
            refresh();
        }
    }, [importer.state, refresh]);

    const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv')) {
                setFile(droppedFile);
            } else {
                alert('Please upload a CSV file.');
            }
        }
    }, []);

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
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

    return (
        <Dialog open={open} maxWidth="md" fullWidth aria-labelledby="contact-import-dialog-title">
            <DialogCloseButton onClose={handleClose} />
            <DialogTitle id="contact-import-dialog-title">Import</DialogTitle>
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
                                    The import is running, please do not close
                                    this tab.
                                </Alert>
                                <Typography variant="body2">
                                    Imported{' '}
                                    <strong>
                                        {importer.importCount} /{' '}
                                        {importer.rowCount}
                                    </strong>{' '}
                                    contacts, with{' '}
                                    <strong>{importer.errorCount}</strong>{' '}
                                    errors.
                                    {importer.remainingTime !== null && (
                                        <>
                                            {' '}
                                            Estimated remaining time:{' '}
                                            <strong>
                                                {millisecondsToTime(
                                                    importer.remainingTime
                                                )}
                                            </strong>
                                            .{' '}
                                            <MuiLink
                                                href="#"
                                                onClick={handleReset}
                                                color="error"
                                            >
                                                Stop import
                                            </MuiLink>
                                        </>
                                    )}
                                </Typography>
                            </Stack>
                        )}

                        {importer.state === 'error' && (
                            <Alert severity="error">
                                Failed to import this file, please make sure
                                your provided a valid CSV file.
                            </Alert>
                        )}

                        {importer.state === 'complete' && (
                            <Alert severity="success">
                                Contacts import complete. Imported{' '}
                                {importer.importCount} contacts, with{' '}
                                {importer.errorCount} errors
                            </Alert>
                        )}

                        {importer.state === 'idle' && (
                            <>
                                <Alert
                                    severity="info"
                                    action={
                                        <Button
                                            component={Link}
                                            label="Download CSV sample"
                                            color="info"
                                            to={SAMPLE_URL}
                                            download={'crm_contacts_sample.csv'}
                                        />
                                    }
                                >
                                    Here is a sample CSV file you can use as a
                                    template
                                </Alert>

                                {/* Drag-and-drop upload area (same as leads) */}
                                <Paper
                                    onDragEnter={handleDrag}
                                    onDragOver={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDrop={handleDrop}
                                    sx={{
                                        border: dragActive ? '2px solid #1976d2' : '2px dashed #90caf9',
                                        background: '#f5fafd',
                                        p: 3,
                                        textAlign: 'center',
                                        transition: 'border 0.2s, background 0.2s',
                                        cursor: 'pointer',
                                        borderRadius: 2,
                                        mb: 2,
                                    }}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Typography variant="body1" sx={{ mb: 1 }}>
                                        Drag and drop your CSV file here, or{' '}
                                        <a
                                            href="#"
                                            style={{ color: '#1976d2', textDecoration: 'underline', cursor: 'pointer' }}
                                            onClick={e => {
                                                e.preventDefault();
                                                fileInputRef.current?.click();
                                            }}
                                        >
                                            click to select
                                        </a>
                                    </Typography>
                                    <input
                                        ref={fileInputRef}
                                        id="contact-csv-input"
                                        type="file"
                                        accept=".csv,text/csv"
                                        style={{ display: 'none' }}
                                        onChange={handleFileInputChange}
                                    />
                                    {file ? (
                                        <Box sx={{ mt: 2, textAlign: 'left', display: 'inline-block', background: '#f1f8e9', p: 2, borderRadius: 2 }}>
                                            <Typography variant="body2"><b>File:</b> {file.name}</Typography>
                                            <Typography variant="body2"><b>Size:</b> {(file.size / 1024).toFixed(2)} KB</Typography>
                                            <Typography variant="body2"><b>Type:</b> {file.type || 'N/A'}</Typography>
                                            <Typography variant="body2"><b>Last Modified:</b> {file.lastModified ? new Date(file.lastModified).toLocaleString() : 'N/A'}</Typography>
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" sx={{ mt: 1, color: '#888' }}>No file selected</Typography>
                                    )}
                                </Paper>
                            </>
                        )}
                    </Stack>
                </Form>
            </DialogContent>
            <Box sx={{ borderTop: '1px solid #e0e7ef', px: 2, py: 1.5, display: 'flex', gap: 1, justifyContent: 'flex-start' }}>
                <Toolbar sx={{ width: '100%' }}>
                    {importer.state === 'idle' ? (
                        <Button
                            label="Import"
                            variant="contained"
                            onClick={startImport}
                            disabled={!file}
                        />
                    ) : (
                        <Button
                            label="Close"
                            onClick={handleClose}
                            disabled={importer.state === 'running'}
                        />
                    )}
                </Toolbar>
            </Box>
        </Dialog>
    );
}

function millisecondsToTime(ms: number | undefined) {

    if (ms) {
        var seconds = Math.floor((ms / 1000) % 60);
        var minutes = Math.floor((ms / (60 * 1000)) % 60);

        return `${minutes}m ${seconds}s`;
    }
}
