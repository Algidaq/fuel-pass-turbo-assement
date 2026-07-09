import {
    Table as MuiTable,
    TableBody as MuiTableBody,
    TableCell as MuiTableCell,
    TableHead as MuiTableHead,
    TableRow as MuiTableRow,
} from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { forwardRef } from 'react';

import type { TableBodyProps, TableCellProps, TableHeadProps, TableHeaderProps, TableProps, TableRowProps } from './Table.types.js';

const tableSx = {
    borderCollapse: 'collapse',
    color: 'var(--fp-foreground)',
    fontSize: '0.9375rem',
    width: '100%',
} satisfies SxProps<Theme>;

const tableCellSx = {
    borderBottom: '1px solid var(--fp-border)',
    padding: '0.75rem 1rem',
    textAlign: 'left',
    verticalAlign: 'middle',
} satisfies SxProps<Theme>;

const tableHeadSx = {
    ...tableCellSx,
    background: 'var(--fp-surface-subtle)',
    color: 'var(--fp-muted-foreground)',
    fontSize: '0.8125rem',
    fontWeight: 700,
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
} satisfies SxProps<Theme>;

const tableRowSx = {
    '&:hover .MuiTableCell-body': {
        background: '#f4f4f5',
    },
} satisfies SxProps<Theme>;

export const Table = forwardRef<HTMLTableElement, TableProps>(({ className, ...props }, ref) => (
    <MuiTable className={className} ref={ref} sx={tableSx} {...props} />
));

Table.displayName = 'Table';

export const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>((props, ref) => <MuiTableHead ref={ref} {...props} />);

TableHeader.displayName = 'TableHeader';

export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>((props, ref) => <MuiTableBody ref={ref} {...props} />);

TableBody.displayName = 'TableBody';

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(({ className, ...props }, ref) => (
    <MuiTableRow className={className} ref={ref} sx={tableRowSx} {...props} />
));

TableRow.displayName = 'TableRow';

export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(({ align, className, scope = 'col', ...props }, ref) => (
    <MuiTableCell
        align={align === 'char' ? undefined : align}
        className={className}
        component="th"
        ref={ref}
        scope={scope}
        sx={tableHeadSx}
        {...props}
    />
));

TableHead.displayName = 'TableHead';

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(({ align, className, ...props }, ref) => (
    <MuiTableCell align={align === 'char' ? undefined : align} className={className} ref={ref} sx={tableCellSx} {...props} />
));

TableCell.displayName = 'TableCell';
