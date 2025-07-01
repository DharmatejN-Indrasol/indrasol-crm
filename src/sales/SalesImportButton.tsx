import { useState } from 'react';
import UploadIcon from '@mui/icons-material/Upload';
import { Button } from 'react-admin';
import { SalesImportDialog } from './SalesImportDialog';

export const SalesImportButton = () => {
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
            <SalesImportDialog open={modalOpen} onClose={handleCloseModal} />
        </>
    );
}; 