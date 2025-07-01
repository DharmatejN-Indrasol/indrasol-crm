import React, { useState, useEffect } from 'react';
import { List, Datagrid, TextField, EmailField, DateField, TopToolbar, CreateButton, useGetList, ListProps, useNotify, useDataProvider, FunctionField, ListBase, ListToolbar, SortButton, useListContext, ExportButton, FilterButton, TextInput, SelectInput, useRecordContext, useRefresh, EditButton, DeleteButton } from 'react-admin';
import LeadImportButton from './LeadImportButton';
import LeadKanbanBoard from './LeadKanbanBoard';
import { Button, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Checkbox, Typography, IconButton, Box, FormControl, InputLabel, Select, MenuItem, TableCell, Chip, Tooltip, Card } from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { DragDropContext as DnDContext, Droppable as DnDDroppable, Draggable as DnDDraggable } from '@hello-pangea/dnd';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import { SelectChangeEvent } from '@mui/material/Select';
import { useNavigate } from 'react-router-dom';
import LeadListFilter from './LeadListFilter';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import TableChartIcon from '@mui/icons-material/TableChart';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import { Pagination } from 'react-admin';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import CampaignIcon from '@mui/icons-material/Campaign';
import AutomationIcon from '@mui/icons-material/SmartToy';
import { getAutomationService } from './automation/automationService';
import { Lead, Sequence } from '../types';

const COLUMN_FIELDS = [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'phone', label: 'Phone', type: 'text' },
    { key: 'source', label: 'Source', type: 'text' },
    { key: 'status', label: 'Status', type: 'text' },
    { key: 'owner_id', label: 'Owner', type: 'text' },
    { key: 'created_at', label: 'Created Date', type: 'date' },
    { key: 'updated_at', label: 'Updated Date', type: 'date' },
];
const DEFAULT_COLUMNS = ['name', 'email', 'phone', 'status', 'owner_id', 'created_at'];
const STORAGE_KEY = 'lead_table_settings';

const STATUS_CHOICES = [
    { id: 'New', name: 'New' },
    { id: 'Contacted', name: 'Contacted' },
    { id: 'Qualified', name: 'Qualified' },
    { id: 'Disqualified', name: 'Disqualified' },
    { id: 'Converted', name: 'Converted' },
];

const FILTERS_KEY = STORAGE_KEY + '_filters';

const LeadListActions = () => (
    <TopToolbar>
        {/* <FilterButton /> */}
        <LeadImportButton />
        <ExportButton />
        <CreateButton variant="contained" label="New Lead" sx={{ marginLeft: 2 }} />
    </TopToolbar>
);

const LeadKanbanWrapper = () => {
    const { data, refetch } = useGetList('leads', {
        pagination: { page: 1, perPage: 1000 },
        sort: { field: 'created_at', order: 'DESC' },
    });
    if (!data) return null;
    return <LeadKanbanBoard leads={data} refetch={refetch} />;
};

const SelectCheckboxField = (props: { record?: any; selected: Set<string>; toggleSelect: (id: string) => void }) => {
    const { record, selected, toggleSelect } = props;
    if (!record) return null;
    return (
        <Checkbox
            checked={selected.has(record.id.toString())}
            onChange={() => toggleSelect(record.id.toString())}
        />
    );
};

const LeadListLayout = ({ actions }: { actions?: React.ReactElement }) => {
    const [view, setView] = useState<'table' | 'kanban'>('table');
    const [customizeOpen, setCustomizeOpen] = useState(false);
    const [customizeFields, setCustomizeFields] = useState<string[]>(DEFAULT_COLUMNS);
    const [columns, setColumns] = useState<string[]>(DEFAULT_COLUMNS);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bulkDialog, setBulkDialog] = useState<{ action: string; open: boolean }>({ action: '', open: false });
    const [bulkValue, setBulkValue] = useState('');
    const navigate = useNavigate();
    const { data: contextLeads = [], refetch: contextRefetch } = useListContext();

    // Restore columns from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY + '_columns');
        if (saved) {
            try {
                setColumns(JSON.parse(saved));
            } catch { }
        }
    }, []);
    // Persist columns
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY + '_columns', JSON.stringify(columns));
    }, [columns]);

    // Restore filters from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(FILTERS_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setSelected(new Set(parsed.selectedLeads || []));
                setBulkDialog(parsed.bulkDialog || { action: '', open: false });
                setBulkValue(parsed.bulkValue || '');
            } catch { }
        }
    }, []);
    useEffect(() => {
        localStorage.setItem(FILTERS_KEY, JSON.stringify({ selectedLeads: Array.from(selected), bulkDialog, bulkValue }));
    }, [selected, bulkDialog, bulkValue]);

    // Fetch all leads for filter options and filtering
    useEffect(() => {
        if (view !== 'table') return;
        (async () => {
            // Use react-admin dataProvider if available
            if ((window as any).dataProvider) {
                const { data } = await (window as any).dataProvider.getList('leads', {
                    pagination: { page: 1, perPage: 1000 },
                    sort: { field: 'created_at', order: 'DESC' },
                });
                setSelected(new Set((data as any[]).map((l: any) => l.id.toString())));
            }
        })();
    }, [view]);

    // Bulk actions
    const handleBulkAction = async () => {
        if (bulkDialog.action === 'assign') {
            await Promise.all(Array.from(selected).map(id => (window as any).dataProvider.update('leads', { id, data: { owner_id: bulkValue } })));
        } else if (bulkDialog.action === 'status') {
            await Promise.all(Array.from(selected).map(id => (window as any).dataProvider.update('leads', { id, data: { status: bulkValue } })));
        } else if (bulkDialog.action === 'delete') {
            await Promise.all(Array.from(selected).map(id => (window as any).dataProvider.delete('leads', { id })));
        }
        setBulkDialog({ action: '', open: false });
        setSelected(new Set());
        setBulkValue('');
        // Refetch leads
        if ((window as any).dataProvider) {
            const { data } = await (window as any).dataProvider.getList('leads', {
                pagination: { page: 1, perPage: 1000 },
                sort: { field: 'created_at', order: 'DESC' },
            });
            setSelected(new Set((data as any[]).map((l: any) => l.id.toString())));
        }
    };
    const toggleSelect = (id: string) => setSelected(sel => {
        const next = new Set(sel);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });
    const selectAll = () => setSelected(new Set(selected));
    const clearSelection = () => setSelected(new Set());

    const handleAddNote = (lead: any) => {
        // Placeholder: open note dialog or show notification
        alert('Add Note for ' + (lead.name || lead.first_name));
    };
    const handleConvert = (lead: any) => {
        // Placeholder: open convert dialog or show notification
        alert('Convert Lead ' + (lead.name || lead.first_name));
    };

    return (
        <Stack direction="row" gap={0.5} sx={{ width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
            <Stack sx={{ width: '100%' }} gap={0.5}>
                {actions}
                <Stack direction="row" alignItems="center" gap={0.5} mb={0.5}>
                    <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 0.2, fontSize: '1.3rem', color: 'text.primary' }}>Leads</Typography>
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
                </Stack>
                {selected.size > 0 && (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2, background: '#f5f5f5', p: 1, borderRadius: 1 }}>
                        <Button size="small" onClick={selectAll}>Select All</Button>
                        <Button size="small" onClick={clearSelection}>Clear</Button>
                        <Button size="small" variant="outlined" onClick={() => setBulkDialog({ action: 'assign', open: true })}>Assign Owner</Button>
                        <Button size="small" variant="outlined" onClick={() => setBulkDialog({ action: 'status', open: true })}>Change Status</Button>
                        <Button size="small" color="error" variant="outlined" onClick={() => setBulkDialog({ action: 'delete', open: true })} startIcon={<DeleteIcon />}>Delete</Button>
                        <Typography>{selected.size} selected</Typography>
                    </Stack>
                )}
                {view === 'table' ? (
                    <Card sx={{ p: 0.5, boxShadow: 2, borderRadius: 2, '&:hover': { boxShadow: 4, transform: 'translateY(-0.5px) scale(1.002)' }, transition: 'box-shadow 0.15s, transform 0.15s', animation: 'fadeInCard 0.2s cubic-bezier(0.4,0,0.2,1)' }}>
                        <Datagrid rowClick="edit" bulkActionButtons={false}>
                            <FunctionField render={record => <SelectCheckboxField record={record} selected={selected} toggleSelect={toggleSelect} />} />
                            {columns.includes('name') && <TextField source="name" />}
                            {columns.includes('email') && <EmailField source="email" />}
                            {columns.includes('phone') && <TextField source="phone" />}
                            {columns.includes('source') && <TextField source="source" />}
                            {columns.includes('status') && <TextField source="status" />}
                            {columns.includes('owner_id') && <TextField source="owner_id" />}
                            {columns.includes('created_at') && <DateField source="created_at" />}
                            {columns.includes('updated_at') && <DateField source="updated_at" />}
                            {columns.includes('tags') && (
                                <FunctionField
                                    label="Tags"
                                    render={record => record.tags ? record.tags.split(',').map((tag: string) => (
                                        <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5, mt: 0.5 }} />
                                    )) : null}
                                />
                            )}
                            <FunctionField
                                label="Actions"
                                render={record => (
                                    <>
                                        <Tooltip title="Edit"><IconButton size="small" onClick={e => { e.stopPropagation(); navigate(`/leads/${record.id}`); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                                        <Tooltip title="Convert"><IconButton size="small" onClick={e => { e.stopPropagation(); handleConvert(record); }}><SwapHorizIcon fontSize="small" /></IconButton></Tooltip>
                                        <Tooltip title="Add Note"><IconButton size="small" onClick={e => { e.stopPropagation(); handleAddNote(record); }}><NoteAddIcon fontSize="small" /></IconButton></Tooltip>
                                    </>
                                )}
                            />
                        </Datagrid>
                    </Card>
                ) : (
                    <LeadKanbanBoard leads={contextLeads} refetch={contextRefetch} />
                )}
                {view === 'table' && <Pagination rowsPerPageOptions={[10, 25, 50, 100]} />}
            </Stack>
        </Stack>
    );
};

const AutomationDialog = ({ open, onClose, lead }: { open: boolean; onClose: () => void; lead?: Lead }) => {
    const [sequenceId, setSequenceId] = useState('');
    const [loading, setLoading] = useState(false);
    const { data: sequences } = useGetList<Sequence>('sequences');
    const notify = useNotify();
    const dataProvider = useDataProvider();
    const refresh = useRefresh();

    const handleSubmit = async () => {
        if (!lead || !sequenceId) return;
        setLoading(true);
        try {
            const automationService = getAutomationService(dataProvider);
            const sequence = sequences?.find(s => s.id === sequenceId);
            if (sequence) {
                await automationService.processLeadSequence(lead, sequence);
                notify('Lead added to sequence');
                refresh();
                onClose();
            }
        } catch (error) {
            notify('Error processing sequence', { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Add Lead to Sequence</DialogTitle>
            <DialogContent>
                <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel id="sequence-select-label">Sequence</InputLabel>
                    <Select
                        labelId="sequence-select-label"
                        value={sequenceId}
                        onChange={e => setSequenceId(e.target.value)}
                    >
                        {sequences?.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                    </Select>
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Adding...' : 'Add to Sequence'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const AutomationStatus = () => {
    const lead = useRecordContext<Lead>();
    if (!lead || !lead.sequence_id) return null;
    return (
        <Tooltip title={`In sequence step ${lead.sequence_step}`}>
            <Chip icon={<AutomationIcon />} label="In Sequence" size="small" />
        </Tooltip>
    );
}

const LeadActions = () => {
    const lead = useRecordContext<Lead>();
    const [dialogOpen, setDialogOpen] = useState(false);
    const refresh = useRefresh();
    const notify = useNotify();
    const dataProvider = useDataProvider();

    const handleSequenceAction = async (action: 'pause' | 'resume' | 'stop') => {
        if (!lead) return;
        try {
            // This is a placeholder for actual API call
            await dataProvider.update('leads', { 
                id: lead.id, 
                data: { sequence_status: action },
                previousData: lead 
            });
            notify(`Sequence ${action}d`);
            refresh();
        } catch (error) {
            notify('Error updating sequence', { type: 'error' });
        }
    };

    return (
        <Stack direction="row" spacing={1}>
            <Tooltip title="Automate">
                <IconButton onClick={() => setDialogOpen(true)}>
                    <CampaignIcon />
                </IconButton>
            </Tooltip>
            {lead?.sequence_id && (
                <>
                    <Tooltip title="Pause Sequence">
                        <IconButton onClick={() => handleSequenceAction('pause')}><PauseIcon /></IconButton>
                    </Tooltip>
                    <Tooltip title="Resume Sequence">
                        <IconButton onClick={() => handleSequenceAction('resume')}><PlayArrowIcon /></IconButton>
                    </Tooltip>
                    <Tooltip title="Stop Sequence">
                        <IconButton onClick={() => handleSequenceAction('stop')}><StopIcon /></IconButton>
                    </Tooltip>
                </>
            )}
            <EditButton />
            <DeleteButton />
            <AutomationDialog open={dialogOpen} onClose={() => setDialogOpen(false)} lead={lead} />
        </Stack>
    );
};

export const LeadList = () => (
    <List filters={<LeadListFilter />}>
        <LeadListLayout actions={<LeadListActions />} />
    </List>
); 