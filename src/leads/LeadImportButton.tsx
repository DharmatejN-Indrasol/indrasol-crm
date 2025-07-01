import { useState } from 'react';
import { Button } from 'react-admin';
import UploadIcon from '@mui/icons-material/Upload';
import { UnifiedImportDialog } from '../misc/UnifiedImportDialog';

const LeadImportButton = ({ importBtnRef }: { importBtnRef?: React.RefObject<HTMLButtonElement | null> }) => {
    const [modalOpen, setModalOpen] = useState(false);
    return (
        <>
            <Button
                startIcon={<UploadIcon />}
                label="Import"
                onClick={() => setModalOpen(true)}
                ref={importBtnRef}
            />
            <UnifiedImportDialog open={modalOpen} onClose={() => setModalOpen(false)} defaultResource="leads" />
        </>
    );
};

export default LeadImportButton; 