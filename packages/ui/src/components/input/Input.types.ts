import type { Input } from '@base-ui/react/input';

export type InputProps = Omit<Input.Props, 'className'> & {
    className?: string;
    error?: boolean;
};
