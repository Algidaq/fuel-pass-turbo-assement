import { forwardRef } from 'react';

import { cn } from '../../utils/index.js';
import styles from './Table.module.css';
import type { TableBodyProps, TableCellProps, TableHeadProps, TableHeaderProps, TableProps, TableRowProps } from './Table.types.js';

export const Table = forwardRef<HTMLTableElement, TableProps>(({ className, ...props }, ref) => (
    <table className={cn(styles.table, className)} ref={ref} {...props} />
));

Table.displayName = 'Table';

export const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>((props, ref) => <thead ref={ref} {...props} />);

TableHeader.displayName = 'TableHeader';

export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>((props, ref) => <tbody ref={ref} {...props} />);

TableBody.displayName = 'TableBody';

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(({ className, ...props }, ref) => (
    <tr className={cn(styles.row, className)} ref={ref} {...props} />
));

TableRow.displayName = 'TableRow';

export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(({ className, scope = 'col', ...props }, ref) => (
    <th className={cn(styles.head, className)} ref={ref} scope={scope} {...props} />
));

TableHead.displayName = 'TableHead';

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(({ className, ...props }, ref) => (
    <td className={cn(styles.cell, className)} ref={ref} {...props} />
));

TableCell.displayName = 'TableCell';
