import { Alert as MuiAlert } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { forwardRef } from 'react';

import type { AlertProps } from './Alert.types.js';

const alertBaseSx = {
    border: '1px solid transparent',
    borderRadius: 'var(--fp-radius-md)',
    lineHeight: 1.5,
    padding: 'var(--fp-space-4)',
} satisfies SxProps<Theme>;

const alertColorByVariant = {
    danger: {
        background: 'var(--fp-danger-subtle)',
        borderColor: 'rgb(185 68 68 / 0.25)',
        color: 'var(--fp-danger)',
    },
    info: {
        background: 'var(--fp-info-subtle)',
        borderColor: 'rgb(47 111 159 / 0.25)',
        color: 'var(--fp-info)',
    },
    success: {
        background: 'var(--fp-success-subtle)',
        borderColor: 'rgb(47 125 84 / 0.25)',
        color: 'var(--fp-success)',
    },
    warning: {
        background: 'var(--fp-warning-subtle)',
        borderColor: 'rgb(183 121 31 / 0.25)',
        color: 'var(--fp-warning)',
    },
} satisfies Record<NonNullable<AlertProps['variant']>, SxProps<Theme>>;

export const Alert = forwardRef<HTMLDivElement, AlertProps>(({ className, role = 'status', variant = 'info', ...props }, ref) => (
    <MuiAlert
        className={className}
        icon={false}
        ref={ref}
        role={role}
        sx={{ ...alertBaseSx, ...alertColorByVariant[variant] }}
        {...props}
    />
));

Alert.displayName = 'Alert';
