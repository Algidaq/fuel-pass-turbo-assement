import { Input as BaseInput } from '@base-ui/react/input';
import { forwardRef } from 'react';

import { cn } from '../../utils/index.js';
import styles from './Input.module.css';
import type { InputProps } from './Input.types.js';

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, error = false, ...props }, ref) => (
    <BaseInput
        aria-invalid={error || props['aria-invalid'] ? true : undefined}
        className={cn(styles.input, error && styles.error, className)}
        ref={ref}
        {...props}
    />
));

Input.displayName = 'Input';
