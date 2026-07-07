import type { HTMLAttributes } from 'react';

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export type BadgeProps = Omit<HTMLAttributes<HTMLSpanElement>, 'color'> & {
    variant?: BadgeVariant;
};
