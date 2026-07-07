import { Button as MuiButton } from '@mui/material';
import { forwardRef } from 'react';

import { cn } from '../../utils/index.js';
import styles from './Button.module.css';
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

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, size = 'md', type = 'button', variant = 'primary', ...props }, ref) => (
        <MuiButton
            color={muiButtonColorByVariant[variant]}
            className={cn(styles.button, styles[variant], styles[size], className)}
            disableElevation
            ref={ref}
            type={type}
            variant={muiButtonVariantByVariant[variant]}
            {...props}
        />
    )
);

Button.displayName = 'Button';
