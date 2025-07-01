import * as React from 'react';
import { Breadcrumbs as MUIBreadcrumbs, Link, Typography, Box } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  maxItems?: number;
  sx?: any;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, maxItems = 4, sx }) => {
  return (
    <MUIBreadcrumbs
      aria-label="breadcrumb"
      separator={<NavigateNextIcon fontSize="small" sx={{ color: 'text.disabled' }} />}
      maxItems={maxItems}
      sx={{ fontWeight: 500, fontSize: '1rem', mb: 1, ...sx }}
    >
      {items.map((item, idx) =>
        item.href && idx !== items.length - 1 ? (
          <Link
            key={item.label + idx}
            color="inherit"
            underline="hover"
            href={item.href}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            {item.icon && <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>{item.icon}</Box>}
            {item.label}
          </Link>
        ) : (
          <Typography
            key={item.label + idx}
            color={idx === items.length - 1 ? 'text.primary' : 'text.secondary'}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            aria-current={idx === items.length - 1 ? 'page' : undefined}
          >
            {item.icon && <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>{item.icon}</Box>}
            {item.label}
          </Typography>
        )
      )}
    </MUIBreadcrumbs>
  );
};

export default Breadcrumbs; 