import * as AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import * as TrashIcon from '@mui/icons-material/Delete';
import * as EditIcon from '@mui/icons-material/Edit';
import * as ContentSave from '@mui/icons-material/Save';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import {
    Box,
    Button,
    Chip,
    IconButton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { useState, useEffect } from 'react';
import {
    Form,
    ReferenceField,
    useDelete,
    useNotify,
    useRefresh,
    useResourceContext,
    useUpdate,
    WithRecord,
} from 'react-admin';
import { FieldValues, SubmitHandler } from 'react-hook-form';

import { CompanyAvatar } from '../companies/CompanyAvatar';
import { Avatar } from '../contacts/Avatar';
import { RelativeDate } from '../misc/RelativeDate';
import { Status } from '../misc/Status';
import { supabase } from '../providers/supabase/supabase';
import { SaleName } from '../sales/SaleName';
import { ContactNote, DealNote } from '../types';
import { NoteAttachments } from './NoteAttachments';
import { NoteInputs } from './NoteInputs';
import { getNoteSummaryAndSentiment, getAINextAction, AISummaryResult, AINextActionResult } from '../misc/aiService';
import { AIChip } from '../misc/AIChip';

export function SentimentIcon({ sentiment }: { sentiment?: string }) {
    if (!sentiment) return null;
    if (sentiment === 'positive') {
        return <SentimentSatisfiedAltIcon fontSize="small" color="success" />;
    } else if (sentiment === 'negative') {
        return <SentimentDissatisfiedIcon fontSize="small" color="error" />;
    } else {
        return <SentimentNeutralIcon fontSize="small" color="warning" />;
    }
}

export const Note = ({
    showStatus,
    note,
    isLast,
}: {
    showStatus?: boolean;
    note: DealNote | ContactNote;
    isLast: boolean;
}) => {
    const [isHover, setHover] = useState(false);
    const [isEditing, setEditing] = useState(false);
    const [isSummarizing, setSummarizing] = useState(false);
    const resource = useResourceContext();
    const notify = useNotify();
    const refresh = useRefresh();

    const [update, { isPending }] = useUpdate();

    const [deleteNote] = useDelete(
        resource,
        { id: note.id, previousData: note },
        {
            mutationMode: 'undoable',
            onSuccess: () => {
                notify('Note deleted', { type: 'info', undoable: true });
            },
        }
    );

    const handleDelete = () => {
        deleteNote();
    };

    const handleEnterEditMode = () => {
        setEditing(!isEditing);
    };

    const handleCancelEdit = () => {
        setEditing(false);
        setHover(false);
    };

    const handleSummarize = async () => {
        if (!note.text) return;
        setSummarizing(true);
        try {
            const { error } = await supabase.functions.invoke('summarize-notes', {
                body: {
                    note_id: note.id,
                    note_type: 'deal_id' in note ? 'deal' : 'contact',
                },
            });

            if (error) {
                throw new Error(error.message);
            }
            notify('Summary generated!', { type: 'success' });
            refresh();
        } catch (error: any) {
            notify(error.message, { type: 'error' });
        } finally {
            setSummarizing(false);
        }
    };

    const handleNoteUpdate: SubmitHandler<FieldValues> = values => {
        update(
            resource,
            { id: note.id, data: values, previousData: note },
            {
                onSuccess: () => {
                    setEditing(false);
                    setHover(false);
                },
            }
        );
    };

    const [ai, setAI] = useState<{summary?: string, sentiment?: string, nextAction?: string, error?: string}>({});
    const [aiLoading, setAILoading] = useState(true);
    const [aiError, setAIError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setAILoading(true);
        Promise.all([
            getNoteSummaryAndSentiment(note),
            getAINextAction({ type: 'note', note })
        ]).then(([summarySentiment, nextAction]) => {
            if (!cancelled) {
                setAI({
                    summary: summarySentiment.summary,
                    sentiment: summarySentiment.sentiment,
                    error: summarySentiment.error || nextAction.error,
                    nextAction: nextAction.action,
                });
                setAILoading(false);
            }
        }).catch(e => {
            if (!cancelled) {
                setAIError('AI unavailable');
                setAILoading(false);
            }
        });
        return () => { cancelled = true; };
    }, [note]);

    const handleFeedback = (feedback: 'up' | 'down') => { /* TODO: send feedback to analytics */ };

    return (
        <Box
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            pb={1}
        >
            {/* AI Chips Row */}
            <Stack direction="row" alignItems="center" gap={1} mb={1}>
                {ai.summary && !ai.error && (
                    <AIChip label="AI: Summary" color="primary" explanation="AI-generated summary of this note." onFeedback={handleFeedback} loading={aiLoading} />
                )}
                {ai.sentiment && !ai.error && (
                    <AIChip label={`AI: ${ai.sentiment.charAt(0).toUpperCase() + ai.sentiment.slice(1)}`} color={ai.sentiment === 'positive' ? 'success' : ai.sentiment === 'negative' ? 'error' : 'warning'} explanation="AI-analyzed sentiment of this note." onFeedback={handleFeedback} loading={aiLoading} />
                )}
                {ai.nextAction && !ai.error && (
                    <AIChip label={ai.nextAction} color="info" explanation="AI suggests the next best action based on note content." onFeedback={handleFeedback} loading={aiLoading} />
                )}
                {(aiError || ai.error) && (
                    <AIChip label={String(aiError || ai.error || 'AI error')} color="warning" explanation="AI service is currently unavailable." />
                )}
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" width="100%">
                {resource === 'contactNote' ? (
                    <Avatar width={20} height={20} />
                ) : (
                    <ReferenceField
                        source="company_id"
                        reference="companies"
                        link="show"
                    >
                        <CompanyAvatar width={20} height={20} />
                    </ReferenceField>
                )}
                <Typography color="text.secondary" variant="body2">
                    <ReferenceField
                        record={note}
                        resource={resource}
                        source="sales_id"
                        reference="sales"
                        link={false}
                    >
                        <WithRecord
                            render={record => <SaleName sale={record} />}
                        />
                    </ReferenceField>{' '}
                    added a note{' '}
                    {showStatus && note.status && (
                        <Status status={note.status} />
                    )}
                    <Box
                        component="span"
                        sx={{
                            ml: 2,
                            visibility: isHover ? 'visible' : 'hidden',
                        }}
                    >
                        <Tooltip title="Edit note">
                            <IconButton
                                size="small"
                                onClick={handleEnterEditMode}
                            >
                                <EditIcon.default />
                            </IconButton>
                        </Tooltip>
                        {!note.summary && note.text && (
                            <Tooltip title="Summarize note with AI">
                                <IconButton
                                    size="small"
                                    onClick={handleSummarize}
                                    disabled={isSummarizing}
                                >
                                    <AutoFixHighIcon.default />
                                </IconButton>
                            </Tooltip>
                        )}
                        <Tooltip title="Delete note">
                            <IconButton size="small" onClick={handleDelete}>
                                <TrashIcon.default />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Typography>
                <Box flex={1}></Box>
                <Typography
                    color="textSecondary"
                    variant="body2"
                    component="span"
                >
                    <RelativeDate date={note.date} />
                </Typography>
            </Stack>
            {isEditing ? (
                <Form onSubmit={handleNoteUpdate} record={note}>
                    <NoteInputs showStatus={showStatus} edition />
                    <Box display="flex" justifyContent="flex-start" mt={1}>
                        <Button
                            type="submit"
                            color="primary"
                            variant="contained"
                            disabled={isPending}
                            startIcon={<ContentSave.default />}
                        >
                            Update Note
                        </Button>
                        <Button
                            sx={{ ml: 1 }}
                            onClick={handleCancelEdit}
                            color="primary"
                        >
                            Cancel
                        </Button>
                    </Box>
                </Form>
            ) : (
                <Stack
                    sx={{
                        paddingTop: '0.5em',
                        display: 'flex',
                        '& p:empty': {
                            minHeight: '0.75em',
                        },
                    }}
                >
                    {note.text
                        ?.split('\n')
                        .map((paragraph: string, index: number) => (
                            <Typography
                                component="p"
                                variant="body2"
                                lineHeight={1.5}
                                margin={0}
                                key={index}
                            >
                                {paragraph}
                            </Typography>
                        ))}

                    {note.summary && (
                        <Box
                            sx={{
                                mt: 2,
                                p: 2,
                                bgcolor: 'grey.100',
                                borderRadius: 1,
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <Box flex={1}>
                                <Typography variant="subtitle2" gutterBottom>
                                    ✨ AI Summary
                                </Typography>
                                <Typography
                                    component="p"
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    {note.summary}
                                </Typography>
                            </Box>
                            <SentimentIcon sentiment={ai.sentiment} />
                        </Box>
                    )}
                    {!note.summary && ai.sentiment && (
                        <Box mt={1}>
                            <SentimentIcon sentiment={ai.sentiment} />
                        </Box>
                    )}

                    {note.attachments && <NoteAttachments note={note} />}

                    <Box display="flex" alignItems="center" gap={1}>
                        <SentimentIcon sentiment={ai.sentiment} />
                        <Typography variant="body2" color="text.secondary">{ai.summary}</Typography>
                    </Box>
                </Stack>
            )}
        </Box>
    );
};
