import { Chip } from '@mui/material';
import { forwardRef } from 'react';

import { cn } from '../../utils/index.js';
import styles from './StatusChip.module.css';
import type { StatusChipProps } from './StatusChip.types.js';

export const StatusChip = forwardRef<HTMLSpanElement, StatusChipProps>(({ className, label, variant = 'pending', ...props }, ref) => (
    <Chip className={cn(styles.chip, styles[variant], className)} component="span" label={label} ref={ref} {...props} />
));

StatusChip.displayName = 'StatusChip';
