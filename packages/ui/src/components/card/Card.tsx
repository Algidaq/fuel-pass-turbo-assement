import { Box, Card as MuiCard } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { forwardRef } from 'react';

import type { CardProps } from './Card.types.js';

const cardSx = {
    background: 'var(--fp-surface)',
    border: '1px solid var(--fp-border)',
    borderRadius: 'var(--fp-radius-lg)',
    boxShadow: 'var(--fp-shadow-sm)',
} satisfies SxProps<Theme>;

const cardSectionSx = {
    padding: 'var(--fp-space-8)',
} satisfies SxProps<Theme>;

const cardHeaderSx = {
    ...cardSectionSx,
    borderBottom: '1px solid var(--fp-border)',
} satisfies SxProps<Theme>;

const cardFooterSx = {
    ...cardSectionSx,
    borderTop: '1px solid var(--fp-border)',
} satisfies SxProps<Theme>;

export const Card = forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
    <MuiCard className={className} ref={ref} sx={cardSx} {...props} />
));

Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
    <Box className={className} ref={ref} sx={cardHeaderSx} {...props} />
));

CardHeader.displayName = 'CardHeader';

export const CardBody = forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
    <Box className={className} ref={ref} sx={cardSectionSx} {...props} />
));

CardBody.displayName = 'CardBody';

export const CardFooter = forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
    <Box className={className} ref={ref} sx={cardFooterSx} {...props} />
));

CardFooter.displayName = 'CardFooter';
