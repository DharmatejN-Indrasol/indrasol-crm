import React from 'react';
import { Chip, Tooltip } from '@mui/material';

export function getPredictiveScore(record: any): number {
  // Mock: score based on last_seen, nb_deals, nb_contacts, or random
  if (record.last_seen) {
    // More recent = higher score
    const days = (Date.now() - new Date(record.last_seen).getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, 100 - Math.round(days));
  }
  if (typeof record.nb_deals === 'number') {
    return Math.min(100, 50 + record.nb_deals * 5);
  }
  if (typeof record.nb_contacts === 'number') {
    return Math.min(100, 40 + record.nb_contacts * 3);
  }
  return Math.floor(Math.random() * 100);
}

export function PredictiveScoreChip({ score }: { score: number }) {
  let color: 'success' | 'warning' | 'error' = 'success';
  let label = 'High';
  if (score < 40) {
    color = 'error';
    label = 'Low';
  } else if (score < 70) {
    color = 'warning';
    label = 'Medium';
  }
  return (
    <Tooltip title={`Likelihood to convert: ${label} (${score}/100)`}>
      <Chip label={`Score: ${score}`} color={color} size="small" sx={{ ml: 1, fontWeight: 600 }} />
    </Tooltip>
  );
} 