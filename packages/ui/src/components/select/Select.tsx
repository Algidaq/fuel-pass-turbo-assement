import { Box, MenuItem, Select as MuiSelect } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

import { cn } from '../../utils/index.js';
import type { SelectProps } from './Select.types.js';

const getSelectTriggerSx = (error: boolean): SxProps<Theme> => ({
    height: '2rem',
    alignItems: 'center',
    background: 'var(--fp-surface)',
    border: '1px solid',
    borderColor: error ? 'var(--fp-danger)' : 'var(--fp-border)',
    borderRadius: 'var(--fp-radius-md)',
    color: 'var(--fp-foreground)',
    cursor: 'pointer',
    display: 'inline-flex',
    font: 'inherit',
    gap: 'var(--fp-space-2)',
    justifyContent: 'space-between',
    padding: '0.5rem 0.75rem',
    textAlign: 'left',
    transition: 'border-color 120ms ease, box-shadow 120ms ease',
    width: '100%',
    '&:focus-visible, &.Mui-focused': {
        boxShadow: 'var(--fp-focus-ring)',
        outline: 'none',
    },
    '& .MuiOutlinedInput-notchedOutline': {
        border: 0,
    },
    '& .MuiSelect-select': {
        alignItems: 'center',
        display: 'flex',
        minHeight: 'auto',
        padding: 0,
    },
    '&[data-disabled], &.Mui-disabled': {
        cursor: 'not-allowed',
        opacity: 0.55,
    },
    '&[data-placeholder]': {
        color: 'var(--fp-muted-foreground)',
    },
});

const selectPlaceholderSx = {
    color: 'var(--fp-muted-foreground)',
} satisfies SxProps<Theme>;

const selectPopupSx = {
    background: 'var(--fp-surface)',
    border: '1px solid var(--fp-border)',
    borderRadius: 'var(--fp-radius-md)',
    boxShadow: 'var(--fp-shadow-md)',
    minWidth: 'var(--anchor-width)',
    overflow: 'hidden',
} satisfies SxProps<Theme>;

const selectListSx = {
    maxHeight: '18rem',
    overflow: 'auto',
    padding: 'var(--fp-space-1)',
} satisfies SxProps<Theme>;

const selectItemSx = {
    alignItems: 'center',
    borderRadius: 'var(--fp-radius-sm)',
    color: 'var(--fp-foreground)',
    cursor: 'pointer',
    display: 'flex',
    fontSize: '0.9375rem',
    gap: 'var(--fp-space-3)',
    justifyContent: 'space-between',
    padding: '0.5rem 0.625rem',
    '&.Mui-focusVisible, &:hover': {
        background: 'var(--fp-muted)',
        outline: 'none',
    },
    '&.Mui-disabled, &[data-disabled]': {
        cursor: 'not-allowed',
        opacity: 0.5,
    },
} satisfies SxProps<Theme>;

export const Select = ({
    className,
    error = false,
    MenuProps,
    onChange,
    onValueChange,
    options,
    placeholder = 'Select an option',
    popupClassName,
    sx,
    triggerClassName,
    ...props
}: SelectProps) => {
    const menuSlotProps = MenuProps?.slotProps;
    const paperSlotProps = typeof menuSlotProps?.paper === 'function' ? undefined : menuSlotProps?.paper;
    const listSlotProps = typeof menuSlotProps?.list === 'function' ? undefined : menuSlotProps?.list;
    const triggerSx = sx ? ([getSelectTriggerSx(error), sx] as SxProps<Theme>) : getSelectTriggerSx(error);
    const listSx = listSlotProps?.sx ? ([selectListSx, listSlotProps.sx] as SxProps<Theme>) : selectListSx;
    const paperSx = paperSlotProps?.sx ? ([selectPopupSx, paperSlotProps.sx] as SxProps<Theme>) : selectPopupSx;

    return (
        <MuiSelect
            aria-invalid={error ? true : undefined}
            className={cn(triggerClassName, className)}
            displayEmpty
            error={error}
            MenuProps={{
                ...MenuProps,
                slotProps: {
                    ...menuSlotProps,
                    list: {
                        ...listSlotProps,
                        sx: listSx,
                    },
                    paper: {
                        ...paperSlotProps,
                        className: cn(paperSlotProps?.className, popupClassName),
                        sx: paperSx,
                    },
                },
            }}
            onChange={(event, child) => {
                onValueChange?.(event.target.value);
                onChange?.(event, child);
            }}
            renderValue={(selectedValue) => {
                if (!selectedValue) {
                    return (
                        <Box component="span" sx={selectPlaceholderSx}>
                            {placeholder}
                        </Box>
                    );
                }

                return options.find((option) => option.value === selectedValue)?.label ?? selectedValue;
            }}
            sx={triggerSx}
            variant="outlined"
            {...props}
        >
            {options.map((option) => (
                <MenuItem disabled={option.disabled} key={option.value} sx={selectItemSx} value={option.value}>
                    {option.label}
                </MenuItem>
            ))}
        </MuiSelect>
    );
};
