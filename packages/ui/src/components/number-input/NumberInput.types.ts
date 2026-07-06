import type { NumberField } from '@base-ui/react/number-field';

export type NumberInputProps = Omit<NumberField.Root.Props, 'children' | 'className'> & {
    className?: string;
    error?: boolean;
    inputClassName?: string;
};
