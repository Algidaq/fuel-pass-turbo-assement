import type { InputHTMLAttributes } from 'react';

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
    className?: string;
    error?: boolean;
};
