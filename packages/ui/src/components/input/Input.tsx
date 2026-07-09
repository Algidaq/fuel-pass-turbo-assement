import { InputBase } from '@mui/material';
import type { InputBaseComponentProps } from '@mui/material/InputBase';
import type { SxProps, Theme } from '@mui/material/styles';
import { forwardRef } from 'react';

import type { InputProps } from './Input.types.js';

const getInputSx = (error: boolean): SxProps<Theme> => ({
    '& .MuiInputBase-input': {
        background: 'var(--fp-surface)',
        border: '1px solid',
        borderColor: error ? 'var(--fp-danger)' : 'var(--fp-border)',
        borderRadius: 'var(--fp-radius-md)',
        color: 'var(--fp-foreground)',
        font: 'inherit',
        padding: '0.5rem 0.75rem',
        transition: 'border-color 120ms ease, box-shadow 120ms ease',
        width: '100%',
        '&::placeholder': {
            color: 'var(--fp-muted-foreground)',
            opacity: 1,
        },
        '&:focus-visible': {
            boxShadow: 'var(--fp-focus-ring)',
            outline: 'none',
        },
        '&:disabled, &[data-disabled]': {
            cursor: 'not-allowed',
            opacity: 0.55,
        },
    },
});

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, error = false, ...props }, ref) => (
    <InputBase
        aria-invalid={error || props['aria-invalid'] ? true : undefined}
        classes={{ input: className }}
        fullWidth
        inputProps={props as InputBaseComponentProps}
        inputRef={ref}
        sx={getInputSx(error)}
    />
));

Input.displayName = 'Input';
