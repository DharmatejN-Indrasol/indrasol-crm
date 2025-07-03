import { Box, Button, Divider, List, Stack, Chip, Tooltip } from '@mui/material';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { VariableSizeList as VirtualList } from 'react-window';
import {
    COMPANY_CREATED,
    CONTACT_CREATED,
    CONTACT_NOTE_CREATED,
    DEAL_CREATED,
    DEAL_NOTE_CREATED,
} from '../consts';
import { Activity } from '../types';
import { ActivityLogCompanyCreated } from './ActivityLogCompanyCreated';
import { ActivityLogContactCreated } from './ActivityLogContactCreated';
import { ActivityLogContactNoteCreated } from './ActivityLogContactNoteCreated';
import { ActivityLogDealCreated } from './ActivityLogDealCreated';
import { ActivityLogDealNoteCreated } from './ActivityLogDealNoteCreated';

const DEFAULT_ROW_HEIGHT = 88;

type ActivityLogIteratorProps = {
    activities: Activity[];
    pageSize: number;
};

export function ActivityLogIterator({
    activities,
    pageSize,
}: ActivityLogIteratorProps) {
    const [activitiesDisplayed, setActivityDisplayed] = useState(pageSize);
    const filteredActivities = activities.slice(0, activitiesDisplayed);

    // Store measured heights
    const rowHeights = useRef<{ [key: number]: number }>({});
    const listRef = useRef<any>(null);

    // Function to get the height for a row
    const getItemSize = (index: number) => rowHeights.current[index] || DEFAULT_ROW_HEIGHT;

    // Callback to set the height for a row
    const setRowHeight = useCallback((index: number, size: number) => {
        if (rowHeights.current[index] !== size) {
            rowHeights.current[index] = size;
            if (listRef.current) {
                listRef.current.resetAfterIndex(index);
            }
        }
    }, []);

    const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const rowRef = useRef<HTMLDivElement>(null);
        useLayoutEffect(() => {
            if (rowRef.current) {
                setRowHeight(index, rowRef.current.getBoundingClientRect().height);
            }
        }, [index, setRowHeight, filteredActivities[index]]);
        return (
            <div
                ref={rowRef}
                style={{ ...style, position: 'relative', height: style.height, width: '100%', overflow: 'hidden' }}
            >
                <Stack sx={{ height: '100%' }}>
                    <ActivityItem key={filteredActivities[index].id} activity={filteredActivities[index]} />
                </Stack>
                <Divider />
            </div>
        );
    };

    // Infinite scroll: load more when near bottom
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (
            scrollHeight - scrollTop - clientHeight < 100 &&
            activitiesDisplayed < activities.length
        ) {
            setActivityDisplayed((prev) => Math.min(prev + pageSize, activities.length));
        }
    };

    return (
        <Box sx={{ width: '100%', minHeight: 300, overflowY: 'auto' }} onScroll={handleScroll}>
            <VirtualList
                ref={listRef}
                height={Math.max(Math.min(filteredActivities.length, 6) * DEFAULT_ROW_HEIGHT + 10, 300)}
                itemCount={filteredActivities.length}
                itemSize={getItemSize}
                width="100%"
                style={{ marginBottom: 8 }}
            >
                {Row}
            </VirtualList>
        </Box>
    );
}

function ActivityItem({ activity }: { activity: Activity }) {
    return (
        <>
            {activity.type === COMPANY_CREATED && <ActivityLogCompanyCreated activity={activity} />}
            {activity.type === CONTACT_CREATED && <ActivityLogContactCreated activity={activity} />}
            {activity.type === CONTACT_NOTE_CREATED && <ActivityLogContactNoteCreated activity={activity} />}
            {activity.type === DEAL_CREATED && <ActivityLogDealCreated activity={activity} />}
            {activity.type === DEAL_NOTE_CREATED && <ActivityLogDealNoteCreated activity={activity} />}
        </>
    );
}
