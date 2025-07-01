import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useDataProvider, useNotify, useRedirect, useListContext } from 'react-admin';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, Typography, Box, Paper, Stack, Avatar, Chip, IconButton, Tooltip, TextField, MenuItem, Select, InputLabel, FormControl, Checkbox, Button, Dialog, DialogTitle, DialogContent, DialogActions, Menu, ListItemIcon, ListItemText, Skeleton } from '@mui/material';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import InboxIcon from '@mui/icons-material/Inbox';
import TuneIcon from '@mui/icons-material/Tune';
import { DragDropContext as DnDContext, Droppable as DnDDroppable, Draggable as DnDDraggable } from '@hello-pangea/dnd';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

const LEAD_STATUSES = [
    'New',
    'Contacted',
    'Qualified',
    'Disqualified',
    'Converted',
];

const STATUS_COLORS: Record<string, string> = {
    'New': '#e3f2fd',
    'Contacted': '#fff3e0',
    'Qualified': '#e8f5e9',
    'Disqualified': '#ffebee',
    'Converted': '#ede7f6',
};

const SORT_OPTIONS = [
    { value: 'created_at', label: 'Created Date' },
    { value: 'last_seen', label: 'Last Seen' },
    { value: 'first_name', label: 'First Name' },
];

const STORAGE_KEY = 'lead_kanban_settings';

export default function LeadKanbanBoard({ leads, refetch, loading }: { leads: any[]; refetch: () => void; loading?: boolean }) {
    const dataProvider = useDataProvider();
    const notify = useNotify();
    const redirect = useRedirect();
    const { filterValues } = useListContext();

    // Settings state (persisted)
    const [ownerFilter, setOwnerFilter] = useState('');
    const [sourceFilter, setSourceFilter] = useState('');
    const [tagFilter, setTagFilter] = useState('');
    const [search, setSearch] = useState('');
    const [columnSort, setColumnSort] = useState<{ [status: string]: string }>({});
    const [visibleColumns, setVisibleColumns] = useState<string[]>(LEAD_STATUSES);

    // Column visibility menu
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const openMenu = Boolean(anchorEl);
    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);
    const toggleColumn = (status: string) => setVisibleColumns(cols => cols.includes(status) ? cols.filter(s => s !== status) : [...cols, status]);

    // Multi-select state
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bulkDialog, setBulkDialog] = useState<{ action: string; open: boolean }>({ action: '', open: false });
    const [bulkValue, setBulkValue] = useState('');

    // Restore settings from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setOwnerFilter(parsed.ownerFilter || '');
                setSourceFilter(parsed.sourceFilter || '');
                setTagFilter(parsed.tagFilter || '');
                setSearch(parsed.search || '');
                setColumnSort(parsed.columnSort || {});
                setVisibleColumns(parsed.visibleColumns || LEAD_STATUSES);
            } catch {}
        }
    }, []);
    // Persist settings to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ownerFilter, sourceFilter, tagFilter, search, columnSort, visibleColumns }));
    }, [ownerFilter, sourceFilter, tagFilter, search, columnSort, visibleColumns]);

    // Unique owners, sources, tags for filter dropdowns
    const owners = useMemo(() => Array.from(new Set(leads.map(l => l.owner_id).filter(Boolean))), [leads]);
    const sources = useMemo(() => Array.from(new Set(leads.map(l => l.source).filter(Boolean))), [leads]);
    const tags = useMemo(() => Array.from(new Set(leads.flatMap(l => (l.tags ? l.tags.split(',') : [])))), [leads]);

    // Apply filters from filterValues (from sidebar)
    const filteredLeads = useMemo(() => {
        return leads.filter(lead => {
            // Status
            if (filterValues.status && lead.status !== filterValues.status) return false;
            // Owner
            if (filterValues.owner_id && lead.owner_id !== filterValues.owner_id) return false;
            // Source
            if (filterValues.source && lead.source !== filterValues.source) return false;
            // Tags (assume tags@cs: "{tagId}")
            if (filterValues['tags@cs']) {
                const tagId = filterValues['tags@cs'].replace(/[{}]/g, '');
                if (!lead.tags || !lead.tags.split(',').includes(tagId)) return false;
            }
            // Search (FilterLiveSearch sets q)
            if (filterValues.q) {
                const s = filterValues.q.toLowerCase();
                if (!(
                    (lead.first_name && lead.first_name.toLowerCase().includes(s)) ||
                    (lead.last_name && lead.last_name.toLowerCase().includes(s)) ||
                    (lead.email_address && lead.email_address.toLowerCase().includes(s)) ||
                    (lead.company_name && lead.company_name.toLowerCase().includes(s))
                )) return false;
            }
            return true;
        });
    }, [leads, filterValues]);

    // Group and sort leads by status
    const grouped = useMemo(() => {
        const result: Record<string, any[]> = {};
        for (const status of LEAD_STATUSES) {
            let arr = filteredLeads.filter(l => l.status === status);
            const sortField = columnSort[status] || 'created_at';
            arr = arr.slice().sort((a, b) => {
                if (!a[sortField] || !b[sortField]) return 0;
                if (a[sortField] < b[sortField]) return -1;
                if (a[sortField] > b[sortField]) return 1;
                return 0;
            });
            result[status] = arr;
        }
        return result;
    }, [filteredLeads, columnSort]);

    const onDragEnd = useCallback(
        async (result: { destination: any; source?: any; draggableId?: any; }) => {
            if (!result.destination) return;
            const { source, destination, draggableId } = result;
            const leadId = draggableId;
            const newStatus = destination.droppableId;
            if (source.droppableId === destination.droppableId) return;
            try {
                await dataProvider.update('leads', {
                    id: leadId,
                    data: { status: newStatus },
                    previousData: leads.find(l => l.id === leadId),
                });
                notify('Lead status updated', { type: 'success' });
                refetch();
            } catch (e) {
                notify('Failed to update lead status', { type: 'error' });
            }
        },
        [dataProvider, notify, leads, refetch]
    );

    // Quick action handlers (placeholders)
    const handleAddNote = (lead: any) => {
        notify('Add Note action for ' + (lead.first_name || lead.name), { type: 'info' });
    };
    const handleAssignOwner = (lead: any) => {
        notify('Assign Owner action for ' + (lead.first_name || lead.name), { type: 'info' });
    };
    const handleConvert = (lead: any) => {
        redirect(`/leads/${lead.id}/show`); // Could open conversion dialog directly
    };

    // Bulk actions
    const handleBulkAction = async () => {
        if (bulkDialog.action === 'assign') {
            await Promise.all(Array.from(selected).map(id => dataProvider.update('leads', { id, data: { owner_id: bulkValue }, previousData: leads.find(l => l.id === id) })));
            notify('Leads assigned', { type: 'success' });
        } else if (bulkDialog.action === 'status') {
            await Promise.all(Array.from(selected).map(id => dataProvider.update('leads', { id, data: { status: bulkValue }, previousData: leads.find(l => l.id === id) })));
            notify('Lead statuses updated', { type: 'success' });
        } else if (bulkDialog.action === 'delete') {
            await Promise.all(Array.from(selected).map(id => dataProvider.delete('leads', { id })));
            notify('Leads deleted', { type: 'success' });
        }
        setBulkDialog({ action: '', open: false });
        setSelected(new Set());
        setBulkValue('');
        refetch();
    };

    // Selection helpers
    const toggleSelect = (id: string) => setSelected(sel => {
        const next = new Set(sel);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });
    const selectAll = () => setSelected(new Set(filteredLeads.map(l => l.id.toString())));
    const clearSelection = () => setSelected(new Set());

    // Loading skeletons
    const skeletonCards = Array.from({ length: 3 });

    return (
        <>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                {/* <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Owner</InputLabel>
                    <Select value={ownerFilter} label="Owner" onChange={e => setOwnerFilter(e.target.value)}>
                        <MenuItem value="">All</MenuItem>
                        {owners.map(owner => (
                            <MenuItem key={owner} value={owner}>{owner}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Source</InputLabel>
                    <Select value={sourceFilter} label="Source" onChange={e => setSourceFilter(e.target.value)}>
                        <MenuItem value="">All</MenuItem>
                        {sources.map(source => (
                            <MenuItem key={source} value={source}>{source}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Tag</InputLabel>
                    <Select value={tagFilter} label="Tag" onChange={e => setTagFilter(e.target.value)}>
                        <MenuItem value="">All</MenuItem>
                        {tags.map(tag => (
                            <MenuItem key={tag} value={tag}>{tag}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <TextField
                    size="small"
                    variant="outlined"
                    placeholder="Search..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} /> }}
                    sx={{ minWidth: 200 }}
                /> 
                <IconButton onClick={handleMenuClick} sx={{ ml: 1 }}><ViewColumnIcon /></IconButton>
                <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
                    {LEAD_STATUSES.map(status => (
                        <MenuItem key={status} onClick={() => toggleColumn(status)}>
                            <ListItemIcon>
                                <Checkbox checked={visibleColumns.includes(status)} />
                            </ListItemIcon>
                            <ListItemText primary={status} />
                        </MenuItem>
                    ))}
                </Menu> */}
                {selected.size > 0 && (
                    <>
                        <Button size="small" onClick={selectAll}>Select All</Button>
                        <Button size="small" onClick={clearSelection}>Clear</Button>
                        <Button size="small" variant="outlined" onClick={() => setBulkDialog({ action: 'assign', open: true })}>Assign Owner</Button>
                        <Button size="small" variant="outlined" onClick={() => setBulkDialog({ action: 'status', open: true })}>Change Status</Button>
                        <Button size="small" color="error" variant="outlined" onClick={() => setBulkDialog({ action: 'delete', open: true })} startIcon={<DeleteIcon />}>Delete</Button>
                        <Typography variant="body2" sx={{ ml: 1 }}>{selected.size} selected</Typography>
                    </>
                )}
            </Stack>
            <Dialog open={bulkDialog.open} onClose={() => setBulkDialog({ action: '', open: false })}>
                <DialogTitle>Bulk {bulkDialog.action === 'assign' ? 'Assign Owner' : bulkDialog.action === 'status' ? 'Change Status' : 'Delete Leads'}</DialogTitle>
                <DialogContent>
                    {bulkDialog.action === 'assign' && (
                        <FormControl fullWidth size="small" sx={{ mt: 2 }}>
                            <InputLabel>Owner</InputLabel>
                            <Select value={bulkValue} label="Owner" onChange={e => setBulkValue(e.target.value)}>
                                {owners.map(owner => (
                                    <MenuItem key={owner} value={owner}>{owner}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                    {bulkDialog.action === 'status' && (
                        <FormControl fullWidth size="small" sx={{ mt: 2 }}>
                            <InputLabel>Status</InputLabel>
                            <Select value={bulkValue} label="Status" onChange={e => setBulkValue(e.target.value)}>
                                {LEAD_STATUSES.map(status => (
                                    <MenuItem key={status} value={status}>{status}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                    {bulkDialog.action === 'delete' && (
                        <Typography sx={{ mt: 2 }}>Are you sure you want to delete {selected.size} leads?</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBulkDialog({ action: '', open: false })}>Cancel</Button>
                    <Button onClick={handleBulkAction} color={bulkDialog.action === 'delete' ? 'error' : 'primary'} variant="contained" disabled={!bulkValue && bulkDialog.action !== 'delete'}>
                        {bulkDialog.action === 'delete' ? 'Delete' : 'Apply'}
                    </Button>
                </DialogActions>
            </Dialog>
            <DragDropContext onDragEnd={onDragEnd}>
                <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ overflowX: 'auto', maxWidth: '100%', pb: 2 }}>
                    {LEAD_STATUSES.filter(status => visibleColumns.includes(status)).map((status) => (
                        <Droppable droppableId={status} key={status}>
                            {(provided, snapshot) => (
                                <Paper
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    sx={{ minWidth: 200, maxWidth: 250, width: '100%', background: STATUS_COLORS[status], p: 1, borderTop: `6px solid ${STATUS_COLORS[status]}` }}
                                    elevation={3}
                                >
                                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                                        <Typography variant="h6">{status}</Typography>
                                        <Chip label={grouped[status].length} size="small" color="primary" />
                                    </Stack>
                                    <FormControl size="small" sx={{ mb: 1, width: '100%' }}>
                                        <InputLabel>Sort by</InputLabel>
                                        <Select
                                            value={columnSort[status] || 'created_at'}
                                            label="Sort by"
                                            onChange={e => setColumnSort(cs => ({ ...cs, [status]: e.target.value }))}
                                        >
                                            {SORT_OPTIONS.map(opt => (
                                                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    {loading ? (
                                        skeletonCards.map((_, idx) => (
                                            <Card key={idx} variant="outlined" sx={{ mb: 1, width: '100%', maxWidth: 400, boxSizing: 'border-box' }}>
                                                <CardContent>
                                                    <Stack direction="row" alignItems="center" spacing={1}>
                                                        <Skeleton variant="circular" width={32} height={32} />
                                                        <Box flex={1}>
                                                            <Skeleton width="60%" />
                                                            <Skeleton width="40%" />
                                                            <Skeleton width="30%" />
                                                        </Box>
                                                    </Stack>
                                                </CardContent>
                                            </Card>
                                        ))
                                    ) : grouped[status].length === 0 ? (
                                        <Stack alignItems="center" sx={{ my: 4 }}>
                                            <InboxIcon color="disabled" sx={{ fontSize: 48, mb: 1 }} />
                                            <Typography variant="body2" color="text.secondary" align="center">
                                                No leads in this stage
                                            </Typography>
                                        </Stack>
                                    ) : grouped[status].map((lead, idx) => (
                                        <Draggable draggableId={lead.id.toString()} index={idx} key={lead.id}>
                                            {(provided, snapshot) => (
                                                <Box
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    sx={{ mb: 1, cursor: 'pointer', opacity: snapshot.isDragging ? 0.7 : 1, width: '100%', maxWidth: 400, boxSizing: 'border-box' }}
                                                >
                                                    <Card variant="outlined" sx={{ position: 'relative', width: '100%', maxWidth: 400, boxSizing: 'border-box' }}>
                                                        <CardContent sx={{ pb: '56px' }}>
                                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                                <Checkbox
                                                                    checked={selected.has(lead.id.toString())}
                                                                    onChange={() => toggleSelect(lead.id.toString())}
                                                                    size="small"
                                                                    sx={{ mr: 1 }}
                                                                />
                                                                <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                                                                    {lead.owner_id ? lead.owner_id.toString().slice(-2) : '?'}
                                                                </Avatar>
                                                                <Box flex={1} onClick={() => redirect(`/leads/${lead.id}/show`)}>
                                                                    <Typography variant="subtitle1">{lead.first_name || lead.name} {lead.last_name}</Typography>
                                                                    <Typography variant="body2" color="text.secondary">{lead.email_address || lead.email}</Typography>
                                                                    <Typography variant="body2">{lead.company_name}</Typography>
                                                                    {lead.tags && lead.tags.split(',').map((tag: string) => (
                                                                        <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5, mt: 0.5 }} />
                                                                    ))}
                                                                </Box>
                                                            </Stack>
                                                            <Stack direction="row" spacing={1} sx={{ position: 'absolute', bottom: 8, right: 8 }}>
                                                                <Tooltip title="Add Note"><IconButton size="small" onClick={() => handleAddNote(lead)}><NoteAddIcon fontSize="small" /></IconButton></Tooltip>
                                                                <Tooltip title="Assign Owner"><IconButton size="small" onClick={() => handleAssignOwner(lead)}><PersonAddIcon fontSize="small" /></IconButton></Tooltip>
                                                                <Tooltip title="Convert"><IconButton size="small" onClick={() => handleConvert(lead)}><SwapHorizIcon fontSize="small" /></IconButton></Tooltip>
                                                            </Stack>
                                                        </CardContent>
                                                    </Card>
                                                </Box>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </Paper>
                            )}
                        </Droppable>
                    ))}
                </Stack>
            </DragDropContext>
        </>
    );
} 