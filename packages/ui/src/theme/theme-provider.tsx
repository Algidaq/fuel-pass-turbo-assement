import { CssBaseline, ThemeProvider as MuiThemeProvider } from '@mui/material';
import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '../utils/index.js';
import { aviationMuiTheme } from './mui-theme.js';

export type ThemeProviderTheme = 'light';

export type ThemeProviderProps = HTMLAttributes<HTMLDivElement> & {
    children: ReactNode;
    theme?: ThemeProviderTheme;
};

export const ThemeProvider = ({ children, className, theme = 'light', ...props }: ThemeProviderProps) => (
    <MuiThemeProvider theme={aviationMuiTheme}>
        <CssBaseline />
        <div className={cn('fp-theme', className)} data-theme={theme} {...props}>
            {children}
        </div>
    </MuiThemeProvider>
);
