import { Grid, Stack, Skeleton, Chip, Typography, Divider, Box, Card, IconButton } from '@mui/material';
import { DashboardActivityLog } from './DashboardActivityLog';
import { DealsChart } from './DealsChart';
import { HotContacts } from './HotContacts';
import { TasksList } from './TasksList';
import { Welcome, WelcomeModal, useWelcomeModal } from './Welcome';
import { useGetList } from 'react-admin';
import { Contact, ContactNote } from '../types';
import { DashboardStepper } from './DashboardStepper';
import { getSmartReminders } from '../misc/smartReminders';
import { getActionableInsights } from '../misc/actionableInsights';
import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
// import SmartToyIcon from '@mui/icons-material/SmartToy';

const LazyActionableInsightsWidget = React.lazy(() => import('../misc/actionableInsights').then(m => ({ default: m.ActionableInsightsWidget })));
const LazySmartRemindersList = React.lazy(() => import('../misc/smartReminders').then(m => ({ default: m.SmartRemindersList })));

// --- Animated Counter ---
const AnimatedCounter = ({ value }: { value: number }) => {
    const [display, setDisplay] = React.useState(0);
    React.useEffect(() => {
        let start = 0;
        const duration = 1000;
        const startTime = performance.now();
        function animate(now: number) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            setDisplay(Math.floor(progress * value));
            if (progress < 1) requestAnimationFrame(animate);
            else setDisplay(value);
        }
        requestAnimationFrame(animate);
    }, [value]);
    return <Typography variant="h4" fontWeight={700}>{display}</Typography>;
};

// --- AI Trend Mock ---
const mockTrends = {
    deals: { trend: '+12%', text: 'AI: Up 12% vs last month' },
    contacts: { trend: '+8%', text: 'AI: Up 8% vs last month' },
    notes: { trend: '+5%', text: 'AI: Up 5% vs last month' },
};

// --- KPI Widget Row ---
const KPIWidget = ({ totalDeal, totalContact, totalContactNotes }: { totalDeal: number, totalContact: number, totalContactNotes: number }) => (
    <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={4}>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card sx={{ p: 3, borderRadius: 3, boxShadow: 4, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1, background: 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)' }}>
                    <Typography variant="subtitle2" color="text.secondary">Total Deals</Typography>
                    <AnimatedCounter value={totalDeal} />
                    <Box mt={1}>
                        <button style={{ border: 'none', background: '#fff', color: '#43e97b', borderRadius: 8, padding: '4px 12px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 4px #0001' }}>Ask AI</button>
                    </Box>
                </Card>
            </motion.div>
        </Grid>
        <Grid item xs={12} md={4}>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card sx={{ p: 3, borderRadius: 3, boxShadow: 4, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1, background: 'linear-gradient(90deg, #fa709a 0%, #fee140 100%)' }}>
                    <Typography variant="subtitle2" color="text.secondary">Total Contacts</Typography>
                    <AnimatedCounter value={totalContact} />
                    <Box mt={1}>
                        <button style={{ border: 'none', background: '#fff', color: '#fa709a', borderRadius: 8, padding: '4px 12px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 4px #0001' }}>Ask AI</button>
                    </Box>
                </Card>
            </motion.div>
        </Grid>
        <Grid item xs={12} md={4}>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card sx={{ p: 3, borderRadius: 3, boxShadow: 4, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1, background: 'linear-gradient(90deg, #30cfd0 0%, #330867 100%)', color: '#fff' }}>
                    <Typography variant="subtitle2" color="#fff">Total Notes</Typography>
                    <AnimatedCounter value={totalContactNotes} />
                    <Box mt={1}>
                        <button style={{ border: 'none', background: '#fff', color: '#330867', borderRadius: 8, padding: '4px 12px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 4px #0001' }}>Ask AI</button>
                    </Box>
                </Card>
            </motion.div>
        </Grid>
    </Grid>
);

// --- AI Suggestion Banner for HotContacts ---
const HotContactsAISuggestion = () => (
    <Card sx={{ mb: 2, p: 2, background: 'linear-gradient(90deg, #f7971e 0%, #ffd200 100%)', borderRadius: 2, boxShadow: 2 }}>
        <Typography variant="body1" fontWeight={600} color="#330867">
            AI recommends contacting <b>Jane Doe</b> today!
        </Typography>
        <Box mt={1}>
            <button style={{ border: 'none', background: '#330867', color: '#fff', borderRadius: 8, padding: '4px 12px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 4px #0001' }}>
                Let AI draft message
            </button>
        </Box>
    </Card>
);

// --- AI Summary for DealsChart ---
const DealsChartAISummary = () => (
    <Card sx={{ mt: 2, p: 2, background: 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)', borderRadius: 2, boxShadow: 2 }}>
        <Typography variant="body2" fontWeight={600} color="#330867">
            AI: Revenue is trending up, expect <b>$12,000</b> next month!
        </Typography>
    </Card>
);

// --- Conversational AI Modal ---
const examplePrompts = [
    'Show me my top deals this month',
    'Who should I contact next?',
    'Summarize my recent activity',
    'What are my most urgent tasks?'
];

const mockAIResponse = (input: string) => {
    if (input.toLowerCase().includes('deal')) return 'AI: Your top deal this month is with Acme Corp for $12,000.';
    if (input.toLowerCase().includes('contact')) return 'AI: You should contact Jane Doe next. She is most likely to convert.';
    if (input.toLowerCase().includes('activity')) return 'AI: You added 5 new notes and closed 2 deals in the last week.';
    if (input.toLowerCase().includes('task')) return 'AI: Your most urgent task is to follow up with John Smith.';
    return 'AI: I am here to help! Ask me anything about your CRM data.';
};

const ConversationalAIModal = ({ open, onClose }: { open: boolean, onClose: () => void }) => {
    const [input, setInput] = React.useState('');
    const [messages, setMessages] = React.useState<{ sender: 'user' | 'ai', text: string }[]>([
        { sender: 'ai', text: 'Hi! I am your CRM AI assistant. How can I help you today?' }
    ]);
    const handleSend = () => {
        if (!input.trim()) return;
        setMessages(msgs => [...msgs, { sender: 'user', text: input }]);
        setTimeout(() => {
            setMessages(msgs => [...msgs, { sender: 'ai', text: mockAIResponse(input) }]);
        }, 600);
        setInput('');
    };
    return (
        <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', bgcolor: 'rgba(0,0,0,0.25)', zIndex: 13000, display: open ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.2 }}>
                <Card sx={{ width: 400, maxWidth: '90vw', minHeight: 420, maxHeight: '80vh', p: 0, borderRadius: 4, boxShadow: 8, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <Box sx={{ p: 2, bgcolor: 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="h6" fontWeight={700} color="#330867">
                            🤖 Ask AI
                        </Typography>
                        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
                    </Box>
                    <Box sx={{ flex: 1, p: 2, bgcolor: '#f9f9f9', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {messages.map((msg, i) => (
                            <Box key={i} alignSelf={msg.sender === 'user' ? 'flex-end' : 'flex-start'} bgcolor={msg.sender === 'user' ? '#43e97b' : '#fff'} color={msg.sender === 'user' ? '#fff' : '#330867'} px={2} py={1} borderRadius={2} boxShadow={msg.sender === 'user' ? 2 : 1} maxWidth="80%">
                                {msg.text}
                            </Box>
                        ))}
                    </Box>
                    <Box sx={{ p: 2, borderTop: '1px solid #eee', bgcolor: '#fff' }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                                placeholder="Type your question..."
                                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 16, padding: 8, borderRadius: 8, background: '#f3f3f3' }}
                            />
                            <IconButton color="primary" onClick={handleSend}><SendIcon /></IconButton>
                        </Stack>
                        <Box mt={2}>
                            <Typography variant="caption" color="text.secondary">Try asking:</Typography>
                            <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                                {examplePrompts.map((prompt, i) => (
                                    <Chip key={i} label={prompt} onClick={() => setInput(prompt)} sx={{ cursor: 'pointer', mb: 1 }} />
                                ))}
                            </Stack>
                        </Box>
                    </Box>
                </Card>
            </motion.div>
        </Box>
    );
};

// --- Floating Ask AI Button ---
const FloatingAskAIButton = ({ onClick }: { onClick: () => void }) => (
    <Box sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 9999 }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1 }}>
            <button onClick={onClick} style={{ background: 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)', color: '#fff', border: 'none', borderRadius: '50%', width: 64, height: 64, fontSize: 32, boxShadow: '0 4px 24px #43e97b55', cursor: 'pointer' }} title="Ask AI">
                🤖
            </button>
        </motion.div>
    </Box>
);

// --- Mock AI Insights Card ---
const AIInsightsCard = () => (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card sx={{ p: 3, borderRadius: 3, boxShadow: 4, mb: 2, background: 'linear-gradient(90deg, #f7971e 0%, #ffd200 100%)' }}>
            <Typography variant="h6" fontWeight={700} mb={1}>
                AI Insights
            </Typography>
            <Typography variant="body1">
                AI predicts you are on track to close <b>3 more deals</b> this month!<br/>
                <span style={{ color: '#330867', fontWeight: 600 }}>Tip:</span> Reach out to your hot contacts for a higher win rate.
            </Typography>
        </Card>
    </motion.div>
);

// --- Loading Skeletons ---
const LoadingSkeletons: React.FunctionComponent = () => {
    return (
        <Grid container spacing={0.5} mt={0.5} rowGap={0.5} sx={{ background: 'background.paper', borderRadius: 2 }}>
            <Grid item xs={12} md={3}>
                <Stack gap={0.5}>
                    <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
                    <Skeleton variant="rectangular" height={240} sx={{ borderRadius: 2 }} />
                </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
                <Stack gap={0.5}>
                    <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 2 }} />
                    <Skeleton variant="rectangular" height={240} sx={{ borderRadius: 2 }} />
                </Stack>
            </Grid>
            <Grid item xs={12} md={3}>
                <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 2 }} />
            </Grid>
            <Grid item xs={12}>
                <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            </Grid>
            <Grid item xs={12}>
                <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            </Grid>
        </Grid>
    );
};

// --- Dashboard Main Content ---
type DashboardContentProps = {
    totalDeal: number | undefined;
    insights: any;
    topReminders: { reminder: string; name: string; type: string }[];
    contacts: Contact[] | undefined;
    totalContact: number | undefined;
    totalContactNotes: number | undefined;
};
const DashboardContent: React.FunctionComponent<DashboardContentProps> = ({ totalDeal, insights, topReminders, contacts, totalContact, totalContactNotes }) => {
    const { open, handleClose, handleTour } = useWelcomeModal();
    const [aiOpen, setAIOpen] = React.useState(false);
    return (
        <Box>
            <WelcomeModal open={open} onClose={handleClose} onTour={handleTour} />
            <KPIWidget totalDeal={totalDeal || 0} totalContact={totalContact || 0} totalContactNotes={totalContactNotes || 0} />
            <AIInsightsCard />
            <Grid
                container
                spacing={1}
                mt={0.5}
                rowGap={1}
                sx={{
                    background: 'background.paper',
                    borderRadius: 2,
                }}
            >
                <Grid item xs={12} md={3}>
                    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                        <Stack gap={0.5}>
                            {import.meta.env.VITE_IS_DEMO === 'true' ? (
                                <Welcome />
                            ) : null}
                            <HotContactsAISuggestion />
                            <HotContacts />
                        </Stack>
                    </motion.div>
                </Grid>
                <Grid item xs={12} md={6}>
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                        <Stack gap={0.5}>
                            {totalDeal ? <><DealsChart /><DealsChartAISummary /></> : null}
                            <DashboardActivityLog />
                        </Stack>
                    </motion.div>
                </Grid>
                <Grid item xs={12} md={3}>
                    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}>
                        <Suspense fallback={<Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />}>
                            <LazySmartRemindersList reminders={topReminders.map((r: { reminder: string; name: string; type: string }) => `${r.reminder} (${r.name})`)} />
                        </Suspense>
                        <Divider sx={{ my: 1 }} />
                        <Suspense fallback={<Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />}>
                            <LazyActionableInsightsWidget insights={insights} />
                        </Suspense>
                        <Divider sx={{ my: 1 }} />
                        <TasksList />
                    </motion.div>
                </Grid>
            </Grid>
            <FloatingAskAIButton onClick={() => setAIOpen(true)} />
            <ConversationalAIModal open={aiOpen} onClose={() => setAIOpen(false)} />
        </Box>
    );
};

// --- Dashboard Container ---
export const Dashboard = () => {
    // --- Data Fetching ---
    const {
        data: contacts,
        total: totalContact,
        isPending: isPendingContact,
    } = useGetList<Contact>('contacts', { pagination: { page: 1, perPage: 10 } });
    const { total: totalContactNotes, isPending: isPendingContactNotes } = useGetList<ContactNote>('contactnotes', { pagination: { page: 1, perPage: 1 } });
    const { data: deals, total: totalDeal, isPending: isPendingDeal } = useGetList<Contact>('deals', { pagination: { page: 1, perPage: 10 } });
    const { data: companies = [] } = useGetList('companies', { pagination: { page: 1, perPage: 10 } });
    const { data: tasks = [] } = useGetList('tasks', { pagination: { page: 1, perPage: 50 } });

    // --- Data Processing ---
    const allReminders = [
        ...(contacts || []).flatMap(contact => getSmartReminders(contact).map(reminder => ({
            type: 'contact',
            name: `${contact.first_name} ${contact.last_name}`,
            reminder,
        }))),
        ...companies.flatMap(company => getSmartReminders(company).map(reminder => ({
            type: 'company',
            name: company.name,
            reminder,
        }))),
    ];
    const topReminders = allReminders.slice(0, 5);
    const insights = getActionableInsights({ contacts, deals, tasks });
    const isPending = isPendingContact || isPendingContactNotes || isPendingDeal;

    // --- Conditional Rendering ---
    if (isPending) return <LoadingSkeletons />;
    if (!totalContact) return <DashboardStepper step={1} />;
    if (!totalContactNotes) return <DashboardStepper step={2} contactId={contacts?.[0]?.id} />;
    return <DashboardContent totalDeal={totalDeal} insights={insights} topReminders={topReminders} contacts={contacts} totalContact={totalContact} totalContactNotes={totalContactNotes} />;
};
