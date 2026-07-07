import { Field } from '@base-ui/react/field';

import { cn } from '../../utils/index.js';
import styles from './FormField.module.css';
import type { FormFieldProps } from './FormField.types.js';

export const FormField = ({ children, className, error, hint, label, required = false, ...props }: FormFieldProps) => (
    <Field.Root className={cn(styles.root, className)} invalid={Boolean(error)} {...props}>
        <Field.Label className={styles.label}>
            {label} {required ? <span className={styles.required}>*</span> : null}
        </Field.Label>
        {children}
        {hint ? <Field.Description className={styles.hint}>{hint}</Field.Description> : null}
        {error && <span className={styles.error}>{error}</span>}
    </Field.Root>
);
