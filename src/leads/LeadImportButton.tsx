import React, { useState, ForwardedRef } from 'react';
import { Button } from 'react-admin';
import UploadIcon from '@mui/icons-material/Upload';
import LeadImportDialog from './LeadImportDialog';

const LeadImportButton = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(
  (props, ref: ForwardedRef<HTMLButtonElement>) => {
    const [modalOpen, setModalOpen] = useState(false);
    return (
      <>
        <Button
          startIcon={<UploadIcon />}
          label="Import"
          onClick={() => setModalOpen(true)}
          ref={ref}
          {...props}
        />
        <LeadImportDialog open={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }
);

export default LeadImportButton; 