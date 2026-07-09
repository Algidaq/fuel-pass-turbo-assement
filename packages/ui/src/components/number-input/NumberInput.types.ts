import type { InputHTMLAttributes } from 'react';

export type NumberInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'children' | 'className' | 'onChange' | 'type' | 'value'> & {
    className?: string;
    error?: boolean;
    inputClassName?: string;
    onValueChange?: (value: number | null) => void;
    value?: number | null;
};
