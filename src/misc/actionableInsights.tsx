import React from 'react';
import { Card, CardContent, Typography, Box, Stack, Tooltip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import InsightsIcon from '@mui/icons-material/Insights';


export function getActionableInsights({ contacts = [], deals = [], tasks = [] }: { contacts?: any[]; deals?: any[]; tasks?: any[] }) {
  // Mock/demo logic for insights
  const insights = [];
  if (deals.length > 0) {
    const won = deals.filter(d => d.stage === 'won').length;
    const lost = deals.filter(d => d.stage === 'lost').length;
    if (won > lost) insights.push({ type: 'trend', text: `Deal win rate is up (${won} won, ${lost} lost)`, explanation: 'More deals are being won than lost this month.' });
    else if (lost > 0) insights.push({ type: 'risk', text: `Deal loss rate is high (${lost} lost)`, explanation: 'More deals are being lost than won.' });
  }
  const hotContacts = contacts.filter(c => c.status === 'hot');
  if (hotContacts.length > 0) {
    const inactive = hotContacts.filter(c => {
      if (!c.last_seen) return true;
      const days = (Date.now() - new Date(c.last_seen).getTime()) / (1000 * 60 * 60 * 24);
      return days > 14;
    });
    if (inactive.length > 0) insights.push({ type: 'risk', text: `${inactive.length} hot leads inactive for 14+ days`, explanation: 'Hot leads have not been contacted recently.' });
  }
  if (tasks.length > 0) {
    const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date());
    if (overdue.length > 0) insights.push({ type: 'risk', text: `${overdue.length} tasks are overdue`, explanation: 'Some tasks have not been completed by their due date.' });
  }
  if (insights.length === 0) insights.push({ type: 'info', text: 'All systems normal. No urgent insights.', explanation: 'No trends or risks detected.' });
  return insights;
}

export function ActionableInsightsWidget({ insights, onInsightClick }: { insights: { type: string; text: string; explanation?: string }[]; onInsightClick?: (insight: any) => void }) {
  return (
    <Box>
      <Stack direction="row" alignItems="center" gap={0.5} p={1}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#2563eb' }}>Actionable Insights</Typography>
      </Stack>
      <Stack direction="column" spacing={2} p={1}>
        {insights.map((insight, idx) => (
          <Tooltip key={idx} title={insight.explanation || ''} arrow>
            <Card
              sx={{
                minWidth: 220,
                borderLeft: insight.type === 'risk' ? '4px solid #ef4444' : insight.type === 'trend' ? '4px solid #22c55e' : '4px solid #2563eb',
                boxShadow: 2,
                transition: 'box-shadow 0.15s',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 6,
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)',
                },
              }}
              onClick={() => onInsightClick && onInsightClick(insight)}
              tabIndex={0}
              role="button"
              aria-label={insight.text}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  {insight.type === 'trend' && <TrendingUpIcon color="success" sx={{ mr: 1 }} />}
                  {insight.type === 'risk' && <WarningIcon color="error" sx={{ mr: 1 }} />}
                  {insight.type === 'info' && <InsightsIcon color="primary" sx={{ mr: 1 }} />}
                  <Typography variant="body1" fontWeight={600}>{insight.text}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Tooltip>
        ))}
      </Stack>
    </Box>
  );
} 