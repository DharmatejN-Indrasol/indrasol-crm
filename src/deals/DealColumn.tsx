import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Box, Stack, Typography } from '@mui/material';
import { VariableSizeList as VirtualList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

import { Deal } from '../types';
import { DealCard } from './DealCard';
import { useConfigurationContext } from '../root/ConfigurationContext';
import { findDealLabel } from './deal';

const DEFAULT_DEAL_CARD_HEIGHT = 120; // Adjust as needed

export const DealColumn = ({
    stage,
    deals,
}: {
    stage: string;
    deals: Deal[];
}) => {
    const totalAmount = deals.reduce((sum, deal) => sum + deal.amount, 0);

    const { dealStages } = useConfigurationContext();

    // Dynamic row height measurement
    const rowHeights = React.useRef<{ [key: number]: number }>({});
    const listRef = React.useRef<any>(null);
    const getItemSize = (index: number) => rowHeights.current[index] || DEFAULT_DEAL_CARD_HEIGHT;
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
        }, [index, setRowHeight, deals[index]]);
        React.useEffect(() => {
            if (rowRef.current) {
                rowRef.current.style.opacity = '0';
                rowRef.current.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    rowRef.current && (rowRef.current.style.transition = 'opacity 0.4s cubic-bezier(0.4,0,0.2,1), transform 0.4s cubic-bezier(0.4,0,0.2,1)');
                    rowRef.current && (rowRef.current.style.opacity = '1');
                    rowRef.current && (rowRef.current.style.transform = 'none');
                }, 80 * index);
            }
        }, []);
        return (
            <div
                ref={rowRef}
                className="deal-card-animated"
                tabIndex={0}
                aria-label={`Deal card for ${deals[index].name}`}
                style={{ ...style, height: style.height, width: '100%', overflow: 'hidden', outline: 'none' }}
            >
                <DealCard key={deals[index].id} deal={deals[index]} index={index} />
            </div>
        );
    };

    return (
        <Box
            sx={{
                flex: '1 1 340px',
                minWidth: 320,
                maxWidth: 420,
                paddingTop: '8px',
                paddingBottom: '16px',
                bgcolor: '#eaeaee',
                '&:first-of-type': {
                    paddingLeft: '5px',
                    borderTopLeftRadius: 5,
                },
                '&:last-of-type': {
                    paddingRight: '5px',
                    borderTopRightRadius: 5,
                },
            }}
        >
            <Stack alignItems="center">
                <Typography variant="subtitle1">
                    {findDealLabel(dealStages, stage)}
                </Typography>
                <Typography
                    variant="subtitle1"
                    color="text.secondary"
                    fontSize="small"
                >
                    {totalAmount.toLocaleString('en-US', {
                        notation: 'compact',
                        style: 'currency',
                        currency: 'USD',
                        currencyDisplay: 'narrowSymbol',
                        minimumSignificantDigits: 3,
                    })}
                </Typography>
            </Stack>
            <Droppable droppableId={stage}>
                {(droppableProvided, snapshot) => (
                    <Box
                        ref={droppableProvided.innerRef}
                        {...droppableProvided.droppableProps}
                        className={
                            snapshot.isDraggingOver ? ' isDraggingOver' : ''
                        }
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: 1,
                            padding: '5px',
                            '&.isDraggingOver': {
                                bgcolor: '#dadadf',
                            },
                        }}
                    >
                        <div style={{ flex: 1, minHeight: 200 }}>
                            <AutoSizer disableHeight={false}>
                                {({ height, width }) => (
                                    <VirtualList
                                        ref={listRef}
                                        height={height}
                                        itemCount={deals.length}
                                        itemSize={getItemSize}
                                        width={width || 300}
                                    >
                                        {Row}
                                    </VirtualList>
                                )}
                            </AutoSizer>
                        </div>
                        {droppableProvided.placeholder}
                    </Box>
                )}
            </Droppable>
        </Box>
    );
};
