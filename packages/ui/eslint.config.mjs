import { config } from '@fuel-pass/eslint-config/react-internal';
import { defineConfig } from 'eslint/config';

export default defineConfig(...config, {
    ignores: ['dist/**'],
});
