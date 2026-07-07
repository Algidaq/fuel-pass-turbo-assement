import { forwardRef } from 'react';

import { cn } from '../../utils/index.js';
import styles from './Alert.module.css';
import type { AlertProps } from './Alert.types.js';

export const Alert = forwardRef<HTMLDivElement, AlertProps>(({ className, role = 'status', variant = 'info', ...props }, ref) => (
    <div className={cn(styles.alert, styles[variant], className)} ref={ref} role={role} {...props} />
));

Alert.displayName = 'Alert';
