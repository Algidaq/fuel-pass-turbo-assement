import type { Button } from '@base-ui/react/button';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = Omit<Button.Props, 'className'> & {
    className?: string;
    size?: ButtonSize;
    variant?: ButtonVariant;
};
