import type { ReactNode } from 'react';
import type { Select as BaseSelect } from '@base-ui/react/select';

export type SelectOption = {
    disabled?: boolean;
    label: ReactNode;
    value: string;
};

export type SelectProps = Omit<BaseSelect.Root.Props<string>, 'children' | 'items'> & {
    className?: string;
    error?: boolean;
    options: SelectOption[];
    placeholder?: ReactNode;
    popupClassName?: string;
    triggerClassName?: string;
};
