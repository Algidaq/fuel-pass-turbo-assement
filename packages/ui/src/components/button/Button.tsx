import { Button as MuiButton } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { forwardRef } from 'react';

import type { ButtonProps } from './Button.types.js';

const muiButtonVariantByVariant = {
    danger: 'contained',
    ghost: 'text',
    primary: 'contained',
    secondary: 'outlined',
} as const;

const muiButtonColorByVariant = {
    danger: 'error',
    ghost: 'primary',
    primary: 'primary',
    secondary: 'primary',
} as const;

const buttonBaseSx = {
    alignItems: 'center',
    border: '1px solid transparent',
    borderRadius: 'var(--fp-radius-md)',
    cursor: 'pointer',
    display: 'inline-flex',
    font: 'inherit',
    fontWeight: 600,
    gap: 'var(--fp-space-2)',
    justifyContent: 'center',
    lineHeight: 1.25,
    minWidth: 'auto',
    textTransform: 'none',
    transition: 'background-color 120ms ease, border-color 120ms ease, color 120ms ease, box-shadow 120ms ease',
    '&:focus-visible': {
        boxShadow: 'var(--fp-focus-ring)',
        outline: 'none',
    },
    '&:disabled, &[data-disabled]': {
        cursor: 'not-allowed',
        opacity: 0.55,
    },
} satisfies SxProps<Theme>;

const buttonSizeSxBySize = {
    lg: {
        fontSize: '1rem',
        minHeight: '2.75rem',
        padding: '0.75rem 1.25rem',
    },
    md: {
        fontSize: '0.9375rem',
        minHeight: '2.5rem',
        padding: '0.5rem 1rem',
    },
    sm: {
        fontSize: '0.875rem',
        minHeight: '2rem',
        padding: '0.375rem 0.75rem',
    },
} satisfies Record<NonNullable<ButtonProps['size']>, SxProps<Theme>>;

const buttonColorSxByVariant = {
    danger: {
        background: 'var(--fp-danger)',
        color: '#ffffff',
        '&:hover:not(:disabled)': {
            background: '#9f3737',
        },
    },
    ghost: {
        background: 'transparent',
        color: 'var(--fp-foreground)',
        '&:hover:not(:disabled)': {
            background: 'var(--fp-muted)',
        },
    },
    primary: {
        background: 'var(--fp-primary)',
        color: 'var(--fp-primary-foreground)',
        '&:hover:not(:disabled)': {
            background: 'var(--fp-primary-hover)',
        },
    },
    secondary: {
        background: 'var(--fp-surface)',
        borderColor: 'var(--fp-border)',
        color: 'var(--fp-foreground)',
        '&:hover:not(:disabled)': {
            background: 'var(--fp-muted)',
        },
    },
} satisfies Record<NonNullable<ButtonProps['variant']>, SxProps<Theme>>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, size = 'md', sx, type = 'button', variant = 'primary', ...props }, ref) => {
        const buttonSx = sx
            ? ([
                  buttonBaseSx,
                  buttonSizeSxBySize[size],
                  buttonColorSxByVariant[variant],
                  ...(Array.isArray(sx) ? sx : [sx]),
              ] as SxProps<Theme>)
            : ([buttonBaseSx, buttonSizeSxBySize[size], buttonColorSxByVariant[variant]] as SxProps<Theme>);

        return (
            <MuiButton
                color={muiButtonColorByVariant[variant]}
                className={className}
                disableElevation
                ref={ref}
                sx={buttonSx}
                type={type}
                variant={muiButtonVariantByVariant[variant]}
                {...props}
            />
        );
    }
);

Button.displayName = 'Button';
