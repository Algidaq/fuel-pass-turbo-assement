import type { SelectChangeEvent, SelectProps as MuiSelectProps } from '@mui/material/Select';
import type { ReactNode } from 'react';

export type SelectOption = {
    disabled?: boolean;
    label: ReactNode;
    value: string;
};

export type SelectProps = Omit<MuiSelectProps<string>, 'children' | 'className' | 'onChange'> & {
    className?: string;
    error?: boolean;
    onChange?: (event: SelectChangeEvent<string>, child: ReactNode) => void;
    onValueChange?: (value: string) => void;
    options: SelectOption[];
    placeholder?: ReactNode;
    popupClassName?: string;
    triggerClassName?: string;
};
