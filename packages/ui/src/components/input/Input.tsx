import { InputBase } from '@mui/material';
import { forwardRef } from 'react';

import { cn } from '../../utils/index.js';
import styles from './Input.module.css';
import type { InputProps } from './Input.types.js';

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, error = false, ...props }, ref) => (
    <InputBase
        aria-invalid={error || props['aria-invalid'] ? true : undefined}
        classes={{ input: cn(styles.input, error && styles.error, className) }}
        fullWidth
        inputProps={props}
        inputRef={ref}
    />
));

Input.displayName = 'Input';
