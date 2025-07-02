import * as React from 'react';
import { useListContext } from 'react-admin';
import { isAfter } from 'date-fns';
import List from '@mui/material/List';
import { VariableSizeList as VirtualList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Task } from './Task';

const DEFAULT_ROW_HEIGHT = 100;

export const TasksIterator = ({
    showContact,
    sx,
    aiHighlight,
}: {
    showContact?: boolean;
    sx?: SxProps;
    aiHighlight?: boolean;
}) => {
    const { data, error, isPending } = useListContext();
    if (isPending || error || data.length === 0) return null;

    // Keep only tasks that are not done or done less than 5 minutes ago
    const tasks = data.filter(
        task =>
            !task.done_date ||
            isAfter(
                new Date(task.done_date),
                new Date(Date.now() - 5 * 60 * 1000)
            )
    );

    // Dynamic row height measurement
    const rowHeights = React.useRef<{ [key: number]: number }>({});
    const listRef = React.useRef<any>(null);
    const getItemSize = (index: number) => rowHeights.current[index] || DEFAULT_ROW_HEIGHT;
    const setRowHeight = React.useCallback((index: number, size: number) => {
        if (rowHeights.current[index] !== size) {
            rowHeights.current[index] = size;
            if (listRef.current) {
                listRef.current.resetAfterIndex(index);
            }
        }
    }, []);

    const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const rowRef = React.useRef<HTMLDivElement>(null);
        React.useLayoutEffect(() => {
            if (rowRef.current) {
                setRowHeight(index, rowRef.current.getBoundingClientRect().height);
            }
        }, [index, setRowHeight, tasks[index]]);
        return (
            <div ref={rowRef} style={{ ...style, height: style.height, width: '100%', overflow: 'hidden' }}>
                <Task task={tasks[index]} showContact={showContact} key={tasks[index].id} aiHighlight={aiHighlight && index === 0} />
            </div>
        );
    };

    return (
        <div style={{ flex: 1, minHeight:150 }}>
            <AutoSizer>
                {({ height, width }) => (
                    <VirtualList
                        ref={listRef}
                        height={height}
                        itemCount={tasks.length}
                        itemSize={getItemSize}
                        width={width}
                        style={undefined}
                    >
                        {Row}
                    </VirtualList>
                )}
            </AutoSizer>
        </div>
    );
};
