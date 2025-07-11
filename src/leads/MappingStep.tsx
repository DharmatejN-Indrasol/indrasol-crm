import React from 'react';
import { Box, Button, Typography, Tooltip, Alert } from '@mui/material';
import { PREVIEW_FIELDS, REQUIRED_FIELDS } from './useLeadImport';

const statusChoices = [
  { id: 'New', name: 'New' },
  { id: 'Contacted', name: 'Contacted' },
  { id: 'Qualified', name: 'Qualified' },
  { id: 'Disqualified', name: 'Disqualified' },
  { id: 'Converted', name: 'Converted' },
];

export interface MappingStepProps {
  mappingStep: boolean;
  headers: string[];
  mapping: Record<string, string>;
  setMapping: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onContinue: () => void;
}

const MappingStep: React.FC<MappingStepProps> = ({ mappingStep, headers, mapping, setMapping, onContinue }) => {
  // Set default mapping for required fields if not already set
  React.useEffect(() => {
    if (headers.length > 0 && mappingStep) {
      setMapping(prev => {
        const next = { ...prev };
        REQUIRED_FIELDS.forEach(field => {
          if (!next[field]) {
            // For status, do not auto-map unless header matches
            if (field === 'status') {
              const found = headers.find(h => h.toLowerCase().includes('status'));
              if (found) next[field] = found;
            } else {
              // For other required fields, pick the first header that includes the field name
              const found = headers.find(h => h.toLowerCase().includes(field.replace(/_/g, ' ')));
              if (found) next[field] = found;
            }
          }
        });
        return next;
      });
    }
  }, [headers, mappingStep, setMapping]);

  const missingRequired = REQUIRED_FIELDS.filter(field => !mapping[field]);
  const allMapped = missingRequired.length === 0;

  return (
    <Box sx={{ mt: 2 }}>
      {headers.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Map CSV columns to internal fields:</Typography>
          {PREVIEW_FIELDS.map(field => {
            const isRequired = REQUIRED_FIELDS.includes(field);
            const isMissing = isRequired && !mapping[field];
            return (
              <Box key={field} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ minWidth: 180 }}>
                  {field.replace(/_/g, ' ')}
                  {isRequired && <span style={{ color: 'red', marginLeft: 4 }} title="Required">*</span>}
                </Typography>
                <select
                  value={mapping[field] || ''}
                  onChange={e => setMapping(m => ({ ...m, [field]: e.target.value }))}
                  style={{ minWidth: 200, borderColor: isMissing ? 'red' : isRequired ? '#1976d2' : undefined, background: isMissing ? '#fff3f3' : undefined }}
                >
                  <option value=''>-- None --</option>
                  {headers.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                {isMissing && (
                  <span style={{ color: 'red', marginLeft: 8, fontSize: 12 }}>Required</span>
                )}
                {/* Show status options for reference if mapping status */}
                {field === 'status' && (
                  <Tooltip title="Valid status values: New, Contacted, Qualified, Disqualified, Converted">
                    <span style={{ marginLeft: 12, color: '#1976d2', fontSize: 13 }}>
                      (Valid: {statusChoices.map(s => s.name).join(', ')})
                    </span>
                  </Tooltip>
                )}
              </Box>
            );
          })}
          <Box sx={{ mt: 2 }}>
            {!allMapped && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Please map all required fields before continuing. Missing: {missingRequired.map(f => f.replace(/_/g, ' ')).join(', ')}
              </Alert>
            )}
            <Button variant="contained" color="primary" onClick={onContinue} disabled={!allMapped}>
              Continue
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default MappingStep; 