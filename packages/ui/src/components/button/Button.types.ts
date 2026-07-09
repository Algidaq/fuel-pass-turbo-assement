import type { ButtonProps as MuiButtonProps } from '@mui/material/Button';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = Omit<MuiButtonProps, 'className' | 'color' | 'size' | 'variant'> & {
    className?: string;
    size?: ButtonSize;
    variant?: ButtonVariant;
};
