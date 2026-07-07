import { Box, Card as MuiCard } from '@mui/material';
import { forwardRef } from 'react';

import { cn } from '../../utils/index.js';
import styles from './Card.module.css';
import type { CardProps } from './Card.types.js';

export const Card = forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
    <MuiCard className={cn(styles.card, className)} ref={ref} {...props} />
));

Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
    <Box className={cn(styles.header, className)} ref={ref} {...props} />
));

CardHeader.displayName = 'CardHeader';

export const CardBody = forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
    <Box className={cn(styles.body, className)} ref={ref} {...props} />
));

CardBody.displayName = 'CardBody';

export const CardFooter = forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
    <Box className={cn(styles.footer, className)} ref={ref} {...props} />
));

CardFooter.displayName = 'CardFooter';
