import type { HTMLAttributes } from 'react';

export type StatusChipVariant = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'error';

export type StatusChipProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
    label: string;
    variant?: StatusChipVariant;
};
