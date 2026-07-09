import { Chip } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { forwardRef } from 'react';

import type { BadgeProps } from './Badge.types.js';

const badgeBaseSx = {
    alignItems: 'center',
    border: '1px solid transparent',
    borderRadius: '999px',
    display: 'inline-flex',
    fontSize: '0.75rem',
    fontWeight: 600,
    height: 'auto',
    lineHeight: 1,
    padding: '0.25rem 0.55rem',
    '& .MuiChip-label': {
        padding: 0,
    },
} satisfies SxProps<Theme>;

const badgeColorByVariant = {
    danger: {
        background: 'var(--fp-danger-subtle)',
        color: 'var(--fp-danger)',
    },
    info: {
        background: 'var(--fp-info-subtle)',
        color: 'var(--fp-info)',
    },
    neutral: {
        background: 'var(--fp-muted)',
        borderColor: 'var(--fp-border)',
        color: 'var(--fp-muted-foreground)',
    },
    success: {
        background: 'var(--fp-success-subtle)',
        color: 'var(--fp-success)',
    },
    warning: {
        background: 'var(--fp-warning-subtle)',
        color: 'var(--fp-warning)',
    },
} satisfies Record<NonNullable<BadgeProps['variant']>, SxProps<Theme>>;

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(({ children, className, variant = 'neutral', ...props }, ref) => (
    <Chip
        className={className}
        component="span"
        label={children}
        ref={ref}
        sx={{ ...badgeBaseSx, ...badgeColorByVariant[variant] }}
        {...props}
    />
));

Badge.displayName = 'Badge';
