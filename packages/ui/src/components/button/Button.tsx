import { Button as BaseButton } from '@base-ui/react/button';
import { forwardRef } from 'react';

import { cn } from '../../utils/index.js';
import styles from './Button.module.css';
import type { ButtonProps } from './Button.types.js';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, size = 'md', type = 'button', variant = 'primary', ...props }, ref) => (
        <BaseButton className={cn(styles.button, styles[variant], styles[size], className)} ref={ref} type={type} {...props} />
    )
);

Button.displayName = 'Button';
