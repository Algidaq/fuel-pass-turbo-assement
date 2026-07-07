import { Chip } from '@mui/material';
import { forwardRef } from 'react';

import { cn } from '../../utils/index.js';
import styles from './Badge.module.css';
import type { BadgeProps } from './Badge.types.js';

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(({ children, className, variant = 'neutral', ...props }, ref) => (
    <Chip className={cn(styles.badge, styles[variant], className)} component="span" label={children} ref={ref} {...props} />
));

Badge.displayName = 'Badge';
