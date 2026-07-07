import { InputBase } from '@mui/material';
import { forwardRef } from 'react';

import { cn } from '../../utils/index.js';
import styles from './NumberInput.module.css';
import type { NumberInputProps } from './NumberInput.types.js';

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
    ({ className, error = false, inputClassName, onValueChange, value, ...props }, ref) => (
        <InputBase
            aria-invalid={error ? true : undefined}
            className={cn(styles.root, className)}
            classes={{ input: cn(styles.input, error && styles.error, inputClassName) }}
            fullWidth
            inputProps={props}
            inputRef={ref}
            onChange={(event) => {
                const nextValue = event.target.value === '' ? null : Number(event.target.value);
                onValueChange?.(Number.isNaN(nextValue) ? null : nextValue);
            }}
            type="number"
            value={value ?? ''}
        />
    )
);

NumberInput.displayName = 'NumberInput';
