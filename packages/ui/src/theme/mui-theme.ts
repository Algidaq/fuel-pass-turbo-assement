import { createTheme } from '@mui/material/styles';

export const aviationMuiTheme = createTheme({
    palette: {
        mode: 'light',
        background: {
            default: '#faf8ff',
            paper: '#ffffff',
        },
        primary: {
            main: '#0f766e',
            dark: '#005c55',
            light: '#80d5cb',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#5d5e60',
            contrastText: '#ffffff',
        },
        error: {
            main: '#ba1a1a',
            contrastText: '#ffffff',
        },
        text: {
            primary: '#131b2e',
            secondary: '#3e4947',
        },
        divider: '#e2e8f0',
    },
    shape: {
        borderRadius: 10,
    },
    shadows: [
        'none',
        '0 1px 2px rgba(15, 23, 42, 0.06)',
        '0 1px 2px rgba(15, 23, 42, 0.06)',
        '0 1px 2px rgba(15, 23, 42, 0.06)',
        '0 1px 2px rgba(15, 23, 42, 0.06)',
        '0 1px 2px rgba(15, 23, 42, 0.06)',
        '0 1px 2px rgba(15, 23, 42, 0.06)',
        '0 1px 2px rgba(15, 23, 42, 0.06)',
        '0 1px 2px rgba(15, 23, 42, 0.06)',
        '0 1px 2px rgba(15, 23, 42, 0.06)',
        '0 1px 2px rgba(15, 23, 42, 0.06)',
        '0 1px 2px rgba(15, 23, 42, 0.06)',
        '0 1px 2px rgba(15, 23, 42, 0.06)',
        '0 1px 2px rgba(15, 23, 42, 0.06)',
        '0 1px 2px rgba(15, 23, 42, 0.06)',
        '0 1px 2px rgba(15, 23, 42, 0.06)',
        '0 1px 2px rgba(15, 23, 42, 0.06)',
        '0 1px 2px rgba(15, 23, 42, 0.06)',
        '0 1px 2px rgba(15, 23, 42, 0.06)',
        '0 1px 2px rgba(15, 23, 42, 0.06)',
        '0 1px 2px rgba(15, 23, 42, 0.06)',
        '0 1px 2px rgba(15, 23, 42, 0.06)',
        '0 1px 2px rgba(15, 23, 42, 0.06)',
        '0 1px 2px rgba(15, 23, 42, 0.06)',
        '0 1px 2px rgba(15, 23, 42, 0.06)',
    ],
    typography: {
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        h1: {
            fontSize: '28px',
            fontWeight: 600,
            lineHeight: '32px',
            letterSpacing: '-0.02em',
        },
        h2: {
            fontSize: '20px',
            fontWeight: 600,
            lineHeight: '28px',
            letterSpacing: '-0.01em',
        },
        body1: {
            fontSize: '14px',
            fontWeight: 400,
            lineHeight: '22px',
        },
        body2: {
            fontSize: '13px',
            fontWeight: 400,
            lineHeight: '18px',
        },
        button: {
            fontSize: '14px',
            fontWeight: 600,
            lineHeight: '20px',
            textTransform: 'none',
        },
    },
    components: {
        MuiButtonBase: {
            defaultProps: {
                disableRipple: true,
            },
        },
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    backgroundColor: '#faf8ff',
                    color: '#131b2e',
                },
            },
        },
    },
});
