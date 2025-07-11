import React, { useCallback, useRef, useState } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';

export interface UploadStepProps {
  file: File | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement> | File) => void;
  onNext?: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

const UploadStep: React.FC<UploadStepProps> = ({ file, onFileChange, onNext, fileInputRef }) => {
  const [dragActive, setDragActive] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

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
        onFileChange(droppedFile);
      } else {
        alert('Please upload a CSV file.');
      }
    }
  }, [onFileChange]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileChange(e);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Paper
        ref={dropRef}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        sx={{
          border: dragActive ? '2px solid #1976d2' : '2px dashed #90caf9',
          background: dragActive ? '#e3f2fd' : '#f5fafd',
          p: 3,
          textAlign: 'center',
          transition: 'border 0.2s, background 0.2s',
          cursor: 'pointer',
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <Typography variant="body1" sx={{ mb: 1 }}>
          Drag and drop your CSV file here, or <span style={{ color: '#1976d2', textDecoration: 'underline' }}>click to select</span>
        </Typography>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
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
      {onNext && file && (
        <Button variant="contained" sx={{ mt: 2 }} onClick={onNext}>Next</Button>
      )}
    </Box>
  );
};

export default UploadStep; 