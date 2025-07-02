import React from 'react';
import { Box, Button, Typography } from '@mui/material';

export interface UploadStepProps {
  file: File | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNext: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

const UploadStep: React.FC<UploadStepProps> = ({ file, onFileChange, onNext, fileInputRef }) => (
  <Box sx={{ mt: 2 }}>
    <Button variant="outlined" onClick={() => fileInputRef.current?.click()} sx={{ mr: 2 }}>
      Choose CSV File
    </Button>
    <input
      ref={fileInputRef}
      type="file"
      accept=".csv"
      style={{ display: 'none' }}
      onChange={onFileChange}
    />
    {file && <Typography variant="body2" sx={{ mt: 1 }}>{file.name}</Typography>}
    <Box sx={{ mt: 2 }}>
      <Button variant="contained" onClick={onNext} disabled={!file}>
        Next
      </Button>
    </Box>
  </Box>
);

export default UploadStep; 