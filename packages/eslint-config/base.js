import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';
import onlyWarn from 'eslint-plugin-only-warn';
import preferArrow from 'eslint-plugin-prefer-arrow';
import turboPlugin from 'eslint-plugin-turbo';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
    js.configs.recommended,
    eslintConfigPrettier,
    ...tseslint.configs.recommended,
    {
        plugins: {
            turbo: turboPlugin,
        },
        rules: {
            'turbo/no-undeclared-env-vars': 'warn',
        },
    },
    {
        plugins: {
            onlyWarn,
        },
    },
    {
        ignores: ['dist/**'],
    },
    {
        files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts', '**/*.js', '**/*.jsx', '**/*.cjs', '**/*.mjs'],
        // Override or add rules here
        plugins: {
            'unused-imports': unusedImportsPlugin,
            '@stylistic': stylistic,
            'prefer-arrow': preferArrow,
        },
        rules: {
            '@typescript-eslint/triple-slash-reference': 'off',
        },
    },
    {
        files: ['**/*.mjs'],
        rules: {
            '@typescript-eslint/ban-ts-comment': 'off',
        },
    },
];
