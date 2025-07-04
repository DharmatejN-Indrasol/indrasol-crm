import React from 'react';
import { Box, Button, LinearProgress, Typography, Table, TableHead, TableBody, TableRow, TableCell, TextField, Checkbox, Tooltip, Alert, Paper, Divider, Card } from '@mui/material';
import { CheckCircle, Warning, ListAlt } from '@mui/icons-material';

interface PreviewStepProps {
  importErrorMsg: string | null;
  importSuccess: boolean;
  showPreview: boolean;
  isPageLoading: boolean;
  previewRowsToShow: any[];
  pagedRows: any[];
  selectedRows: Set<number>;
  page: number;
  rowsPerPage: number;
  pageCount: number;
  allFields: string[];
  handleShowOnlySelected: () => void;
  showOnlySelected: boolean;
  getCurrentPageIndices: () => number[];
  handleSelectAllPage: (checked: boolean) => void;
  handleSelectRow: (globalIdx: number, checked: boolean) => void;
  handleCellChange: (rowIdx: number, field: string, value: string) => void;
  REQUIRED_FIELDS: string[];
  CONTACT_FIELDS: string[];
  setPage: (page: number) => void;
  setRowsPerPage: (rows: number) => void;
  importAccess: boolean;
  openConfirm: (type: 'all' | 'page' | 'selected') => void;
  importing: boolean;
  missingRequiredRows: number[];
  handleImportAll: () => void;
  handleImportPage: () => void;
  handleImportSelected: () => void;
  confirmOpen: boolean;
  closeConfirm: () => void;
  confirmType: 'all' | 'page' | 'selected' | null;
  totalRows: number;
  handleConfirmImport: () => void;
  importResult: any;
  importError: string | null;
  setActiveStep: (step: number | ((s: number) => number)) => void;
  onClearAllSelections: () => void;
}

function hasMissingRequired(row: Record<string, any>, REQUIRED_FIELDS: string[], CONTACT_FIELDS: string[]) {
    // All required fields must be present and non-empty
    const missingBasic = REQUIRED_FIELDS.some(field => !row[field] || row[field].toString().trim() === '');
    // At least one communication channel must be present and non-empty
    const hasContact = CONTACT_FIELDS.some(field => row[field] && row[field].toString().trim() !== '');
    return missingBasic || !hasContact;
}

const PreviewStep: React.FC<PreviewStepProps> = ({
  importErrorMsg,
  importSuccess,
  showPreview,
  isPageLoading,
  previewRowsToShow,
  pagedRows,
  selectedRows,
  page,
  rowsPerPage,
  pageCount,
  allFields,
  handleShowOnlySelected,
  showOnlySelected,
  getCurrentPageIndices,
  handleSelectAllPage,
  handleSelectRow,
  handleCellChange,
  REQUIRED_FIELDS,
  CONTACT_FIELDS,
  setPage,
  setRowsPerPage,
  importAccess,
  openConfirm,
  importing,
  missingRequiredRows,
  handleImportAll,
  handleImportPage,
  handleImportSelected,
  confirmOpen,
  closeConfirm,
  confirmType,
  totalRows,
  handleConfirmImport,
  importResult,
  importError,
  setActiveStep,
  onClearAllSelections
}) => (
  <Box sx={{ mt: 2 }}>
    {/* Prominent error/success messages */}
    {importErrorMsg && (
      <Alert severity="error" sx={{ mb: 2, fontWeight: 'bold', fontSize: 16 }} icon={<Warning />}>
        {importErrorMsg}
      </Alert>
    )}
    {importSuccess && (
      <Alert severity="success" sx={{ mb: 2, fontWeight: 'bold', fontSize: 16 }} icon={<CheckCircle />}>
        Import successful!
      </Alert>
    )}
    <Card elevation={2} sx={{ p: 2, background: '#f9fbfd', mb: 2 }}>
      {/* Summary and filter */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'space-between' }}>
        <Typography variant="body2">
          Showing {previewRowsToShow.length} of {pagedRows.length} rows on this page. Selected: {Array.from(selectedRows).filter(idx => idx >= page * rowsPerPage && idx < (page + 1) * rowsPerPage).length}
        </Typography>
        <Tooltip title="Show only the rows you have selected for import or editing.">
          <Button onClick={handleShowOnlySelected} size="small" variant={showOnlySelected ? 'contained' : 'outlined'} color="secondary" startIcon={<ListAlt />}>
            {showOnlySelected ? 'Show All Rows' : 'Show Only Selected'}
          </Button>
        </Tooltip>
      </Box>
      <Divider sx={{ mb: 2 }} />
      <Paper elevation={0} sx={{ maxHeight: 500, overflow: 'auto', border: 'none', background: '#fff' }}>
        <Table size="small" sx={{ minWidth: Math.max(900, allFields.length * 120) }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={getCurrentPageIndices().every(idx => selectedRows.has(idx)) && getCurrentPageIndices().length > 0}
                  indeterminate={getCurrentPageIndices().some(idx => selectedRows.has(idx)) && !getCurrentPageIndices().every(idx => selectedRows.has(idx))}
                  onChange={e => handleSelectAllPage(e.target.checked)}
                  inputProps={{ 'aria-label': 'select all rows' }}
                />
              </TableCell>
              {allFields.map((field) => (
                <TableCell
                  key={field}
                  sx={{
                    backgroundColor: '#f5f5f5',
                    fontWeight: 'bold',
                    color: '#222',
                    minWidth: 120,
                  }}
                >
                  {field.replace(/_/g, ' ')}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {previewRowsToShow.map((row: Record<string, any>, rowIdx: number) => {
              const globalRowIdx = page * rowsPerPage + rowIdx;
              return (
                <TableRow key={globalRowIdx} sx={hasMissingRequired(row, REQUIRED_FIELDS, CONTACT_FIELDS) ? { backgroundColor: '#fff3cd' } : {}}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedRows.has(globalRowIdx)}
                      onChange={e => handleSelectRow(globalRowIdx, e.target.checked)}
                      inputProps={{ 'aria-label': `select row ${globalRowIdx + 1}` }}
                    />
                  </TableCell>
                  {allFields.map((field) => (
                    <TableCell key={field}>
                      <TextField
                        value={typeof row[field] === 'undefined' || row[field] === null ? '' : row[field]}
                        onChange={e => {
                          const value = e.target.value;
                          handleCellChange(globalRowIdx, field, value);
                        }}
                        size="small"
                        error={REQUIRED_FIELDS.includes(field) && (!row[field] || row[field].toString().trim() === '')}
                        helperText={REQUIRED_FIELDS.includes(field) && (!row[field] || row[field].toString().trim() === '') ? 'Required' : ''}
                        fullWidth
                      />
                      {CONTACT_FIELDS.includes(field) && !CONTACT_FIELDS.some(f => row[f] && row[f].toString().trim() !== '') && (
                        <span style={{ color: 'red', fontSize: 12 }}>At least one required</span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>
      {/* Pagination controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1, mb: 2 }}>
        <Box>
          <Button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} size="small">Prev</Button>
          <Button onClick={() => setPage(Math.min(pageCount - 1, page + 1))} disabled={page >= pageCount - 1} size="small">Next</Button>
          <span style={{ marginLeft: 8 }}>
            Page {page + 1} of {pageCount}
          </span>
        </Box>
        <Box>
          <span>Rows per page: </span>
          <TextField
            type="number"
            size="small"
            value={rowsPerPage}
            onChange={e => {
              const val = Math.max(1, Number(e.target.value));
              setRowsPerPage(val);
              setPage(0);
            }}
            inputProps={{ min: 1, style: { width: 60 } }}
          />
        </Box>
        <Box sx={{ ml: 2 }}>
          <TextField
            label="Jump to page"
            type="number"
            size="small"
            value={page + 1}
            onChange={e => {
              let val = Number(e.target.value);
              if (isNaN(val)) return;
              val = Math.max(1, Math.min(pageCount, val));
              setPage(val - 1);
            }}
            inputProps={{ min: 1, max: pageCount, style: { width: 80 } }}
          />
        </Box>
      </Box>
      <Divider sx={{ my: 2 }} />
      {/* Import action bar */}
      {importAccess && (
        <Box sx={{ display: 'flex', gap: 2, mb: 2, justifyContent: 'flex-end', alignItems: 'center' }}>
          <Button variant="contained" color="primary" startIcon={<CheckCircle />} onClick={handleImportAll} disabled={importing || missingRequiredRows.length > 0}>
            Import All
          </Button>
          <Button variant="outlined" color="secondary" startIcon={<ListAlt />} onClick={handleImportPage} disabled={importing || missingRequiredRows.length > 0}>
            Import This Page
          </Button>
          <Button variant="outlined" color="success" startIcon={<CheckCircle />} onClick={handleImportSelected} disabled={importing || selectedRows.size === 0 || missingRequiredRows.length > 0}>
            Import Selected
          </Button>
          {selectedRows.size > 0 && (
            <Button variant="outlined" color="warning" onClick={onClearAllSelections}>
              Clear All Selections
            </Button>
          )}
          {importing && <LinearProgress sx={{ width: 120, alignSelf: 'center' }} />}
        </Box>
      )}
      {missingRequiredRows.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {`Warning: ${missingRequiredRows.length} row(s) in the preview are missing required fields and at least one communication channel. Import is disabled until fixed.`}
        </Alert>
      )}
    </Card>
  </Box>
);

export default PreviewStep; 