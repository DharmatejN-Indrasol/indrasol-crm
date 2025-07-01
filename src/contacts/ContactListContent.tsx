/* eslint-disable import/no-anonymous-default-export */
import type { Theme } from '@mui/material';
import {
    Checkbox,
    List,
    ListItem,
    ListItemAvatar,
    ListItemButton,
    ListItemIcon,
    ListItemSecondaryAction,
    ListItemText,
    Typography,
    useMediaQuery,
    Skeleton,
    Chip,
    Tooltip,
} from '@mui/material';
import { formatRelative } from 'date-fns';
import {
    RecordContextProvider,
    ReferenceField,
    SimpleListLoading,
    TextField,
    useListContext,
} from 'react-admin';
import { Link } from 'react-router-dom';
import React, { useRef, useLayoutEffect, useCallback } from 'react';
import { VariableSizeList as VirtualList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { Status } from '../misc/Status';
import { Contact } from '../types';
import { Avatar } from './Avatar';
import { TagsList } from './TagsList';
import { AIChip } from '../misc/AIChip';

const DEFAULT_ROW_HEIGHT = 80;

export const ContactListContent = () => {
    const {
        data: contacts = [],
        error,
        isPending,
        onToggleItem,
        selectedIds,
    } = useListContext<Contact>();
    const isSmall = useMediaQuery((theme: Theme) =>
        theme.breakpoints.down('md')
    );
    if (isPending) {
        return (
            <List>
                {Array.from({ length: 8 }).map((_, i) => (
                    <ListItem key={i} sx={{ borderRadius: 2, mb: 1, boxShadow: 1 }}>
                        <ListItemAvatar><Skeleton variant="circular" width={40} height={40} /></ListItemAvatar>
                        <ListItemText primary={<Skeleton width="60%" />} secondary={<Skeleton width="40%" />} />
                    </ListItem>
                ))}
            </List>
        );
    }
    if (error) {
        return null;
    }
    const now = Date.now();

    if (contacts.length === 0) {
        return (
            <List>
                <ListItem sx={{ flexDirection: 'column', alignItems: 'center', py: 4 }}>
                    <Chip icon={<SmartToyIcon fontSize="small" />} label="AI" color="primary" size="small" sx={{ fontWeight: 700, letterSpacing: 1, mb: 2 }} />
                    <ListItemText primary={<Typography variant="h6" fontWeight={700}>No contacts found</Typography>} secondary={<Typography variant="body2" color="text.secondary">It seems your contact list is empty. Use the AI-powered import or create a new contact.</Typography>} />
                </ListItem>
            </List>
        );
    }

    // Dynamic row height measurement
    const rowHeights = useRef<{ [key: number]: number }>({});
    const listRef = useRef<any>(null);
    const getItemSize = (index: number) => rowHeights.current[index] || DEFAULT_ROW_HEIGHT;
    const setRowHeight = useCallback((index: number, size: number) => {
        if (rowHeights.current[index] !== size) {
            rowHeights.current[index] = size;
            if (listRef.current) {
                listRef.current.resetAfterIndex(index);
            }
        }
    }, []);

    const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const contact = contacts[index];
        const rowRef = useRef<HTMLDivElement>(null);
        useLayoutEffect(() => {
            if (rowRef.current) {
                setRowHeight(index, rowRef.current.getBoundingClientRect().height);
            }
        }, [index, setRowHeight, contact]);
        // Mock AI highlight: hot if even id, at risk if odd id
        const isHot = Number(contact.id) % 2 === 0;
        const isAtRisk = Number(contact.id) % 3 === 0;
        return (
            <div ref={rowRef} style={{ ...style, height: style.height, width: '100%', overflow: 'hidden' }}>
                <RecordContextProvider key={contact.id} value={contact}>
                    <ListItem disablePadding sx={{ height: '100%', borderRadius: 2, mb: 1, boxShadow: 1, transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 3 } }}>
                        <ListItemButton
                            component={Link}
                            to={`/contacts/${contact.id}/show`}
                            sx={{ height: '100%' }}
                        >
                            <ListItemIcon sx={{ minWidth: '2.5em' }}>
                                <Checkbox
                                    edge="start"
                                    checked={selectedIds.includes(contact.id)}
                                    tabIndex={-1}
                                    disableRipple
                                    onClick={e => {
                                        e.stopPropagation();
                                        onToggleItem(contact.id);
                                    }}
                                />
                            </ListItemIcon>
                            <ListItemAvatar>
                                <Avatar />
                            </ListItemAvatar>
                            <ListItemText
                                primary={<>
                                    {`${contact.first_name} ${contact.last_name ?? ''}`}
                                    {isHot && <AIChip label="AI: Hot" color="error" explanation="AI predicts this contact is highly engaged." onFeedback={() => {}} sx={{ ml: 1 }} />}
                                    {isAtRisk && <AIChip label="AI: At risk" color="warning" explanation="AI predicts this contact may churn soon." onFeedback={() => {}} sx={{ ml: 1 }} />}
                                </>}
                                secondary={
                                    <>
                                        {contact.title}
                                        {contact.title && contact.company_id != null && ' at '}
                                        {contact.company_id != null && (
                                            <ReferenceField
                                                source="company_id"
                                                reference="companies"
                                                link={false}
                                            >
                                                <TextField source="name" />
                                            </ReferenceField>
                                        )}
                                        {contact.nb_tasks
                                            ? ` - ${contact.nb_tasks} task${contact.nb_tasks > 1 ? 's' : ''}`
                                            : ''}
                                        &nbsp;&nbsp;
                                        <TagsList />
                                    </>
                                }
                            />
                            {contact.last_seen && (
                                <ListItemSecondaryAction
                                    sx={{
                                        top: '10px',
                                        transform: 'none',
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        color="textSecondary"
                                        title={contact.last_seen}
                                    >
                                        {!isSmall && 'last activity '}
                                        {formatRelative(contact.last_seen, now)}{' '}
                                        <Status status={contact.status} />
                                    </Typography>
                                </ListItemSecondaryAction>
                            )}
                        </ListItemButton>
                    </ListItem>
                </RecordContextProvider>
            </div>
        );
    };

    return (
        <div style={{ flex: 1, minHeight: 300 }}>
            <AutoSizer>
                {({ height, width }) => (
                    <VirtualList
                        ref={listRef}
                        height={height}
                        itemCount={contacts.length}
                        itemSize={getItemSize}
                        width={width}
                    >
                        {Row}
                    </VirtualList>
                )}
            </AutoSizer>
        </div>
    );
};

const MemoAvatar = React.memo(Avatar);
const MemoTagsList = React.memo(TagsList);
