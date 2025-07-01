import { useState } from 'react';
import UploadIcon from '@mui/icons-material/Upload';
import { Button } from 'react-admin';
import { DealImportDialog } from './DealImportDialog';

export const DealImportButton = () => {
    const [modalOpen, setModalOpen] = useState(false);

    const handleOpenModal = () => {
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
    };

    return (
        <>
            <Button
                startIcon={<UploadIcon />}
                label="Import"
                onClick={handleOpenModal}
            />
            <DealImportDialog open={modalOpen} onClose={handleCloseModal} />
        </>
    );
}; 