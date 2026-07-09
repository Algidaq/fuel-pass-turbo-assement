import { Box, FormControl, FormHelperText, FormLabel } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

import type { FormFieldProps } from './FormField.types.js';

const formFieldSx = {
    display: 'grid',
    gap: 'var(--fp-space-2)',
} satisfies SxProps<Theme>;

const formLabelSx = {
    color: 'var(--fp-foreground)',
    fontSize: '0.875rem',
    fontWeight: 600,
    '&.Mui-error': {
        color: 'var(--fp-foreground)',
    },
} satisfies SxProps<Theme>;

const requiredSx = {
    color: 'var(--fp-danger)',
} satisfies SxProps<Theme>;

const helperTextSx = {
    color: 'var(--fp-muted-foreground)',
    fontSize: '0.8125rem',
    lineHeight: 1.4,
    margin: 0,
} satisfies SxProps<Theme>;

const errorTextSx = {
    ...helperTextSx,
    color: 'var(--fp-danger)',
} satisfies SxProps<Theme>;

export const FormField = ({ children, className, error, hint, label, required = false, ...props }: FormFieldProps) => (
    <FormControl className={className} error={Boolean(error)} required={required} sx={formFieldSx} {...props}>
        <FormLabel sx={formLabelSx}>
            {label}{' '}
            {required ? (
                <Box component="span" sx={requiredSx}>
                    *
                </Box>
            ) : null}
        </FormLabel>
        {children}
        {hint ? <FormHelperText sx={helperTextSx}>{hint}</FormHelperText> : null}
        {error ? <FormHelperText sx={errorTextSx}>{error}</FormHelperText> : null}
    </FormControl>
);
