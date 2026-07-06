import { NumberField } from '@base-ui/react/number-field';
import { forwardRef } from 'react';

import { cn } from '../../utils/index.js';
import styles from './NumberInput.module.css';
import type { NumberInputProps } from './NumberInput.types.js';

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(({ className, error = false, inputClassName, ...props }, ref) => (
    <NumberField.Root className={cn(styles.root, className)} {...props}>
        <NumberField.Input
            aria-invalid={error ? true : undefined}
            className={cn(styles.input, error && styles.error, inputClassName)}
            ref={ref}
        />
    </NumberField.Root>
));

NumberInput.displayName = 'NumberInput';
