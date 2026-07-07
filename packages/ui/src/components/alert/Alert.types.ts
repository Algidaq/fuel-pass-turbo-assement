import type { HTMLAttributes } from 'react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

export type AlertProps = Omit<HTMLAttributes<HTMLDivElement>, 'color'> & {
    variant?: AlertVariant;
};
