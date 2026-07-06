import { forwardRef } from 'react';

import { cn } from '../../utils/index.js';
import styles from './StatusChip.module.css';
import type { StatusChipProps } from './StatusChip.types.js';

export const StatusChip = forwardRef<HTMLSpanElement, StatusChipProps>(({ className, label, variant = 'pending', ...props }, ref) => (
    <span className={cn(styles.chip, styles[variant], className)} ref={ref} {...props}>
        {label}
    </span>
));

StatusChip.displayName = 'StatusChip';
