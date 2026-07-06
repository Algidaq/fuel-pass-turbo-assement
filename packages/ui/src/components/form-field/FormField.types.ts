import type { ReactNode } from 'react';
import type { Field } from '@base-ui/react/field';

export type FormFieldProps = Omit<Field.Root.Props, 'children' | 'className'> & {
    children: ReactNode;
    className?: string;
    error?: ReactNode;
    hint?: ReactNode;
    label: ReactNode;
    required?: boolean;
};
