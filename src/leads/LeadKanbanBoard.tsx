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
import { AssignmentInd, CheckCircle, HourglassEmpty, ThumbDown, ThumbUp } from '@mui/icons-material';

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

const STATUS_ICONS: Record<string, JSX.Element> = {
    'New': <HourglassEmpty fontSize="small" />,
    'Contacted': <AssignmentInd fontSize="small" />,
    'Qualified': <ThumbUp fontSize="small" />,
    'Disqualified': <ThumbDown fontSize="small" />,
    'Converted': <CheckCircle fontSize="small" />,
};

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
                <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', minHeight: 400, p: 2, bgcolor: '#f5f7fa' }}>
                    {visibleColumns.map(status => (
                        <Paper key={status} elevation={4} sx={{ minWidth: 320, maxWidth: 360, flex: '1 1 320px', bgcolor: STATUS_COLORS[status], borderRadius: 3, display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.2s', position: 'relative', m: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', p: 2, borderBottom: '2px solid #e0e0e0', bgcolor: STATUS_COLORS[status], borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
                                {STATUS_ICONS[status]}
                                <Typography variant="h6" sx={{ ml: 1, fontWeight: 700, color: '#333' }}>{status}</Typography>
                                <Chip label={grouped[status]?.length || 0} size="small" sx={{ ml: 2, bgcolor: '#fff', color: '#1976d2', fontWeight: 700 }} />
                            </Box>
                            <Droppable droppableId={status}>
                                {(provided, snapshot) => (
                                    <Box ref={provided.innerRef} {...provided.droppableProps} sx={{ flex: 1, minHeight: 200, p: 1, transition: 'background 0.2s', bgcolor: snapshot.isDraggingOver ? '#bbdefb' : 'transparent', borderRadius: 2 }}>
                                        {grouped[status].length === 0 && (
                                            <Box sx={{ textAlign: 'center', color: '#aaa', mt: 4 }}>
                                                <InboxIcon sx={{ fontSize: 48, mb: 1 }} />
                                                <Typography variant="body2">No leads in this stage</Typography>
                                            </Box>
                                        )}
                                        {grouped[status].map((lead, idx) => (
                                            <Draggable key={lead.id} draggableId={lead.id.toString()} index={idx}>
                                                {(provided, snapshot) => (
                                                    <Card ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                                        sx={{
                                                            mb: 2,
                                                            borderRadius: 3,
                                                            boxShadow: snapshot.isDragging ? 8 : 2,
                                                            transform: snapshot.isDragging ? 'scale(1.03)' : 'none',
                                                            transition: 'box-shadow 0.2s, transform 0.2s',
                                                            position: 'relative',
                                                            ':hover .kanban-actions': { opacity: 1, pointerEvents: 'auto' },
                                                            bgcolor: '#fff',
                                                            minHeight: 120,
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            justifyContent: 'space-between',
                                                        }}
                                                        aria-label={`Lead card for ${lead.name || lead.first_name || ''}`}
                                                    >
                                                        <CardContent sx={{ pb: 1 }}>
                                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                                <Avatar src={lead.avatar_url} alt={lead.name} sx={{ width: 40, height: 40, mr: 1 }} />
                                                                <Box>
                                                                    <Typography variant="subtitle1" fontWeight={700}>{lead.name || (lead.first_name + ' ' + lead.last_name)}</Typography>
                                                                    <Typography variant="body2" color="text.secondary">{lead.email}</Typography>
                                                                    <Typography variant="body2" color="text.secondary">{lead.phone}</Typography>
                                                                </Box>
                                                            </Stack>
                                                            <Stack direction="row" spacing={1} mt={1}>
                                                                {lead.company_name && <Chip label={lead.company_name} size="small" />}
                                                                {lead.tags && lead.tags.split(',').map((tag: string) => <Chip key={tag} label={tag} size="small" color="secondary" />)}
                                                            </Stack>
                                                        </CardContent>
                                                        <Box className="kanban-actions" sx={{ position: 'absolute', top: 8, right: 8, opacity: 0, pointerEvents: 'none', transition: 'opacity 0.2s', display: 'flex', gap: 1 }}>
                                                            <Tooltip title="Add Note"><IconButton size="small" onClick={() => handleAddNote(lead)}><NoteAddIcon /></IconButton></Tooltip>
                                                            <Tooltip title="Assign Owner"><IconButton size="small" onClick={() => handleAssignOwner(lead)}><PersonAddIcon /></IconButton></Tooltip>
                                                            <Tooltip title="Convert"><IconButton size="small" onClick={() => handleConvert(lead)}><SwapHorizIcon /></IconButton></Tooltip>
                                                            <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleBulkAction()}><DeleteIcon /></IconButton></Tooltip>
                                                        </Box>
                                                    </Card>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </Box>
                                )}
                            </Droppable>
                        </Paper>
                    ))}
                </Stack>
            </DragDropContext>
        </>
    );
} 