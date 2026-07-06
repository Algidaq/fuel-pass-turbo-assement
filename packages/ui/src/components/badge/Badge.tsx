import { forwardRef } from 'react';

import { cn } from '../../utils/index.js';
import styles from './Badge.module.css';
import type { BadgeProps } from './Badge.types.js';

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(({ className, variant = 'neutral', ...props }, ref) => (
    <span className={cn(styles.badge, styles[variant], className)} ref={ref} {...props} />
));

Badge.displayName = 'Badge';
