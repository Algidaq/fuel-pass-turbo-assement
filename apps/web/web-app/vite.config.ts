import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: [
            {
                find: '@fuel-pass/ui/styles.css',
                replacement: fileURLToPath(new URL('../../../packages/ui/src/styles/theme.css', import.meta.url)),
            },
            {
                find: '@fuel-pass/ui',
                replacement: fileURLToPath(new URL('../../../packages/ui/src/index.ts', import.meta.url)),
            },
        ],
    },
    server: {
        fs: {
            allow: [fileURLToPath(new URL('../../..', import.meta.url))],
        },
    },
    optimizeDeps: {
        exclude: ['@fuel-pass/ui'],
    },
});
