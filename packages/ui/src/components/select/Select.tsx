import { Select as BaseSelect } from '@base-ui/react/select';

import { cn } from '../../utils/index.js';
import styles from './Select.module.css';
import type { SelectProps } from './Select.types.js';

export const Select = ({ className, error = false, options, placeholder = 'Select an option', popupClassName, triggerClassName, ...props }: SelectProps) => (
    <BaseSelect.Root {...props}>
        <BaseSelect.Trigger
            aria-invalid={error ? true : undefined}
            className={cn(styles.trigger, error && styles.error, triggerClassName, className)}
        >
            <BaseSelect.Value placeholder={placeholder} />
            <BaseSelect.Icon className={styles.icon}>⌄</BaseSelect.Icon>
        </BaseSelect.Trigger>
        <BaseSelect.Portal>
            <BaseSelect.Positioner className={styles.positioner} sideOffset={6}>
                <BaseSelect.Popup className={cn(styles.popup, popupClassName)}>
                    <BaseSelect.List className={styles.list}>
                        {options.map((option) => (
                            <BaseSelect.Item className={styles.item} disabled={option.disabled} key={option.value} value={option.value}>
                                <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
                                <BaseSelect.ItemIndicator className={styles.indicator}>✓</BaseSelect.ItemIndicator>
                            </BaseSelect.Item>
                        ))}
                    </BaseSelect.List>
                </BaseSelect.Popup>
            </BaseSelect.Positioner>
        </BaseSelect.Portal>
    </BaseSelect.Root>
);
