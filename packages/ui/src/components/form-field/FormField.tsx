import { FormControl, FormHelperText, FormLabel } from '@mui/material';

import { cn } from '../../utils/index.js';
import styles from './FormField.module.css';
import type { FormFieldProps } from './FormField.types.js';

export const FormField = ({ children, className, error, hint, label, required = false, ...props }: FormFieldProps) => (
    <FormControl className={cn(styles.root, className)} error={Boolean(error)} required={required} {...props}>
        <FormLabel className={styles.label}>
            {label} {required ? <span className={styles.required}>*</span> : null}
        </FormLabel>
        {children}
        {hint ? <FormHelperText className={styles.hint}>{hint}</FormHelperText> : null}
        {error ? <FormHelperText className={styles.error}>{error}</FormHelperText> : null}
    </FormControl>
);
