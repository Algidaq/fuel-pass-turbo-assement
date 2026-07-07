import type { HTMLAttributes } from 'react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

export type AlertProps = HTMLAttributes<HTMLDivElement> & {
    variant?: AlertVariant;
};
