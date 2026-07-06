import baseConfig from '../../../eslint.config.backend.mjs';

export default [
    ...baseConfig,
    {
        ignores: ['**/out-tsc', '**/tests/**/*.spec.ts', '**/tests/**/*.test.ts', 'webpack.config.js'],
    },
];
