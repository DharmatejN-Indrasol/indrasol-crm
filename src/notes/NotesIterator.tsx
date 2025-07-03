import * as React from 'react';
import { Box, Divider, IconButton, Skeleton, Stack, ToggleButton, ToggleButtonGroup, Tooltip, Typography, Chip } from '@mui/material';
import { useListContext } from 'react-admin';
import { getNoteSummaryAndSentiment, getAINextAction, AISummaryResult, AINextActionResult } from '../misc/aiService';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SortIcon from '@mui/icons-material/Sort';
import { Note, SentimentIcon } from './Note';
import { NoteCreate } from './NoteCreate';
import { useState, useEffect } from 'react';
import SmartToyIcon from '@mui/icons-material/SmartToy';

export const NotesIterator = ({
    showStatus,
    reference,
}: {
    showStatus?: boolean;
    reference: 'contacts' | 'deals';
}) => {
    const { data, error, isPending } = useListContext();
    const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');
    const [sortBySentiment, setSortBySentiment] = useState(false);
    const [ai, setAI] = useState<{summaryCount: number, overallSentiment: string, nextAction?: string, error?: string}>({ summaryCount: 0, overallSentiment: 'neutral' });
    const [aiLoading, setAILoading] = useState(true);
    const [aiError, setAIError] = useState<string | null>(null);
    const [aiByNoteId, setAiByNoteId] = useState<Record<string, { summary: string; sentiment: string }>>({});

    // Filtering
    let filtered = data || [];
    if (sentimentFilter !== 'all') {
        // We'll filter after AI loads
    }
    // Sorting
    if (sortBySentiment) {
        // We'll sort after AI loads
    }

    useEffect(() => {
        let cancelled = false;
        setAILoading(true);
        if (!filtered.length) {
            setAI({ summaryCount: 0, overallSentiment: 'neutral' });
            setAILoading(false);
            setAiByNoteId({});
            return;
        }
        // Batch AI: get summary/sentiment for all notes
        Promise.all(filtered.map(note => getNoteSummaryAndSentiment(note).then(r => ({ id: note.id, ...r })))).then(results => {
            if (cancelled) return;
            let summaryCount = 0;
            let sentiments: string[] = [];
            let error: string | undefined;
            const aiMap: Record<string, { summary: string; sentiment: string }> = {};
            results.forEach(r => {
                if (r.summary) summaryCount++;
                sentiments.push(r.sentiment);
                if (r.error) error = r.error;
                aiMap[r.id] = { summary: r.summary, sentiment: r.sentiment };
            });
            let overallSentiment = 'neutral';
            const positives = sentiments.filter(s => s === 'positive').length;
            const negatives = sentiments.filter(s => s === 'negative').length;
            if (positives > negatives) overallSentiment = 'positive';
            else if (negatives > positives) overallSentiment = 'negative';
            // Filter and sort after AI
            let filteredAI = results.map((r, i) => ({ ...r, note: filtered[i] }));
            if (sentimentFilter !== 'all') {
                filteredAI = filteredAI.filter(r => r.sentiment === sentimentFilter);
            }
            if (sortBySentiment) {
                const order = ['positive', 'neutral', 'negative'];
                filteredAI = [...filteredAI].sort((a, b) => order.indexOf(a.sentiment) - order.indexOf(b.sentiment));
            }
            setAI({ summaryCount, overallSentiment, error });
            setAiByNoteId(aiMap);
            setAILoading(false);
        }).catch(e => {
            if (!cancelled) {
                setAIError('AI unavailable');
                setAILoading(false);
            }
        });
        // Next action (single for list)
        getAINextAction({ type: 'note-list', notes: filtered }).then(res => {
            if (!cancelled) setAI(ai => ({ ...ai, nextAction: res.action, error: ai.error || res.error }));
        });
        return () => { cancelled = true; };
    }, [data, sentimentFilter, sortBySentiment]);
    const handleFeedback = (feedback: 'up' | 'down') => { /* TODO: send feedback to analytics */ };
    return (
        <Box mt={2}>
            <NoteCreate showStatus={showStatus} reference={reference} />
            <ToggleButtonGroup
                value={sentimentFilter}
                exclusive
                onChange={(_, v) => v && setSentimentFilter(v)}
                size="small"
            >
                <ToggleButton value="all">All</ToggleButton>
                <ToggleButton value="positive"><SentimentSatisfiedAltIcon color="success" /></ToggleButton>
                <ToggleButton value="neutral"><SentimentNeutralIcon color="warning" /></ToggleButton>
                <ToggleButton value="negative"><SentimentDissatisfiedIcon color="error" /></ToggleButton>
            </ToggleButtonGroup>
            <IconButton onClick={() => setSortBySentiment(s => !s)} size="small" color={sortBySentiment ? 'primary' : 'default'}>
                <SortIcon />
            </IconButton>
            <Typography variant="caption">Sort by sentiment</Typography>
            {filtered && (
                <Stack mt={2} gap={1}>
                    {filtered.map((note, index) => (
                        <React.Fragment key={index}>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Tooltip title={`Sentiment: ${aiByNoteId[note.id]?.sentiment || ''}`}>
                                    <SentimentIcon sentiment={aiByNoteId[note.id]?.sentiment} />
                                </Tooltip>
                                <Typography variant="body2" color="text.secondary">{aiByNoteId[note.id]?.summary || ''}</Typography>
                            </Box>
                            <Note
                                note={note}
                                isLast={index === filtered.length - 1}
                                showStatus={showStatus}
                                key={index}
                            />
                            {index < filtered.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                </Stack>
            )}
        </Box>
    );
};

const MemoNote = React.memo(Note);
