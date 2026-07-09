import { InputBase } from '@mui/material';
import type { InputBaseComponentProps } from '@mui/material/InputBase';
import type { SxProps, Theme } from '@mui/material/styles';
import { forwardRef } from 'react';

import type { NumberInputProps } from './NumberInput.types.js';

const getNumberInputSx = (error: boolean): SxProps<Theme> => ({
    width: '100%',
    '& .MuiInputBase-input': {
        background: 'var(--fp-surface)',
        border: '1px solid',
        borderColor: error ? 'var(--fp-danger)' : 'var(--fp-border)',
        borderRadius: 'var(--fp-radius-md)',
        color: 'var(--fp-foreground)',
        font: 'inherit',
        minHeight: '2.5rem',
        padding: '0.5rem 0.75rem',
        transition: 'border-color 120ms ease, box-shadow 120ms ease',
        width: '100%',
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

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
    ({ className, error = false, inputClassName, onValueChange, value, ...props }, ref) => (
        <InputBase
            aria-invalid={error ? true : undefined}
            className={className}
            classes={{ input: inputClassName }}
            fullWidth
            inputProps={props as InputBaseComponentProps}
            inputRef={ref}
            onChange={(event) => {
                const nextValue = event.target.value === '' ? null : Number(event.target.value);
                onValueChange?.(Number.isNaN(nextValue) ? null : nextValue);
            }}
            sx={getNumberInputSx(error)}
            type="number"
            value={value ?? ''}
        />
    )
);

NumberInput.displayName = 'NumberInput';
