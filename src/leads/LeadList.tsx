import React, { useState, useRef, useEffect } from 'react';
import { ListBase, useListContext, Pagination, ListToolbar, TopToolbar, ExportButton, CreateButton, BulkActionsToolbar, BulkDeleteButton, BulkExportButton, SortButton } from 'react-admin';
import { Stack, Card, Typography, Chip, CircularProgress, Alert, Tooltip } from '@mui/material';
import TableChartIcon from '@mui/icons-material/TableChart';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { LeadEmpty } from './LeadEmpty';
import LeadImportButton from './LeadImportButton';
import LeadKanbanBoard from './LeadKanbanBoard';
import LeadListFilter from './LeadListFilter';
import { Datagrid, TextField, EmailField, DateField, FunctionField, EditButton, DeleteButton } from 'react-admin';
import { useNavigate } from 'react-router-dom';
import { useDelete, useNotify, useRefresh } from 'react-admin';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const LeadListActions = ({ importBtnRef }: { importBtnRef: React.RefObject<HTMLButtonElement | null> }) => (
    <TopToolbar>
        <SortButton fields={['name', 'email', 'created_at']} />
        <LeadImportButton importBtnRef={importBtnRef} />
        <ExportButton />
        <CreateButton variant="contained" label="New Lead" sx={{ marginLeft: 2 }} />
    </TopToolbar>
);

const LeadListLayout = () => {
    const { data: rawData, isLoading, error, filterValues } = useListContext();
    const data = rawData || [];
    const [view, setView] = useState<'table' | 'kanban'>('table');
    const importBtnRef = useRef(null);
    const hasFilters = filterValues && Object.keys(filterValues).length > 0;
    const navigate = useNavigate();

    if (isLoading) {
        return <Stack alignItems="center" mt={4}><CircularProgress /></Stack>;
    }
    if (error) {
        return <Alert severity="error">Failed to load leads. Please try again later.</Alert>;
    }
    if (!data.length && !hasFilters) {
        return <LeadEmpty />;
    }
    return (
        <Stack direction="row" gap={0.5}>
            <LeadListFilter />
            <Stack sx={{ width: '100%' }} gap={0.5}>
                <Stack direction="row" alignItems="center" gap={0.5} mb={0.5}>
                    <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 0.2, fontSize: '1.3rem', color: 'text.primary' }}>Leads</Typography>
                    <Chip label="AI" color="primary" size="small" sx={{ fontWeight: 700, letterSpacing: 1 }} />
                </Stack>
                <Stack direction="row" alignItems="center" gap={1} mb={1}>
                    <ToggleButtonGroup
                        value={view}
                        exclusive
                        onChange={(_, next) => next && setView(next)}
                        size="small"
                        sx={{ ml: 0 }}
                    >
                        <ToggleButton value="table" aria-label="Table View">
                            <Tooltip title="Table View"><TableChartIcon /></Tooltip>
                        </ToggleButton>
                        <ToggleButton value="kanban" aria-label="Kanban View">
                            <Tooltip title="Kanban View"><ViewKanbanIcon /></Tooltip>
                        </ToggleButton>
                    </ToggleButtonGroup>
                    {view === 'table' && <ListToolbar actions={<LeadListActions importBtnRef={importBtnRef} />} />}
                </Stack>
                {view === 'table' && (
                    <BulkActionsToolbar>
                        <BulkExportButton />
                        <BulkDeleteButton />
                    </BulkActionsToolbar>
                )}
                {view === 'table' && (
                    <Card sx={{ p: 0.5, boxShadow: 2, borderRadius: 2, '&:hover': { boxShadow: 4, transform: 'translateY(-0.5px) scale(1.002)' }, transition: 'box-shadow 0.15s, transform 0.15s', animation: 'fadeInCard 0.2s cubic-bezier(0.4,0,0.2,1)' }}>
                        <Datagrid rowClick="edit" bulkActionButtons={false}>
                            <FunctionField label="Name" render={record => `${record.first_name || ''} ${record.last_name || ''}`.trim()} />
                            <TextField source="email_address" label="Email" />
                            <TextField source="direct_phone_number" label="Phone" />
                            <TextField source="status" />
                            <TextField source="owner_id" />
                            <DateField source="created_at" />
                            <DateField source="updated_at" />
                            <FunctionField label="Actions" render={record => (
                                <>
                                    <EditButton record={record} />
                                    <DeleteButton record={record} />
                                </>
                            )} />
                        </Datagrid>
                    </Card>
                )}
                {view === 'kanban' && <LeadKanbanBoard leads={data} refetch={() => {}} />}
                {view === 'table' && <Pagination rowsPerPageOptions={[10, 25, 50, 100]} />}
            </Stack>
        </Stack>
    );
};

export const LeadList = () => (
    <ListBase perPage={25} sort={{ field: 'created_at', order: 'DESC' }}>
        <LeadListLayout />
    </ListBase>
); 