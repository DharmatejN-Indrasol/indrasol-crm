import React, { useState, ChangeEvent } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, TextField as MuiTextField } from '@mui/material';
import { useNotify } from 'react-admin';

interface ColdEmailModalProps {
  open: boolean;
  onClose: () => void;
  recipient: any; // Contact or Company
}

export function ColdEmailModal({ open, onClose, recipient }: ColdEmailModalProps) {
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ subject: string; body: string } | null>(null);
  const [error, setError] = useState('');
  const notify = useNotify();

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      // Determine recipient info
      let name = recipient.name || (recipient.first_name + ' ' + recipient.last_name);
      let email = recipient.email || recipient.email_jsonb?.[0]?.email || '';
      if (!name && recipient.company_name) name = recipient.company_name;
      const res = await fetch('/functions/v1/generate-cold-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: { name, email }, prompt }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult({ subject: data.subject, body: data.body });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(`Subject: ${result.subject}\n\n${result.body}`);
      notify('Email copied to clipboard!', { type: 'success' });
    }
  };

  const handleSend = () => {
    if (result) {
      const mailto = `mailto:${recipient.email || ''}?subject=${encodeURIComponent(result.subject)}&body=${encodeURIComponent(result.body)}`;
      window.open(mailto, '_blank');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth aria-labelledby="cold-email-dialog-title">
      <DialogTitle id="cold-email-dialog-title">Generate Cold Email</DialogTitle>
      <DialogContent sx={{ pb: 1.5 }}>
        <MuiTextField
          label="Prompt (optional)"
          fullWidth
          value={prompt || ''}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPrompt(e.target.value)}
          margin="normal"
          placeholder="E.g. Make it more friendly, mention our new feature, etc."
        />
        {loading && <Typography>Generating...</Typography>}
        {error && <Typography color="error">{error}</Typography>}
        {result && (
          <Box mt={2}>
            <Typography variant="subtitle2">Subject:</Typography>
            <Typography>{result.subject}</Typography>
            <Typography variant="subtitle2" mt={2}>Body:</Typography>
            <Typography whiteSpace="pre-line">{result.body}</Typography>
          </Box>
        )}
      </DialogContent>
      <Box sx={{ borderTop: '1px solid #e0e7ef', px: 2, py: 1.5, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Button onClick={onClose}>Close</Button>
        <Button onClick={handleGenerate} variant="contained" disabled={loading}>Generate</Button>
        {result && <Button onClick={handleCopy}>Copy</Button>}
        {result && <Button onClick={handleSend} color="secondary">Send</Button>}
      </Box>
    </Dialog>
  );
} 