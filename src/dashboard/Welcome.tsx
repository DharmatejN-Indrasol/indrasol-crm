import React, { useEffect, useState } from 'react';
import { Card, CardContent, Link, Typography, Dialog, DialogTitle, DialogContent, Box, Button } from '@mui/material';

const WELCOME_KEY = 'crm_onboarding_welcome_dismissed';

export const Welcome = () => (
    <Card
        sx={{
            background: `#c5dedd`,
            color: 'rgba(0, 0, 0, 0.87)',
            boxShadow: 2,
            borderRadius: 3,
            '&:hover': { boxShadow: 4 },
        }}
    >
        <CardContent>
            <Typography variant="h6" gutterBottom>
                Your CRM Starter Kit
            </Typography>
            <Typography variant="body2" gutterBottom>
                <Link href="https://Indrasollab.com/indrasol-crm">Indrasol CRM</Link>{' '}
                is a template designed to help you quickly build your own CRM.
            </Typography>
            <Typography variant="body2" gutterBottom>
                This demo runs on a mock API, so you can explore and modify the
                data. It resets on reload. The full version uses Supabase for
                the backend.
            </Typography>
            <Typography variant="body2">
                Powered by{' '}
                <Link href="https://Indrasollab.com/react-admin">react-admin</Link>
                , Indrasol CRM is fully open-source. You can find the code at{' '}
                <Link href="https://github.com/Indrasollab/indrasol-crm">
                    Indrasollab/indrasol-crm
                </Link>
                .
            </Typography>
        </CardContent>
    </Card>
);

export const WelcomeModal = ({ open, onClose, onTour }: { open: boolean; onClose: () => void; onTour: () => void }) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth aria-labelledby="welcome-dialog-title">
    <DialogTitle id="welcome-dialog-title" sx={{ textAlign: 'center', fontWeight: 700, fontSize: '1.5rem', pb: 0 }}>
      Welcome to Indrasol CRM!
    </DialogTitle>
    <DialogContent sx={{ textAlign: 'center', pt: 2, pb: 1.5 }}>
      <Box mb={2}>
        <Typography variant="body1" sx={{ mb: 1 }}>
          Your all-in-one platform for managing contacts, deals, tasks, and more.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Get started by importing your contacts, creating your first deal, or exploring the dashboard.
        </Typography>
      </Box>
      <Box display="flex" gap={2} justifyContent="center" mt={2}>
        <Button variant="outlined" onClick={onTour}>Take a Tour</Button>
        <Button variant="contained" onClick={onClose}>Get Started</Button>
      </Box>
    </DialogContent>
  </Dialog>
);

export const useWelcomeModal = () => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem(WELCOME_KEY)) {
      setOpen(true);
    }
  }, []);
  const handleClose = () => {
    localStorage.setItem(WELCOME_KEY, '1');
    setOpen(false);
  };
  const handleTour = () => {
    localStorage.setItem(WELCOME_KEY, '1');
    setOpen(false);
    // Optionally trigger tour logic here
  };
  return { open, handleClose, handleTour };
};
