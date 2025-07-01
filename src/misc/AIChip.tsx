import React, { useState } from 'react';
import { Chip, Tooltip, CircularProgress, Box, IconButton, Fade } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined';
import { motion } from 'framer-motion';

interface AIChipProps {
  label: string;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  icon?: React.ReactNode;
  explanation?: string;
  loading?: boolean;
  onFeedback?: (feedback: 'up' | 'down') => void;
  sx?: any;
}

export const AIChip: React.FC<AIChipProps> = ({
  label,
  color = 'primary',
  icon,
  explanation,
  loading = false,
  onFeedback,
  sx = {},
}) => {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [hovered, setHovered] = useState(false);

  let chipIcon: React.ReactElement | undefined = undefined;
  if (loading) {
    chipIcon = <CircularProgress size={18} color={color} />;
  } else if (React.isValidElement(icon)) {
    chipIcon = icon;
  } else {
    chipIcon = <SmartToyIcon fontSize="small" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.07 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{ display: 'inline-block' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Tooltip title={explanation || ''} arrow disableHoverListener={!explanation}>
        <Box display="inline-flex" alignItems="center" gap={0.5}>
          <Chip
            icon={chipIcon}
            label={label}
            color={color}
            size="small"
            sx={{ fontWeight: 700, letterSpacing: 1, ...sx, opacity: loading ? 0.7 : 1, transition: 'box-shadow 0.2s', boxShadow: hovered ? 3 : 0 }}
          />
          {onFeedback && !loading && (
            <Fade in={hovered || feedback !== null}>
              <Box display="flex" alignItems="center" gap={0.5} ml={0.5}>
                <IconButton
                  size="small"
                  color={feedback === 'up' ? 'success' : 'default'}
                  onClick={() => { setFeedback('up'); onFeedback('up'); }}
                  aria-label="AI suggestion helpful"
                >
                  <ThumbUpAltOutlinedIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color={feedback === 'down' ? 'error' : 'default'}
                  onClick={() => { setFeedback('down'); onFeedback('down'); }}
                  aria-label="AI suggestion not helpful"
                >
                  <ThumbDownAltOutlinedIcon fontSize="small" />
                </IconButton>
              </Box>
            </Fade>
          )}
        </Box>
      </Tooltip>
    </motion.div>
  );
}; 