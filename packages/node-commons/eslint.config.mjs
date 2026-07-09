import config from '@fuel-pass/eslint-config/backend';
import { defineConfig } from 'eslint/config';
export default defineConfig(...config, {
    ignores: ['**/test-output', '**/tests/**/*.spec.ts', '**/tests/**/*.test.ts'],
});
