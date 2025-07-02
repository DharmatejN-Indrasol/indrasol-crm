import { useState } from 'react';
import { Button } from 'react-admin';
import UploadIcon from '@mui/icons-material/Upload';
import LeadImportDialog from './LeadImportDialog';

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
            <LeadImportDialog open={modalOpen} onClose={() => setModalOpen(false)} />
        </>
    );
};

export default LeadImportButton; 