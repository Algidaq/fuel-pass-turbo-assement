import { defineConfig } from 'eslint/config';
import config from '@fuel-pass/eslint-config/backend';
export default defineConfig(...config, {
    ignores: ['**/out-tsc', '**/tests/**/*.spec.ts', '**/tests/**/*.test.ts'],
});
