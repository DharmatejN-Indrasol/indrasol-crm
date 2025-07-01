import * as React from 'react';
import { Card, Box, Stack, Typography, Button, Chip } from '@mui/material';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import { AddTask } from '../tasks/AddTask';
import {
    startOfToday,
    endOfToday,
    endOfTomorrow,
    endOfWeek,
    getDay,
} from 'date-fns';
import { TasksListFilter } from './TasksListFilter';
import { TasksListEmpty } from './TasksListEmpty';

const today = new Date();
const todayDayOfWeek = getDay(today);
const isBeforeFriday = todayDayOfWeek < 5; // Friday is represented by 5
const startOfTodayDateISO = startOfToday().toISOString();
const endOfTodayDateISO = endOfToday().toISOString();
const endOfTomorrowDateISO = endOfTomorrow().toISOString();
const endOfWeekDateISO = endOfWeek(today, { weekStartsOn: 0 }).toISOString();

const taskFilters = {
    overdue: { 'done_date@is': null, 'due_date@lt': startOfTodayDateISO },
    today: {
        'done_date@is': null,
        'due_date@gte': startOfTodayDateISO,
        'due_date@lte': endOfTodayDateISO,
    },
    tomorrow: {
        'done_date@is': null,
        'due_date@gt': endOfTodayDateISO,
        'due_date@lt': endOfTomorrowDateISO,
    },
    thisWeek: {
        'done_date@is': null,
        'due_date@gte': endOfTomorrowDateISO,
        'due_date@lte': endOfWeekDateISO,
    },
    later: { 'done_date@is': null, 'due_date@gt': endOfWeekDateISO },
};

// --- Mock AI Suggestion ---
const mockAISuggestedTask = {
    id: 'ai-suggested',
    text: 'Follow up with Jane Doe about the proposal',
    due_date: new Date().toISOString(),
    type: 'Follow-up',
    aiSuggested: true,
};

export const TasksList = () => {
    const [aiTask, setAiTask] = React.useState<any | null>(null);
    const handleAISuggest = () => {
        setAiTask({ ...mockAISuggestedTask, id: 'ai-suggested-' + Date.now() });
    };
    return (
        <Card sx={{ p: 2, boxShadow: 2, borderRadius: 3, '&:hover': { boxShadow: 4 }, transition: 'box-shadow 0.2s', mb: 2 }}>
            <Stack gap={1}>
                <Box display="flex" alignItems="center" mb={0.5}>
                    <Box mr={1} display="flex">
                        <AssignmentTurnedInIcon
                            color="disabled"
                            fontSize="medium"
                            aria-label="Upcoming Tasks"
                        />
                    </Box>
                    <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 0.2, fontSize: '1.1rem' }}>
                        Upcoming Tasks
                    </Typography>
                    <AddTask display="icon" selectContact />

                </Box>
                <Box display="flex" alignItems="center" mb={0.5}>
                    <Button
                        variant="outlined"
                        size="small"
                        sx={{ ml: 'auto', borderRadius: 2, fontWeight: 600, textTransform: 'none' }}
                        onClick={handleAISuggest}
                        startIcon={<span role="img" aria-label="AI">🤖</span>}
                    >
                        Let AI suggest next task
                    </Button>
                </Box>
                {aiTask && (
                    <Box mb={1}>
                        <Chip label="AI: Suggested Task" color="info" icon={<span>🤖</span>} sx={{ mr: 1 }} />
                        <Typography variant="body2" display="inline">{aiTask.text}</Typography>
                    </Box>
                )}
                <Box>
                    <Stack gap={1}>
                        <TasksListEmpty />
                        <TasksListFilter
                            title="Overdue"
                            filter={taskFilters.overdue}
                            aiHighlight={true}
                        />
                        <TasksListFilter title="Today" filter={taskFilters.today} aiHighlight={true} />
                        <TasksListFilter
                            title="Tomorrow"
                            filter={taskFilters.tomorrow}
                            aiHighlight={true}
                        />
                        {isBeforeFriday && (
                            <TasksListFilter
                                title="This week"
                                filter={taskFilters.thisWeek}
                                aiHighlight={true}
                            />
                        )}
                        <TasksListFilter title="Later" filter={taskFilters.later} aiHighlight={true} />
                    </Stack>
                </Box>
            </Stack>
        </Card>
    );
};
