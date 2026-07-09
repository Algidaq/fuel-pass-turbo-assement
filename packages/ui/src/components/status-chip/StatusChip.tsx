import { Chip } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { forwardRef } from 'react';

import type { StatusChipProps } from './StatusChip.types.js';

const statusChipBaseSx = {
    alignItems: 'center',
    borderRadius: '999px',
    display: 'inline-flex',
    fontSize: '0.75rem',
    fontWeight: 700,
    height: 'auto',
    lineHeight: 1,
    padding: '0.25rem 0.55rem',
    textTransform: 'uppercase',
    '& .MuiChip-label': {
        padding: '0.2rem',
    },
} satisfies SxProps<Theme>;

const statusChipColorByVariant = {
    cancelled: {
        background: 'var(--fp-danger-subtle)',
        color: 'var(--fp-danger)',
    },
    completed: {
        background: 'var(--fp-success-subtle)',
        color: 'var(--fp-success)',
    },
    confirmed: {
        background: 'var(--fp-info-subtle)',
        color: 'var(--fp-info)',
    },
    error: {
        background: 'var(--fp-danger-subtle)',
        color: 'var(--fp-danger)',
    },
    pending: {
        background: 'var(--fp-warning-subtle)',
        color: 'var(--fp-warning)',
    },
} satisfies Record<NonNullable<StatusChipProps['variant']>, SxProps<Theme>>;

export const StatusChip = forwardRef<HTMLSpanElement, StatusChipProps>(({ className, label, variant = 'pending', ...props }, ref) => {
    return (
        <Chip
            className={className}
            component="span"
            label={label}
            ref={ref}
            sx={{ ...statusChipBaseSx, ...statusChipColorByVariant[variant] }}
            {...props}
        />
    );
});

StatusChip.displayName = 'StatusChip';
