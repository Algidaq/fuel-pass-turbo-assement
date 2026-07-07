import { MenuItem, Select as MuiSelect } from '@mui/material';

import { cn } from '../../utils/index.js';
import styles from './Select.module.css';
import type { SelectProps } from './Select.types.js';

export const Select = ({
    className,
    error = false,
    onChange,
    onValueChange,
    options,
    placeholder = 'Select an option',
    popupClassName,
    triggerClassName,
    ...props
}: SelectProps) => (
    <MuiSelect
        aria-invalid={error ? true : undefined}
        className={cn(styles.trigger, error && styles.error, triggerClassName, className)}
        displayEmpty
        error={error}
        MenuProps={{
            classes: {
                paper: cn(styles.popup, popupClassName),
                list: styles.list,
            },
        }}
        onChange={(event, child) => {
            onValueChange?.(event.target.value);
            onChange?.(event, child);
        }}
        renderValue={(selectedValue) => {
            if (!selectedValue) {
                return <span className={styles.placeholder}>{placeholder}</span>;
            }

            return options.find((option) => option.value === selectedValue)?.label ?? selectedValue;
        }}
        variant="outlined"
        {...props}
    >
        {options.map((option) => (
            <MenuItem className={styles.item} disabled={option.disabled} key={option.value} value={option.value}>
                {option.label}
            </MenuItem>
        ))}
    </MuiSelect>
);
