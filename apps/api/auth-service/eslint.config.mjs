import baseConfig from '@fuel-pass/eslint-config/backend';

export default [
    ...baseConfig,
    {
        ignores: ['**/out-tsc', '**/tests/**/*.spec.ts', '**/tests/**/*.test.ts'],
    },
];
