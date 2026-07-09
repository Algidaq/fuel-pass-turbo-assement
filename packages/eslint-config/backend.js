// @ts-check
import jslint from '@eslint/js';

import typegen from 'eslint-typegen';
import { defineConfig } from 'eslint/config';
import tslint from 'typescript-eslint';
import { config } from './base.js';

const configs = [
    ...config,
    ...defineConfig({
        extends: [jslint.configs.recommended, tslint.configs.recommendedTypeChecked],
        files: ['**/*.{js,ts}'],
        ignores: ['**/*.d.ts', '**/dist', '**/out-tsc', 'jest.config.js'],

        /**
         * @type {Partial<import('../../eslint-typegen').RuleOptions>}
         */
        rules: {
            '@typescript-eslint/no-unsafe-argument': 'off',
            'unused-imports/no-unused-imports': 'error',
            '@typescript-eslint/no-unused-vars': 'off',
            'no-unused-vars': 'off',
            'unused-imports/no-unused-vars': [
                'error',
                {
                    vars: 'all',
                    varsIgnorePattern: '^_',
                    args: 'after-used',
                    argsIgnorePattern: '^_',
                },
            ],

            'prefer-const': 'error',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            'no-unsafe-optional-chaining': 'error',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/adjacent-overload-signatures': 'error',
            '@typescript-eslint/array-type': 'off',
            '@typescript-eslint/no-unsafe-return': 'off',
            '@typescript-eslint/no-empty-object-type': 'error',
            '@typescript-eslint/no-wrapper-object-types': 'error',
            '@typescript-eslint/consistent-type-assertions': 'error',
            '@typescript-eslint/dot-notation': 'error',
            '@typescript-eslint/explicit-function-return-type': [
                'error',
                {
                    allowExpressions: false,
                    allowTypedFunctionExpressions: false,
                    allowHigherOrderFunctions: false,
                    allowDirectConstAssertionInArrowFunctions: true,
                    allowConciseArrowFunctionExpressionsStartingWithVoid: true,
                },
            ],
            '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'explicit' }],
            '@typescript-eslint/member-ordering': 'error',
            '@typescript-eslint/explicit-module-boundary-types': [
                'error',
                {
                    allowArgumentsExplicitlyTypedAsAny: true,
                    allowDirectConstAssertionInArrowFunctions: true,
                    allowHigherOrderFunctions: false,
                    allowTypedFunctionExpressions: false,
                },
            ],
            '@stylistic/member-delimiter-style': [
                'error',
                {
                    multiline: {
                        delimiter: 'semi',
                        requireLast: true,
                    },
                    singleline: {
                        delimiter: 'semi',
                        requireLast: false,
                    },
                },
            ],
            '@typescript-eslint/no-empty-function': 'error',
            '@typescript-eslint/no-empty-interface': 'off',
            '@typescript-eslint/no-inferrable-types': ['error', { ignoreParameters: true }],
            '@typescript-eslint/no-shadow': ['error', { hoist: 'all' }],
            'no-unused-expressions': 'error',
            '@typescript-eslint/no-unused-expressions': 'error',
            '@typescript-eslint/no-use-before-define': 'off',
            '@typescript-eslint/no-var-requires': 'error',
            '@typescript-eslint/prefer-for-of': 'error',
            '@typescript-eslint/prefer-function-type': 'error',
            '@typescript-eslint/prefer-namespace-keyword': 'error',
            '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
            '@stylistic/semi': 'error',
            '@stylistic/type-annotation-spacing': 'error',
            '@typescript-eslint/typedef': ['error', { parameter: true }],
            '@typescript-eslint/unified-signatures': 'error',
            'arrow-parens': ['off', 'always'],
            '@stylistic/brace-style': ['error', '1tbs'],
            '@stylistic/comma-dangle': [
                'warn',
                { objects: 'always-multiline', arrays: 'always-multiline', functions: 'never', imports: 'always-multiline' },
            ],
            complexity: 'off',
            'constructor-super': 'error',
            curly: 'error',
            'default-case': 'error',
            'dot-notation': 'off',
            '@stylistic/eol-last': 'error',
            eqeqeq: ['error', 'smart'],
            'guard-for-in': 'error',
            'id-denylist': 'off',
            'id-match': 'off',
            indent: 'off',
            'new-parens': 'error',
            'no-bitwise': 'error',
            'no-caller': 'error',
            'no-cond-assign': 'error',
            'no-debugger': 'error',
            'no-empty': 'error',
            'no-empty-function': 'off',
            'no-eval': 'off',
            'no-fallthrough': 'error',
            'no-invalid-this': 'off',
            'no-redeclare': 'error',
            'no-shadow': 'off',
            'no-throw-literal': 'error',
            '@stylistic/no-trailing-spaces': 'error',
            'no-undef-init': 'off',
            'no-underscore-dangle': 'off',
            'no-new-wrappers': 'error',
            'no-unsafe-finally': 'error',
            'object-shorthand': 'error',
            'one-var': ['error', 'never'],
            'no-var': 'error',
            'prefer-arrow/prefer-arrow-functions': ['error', { allowStandaloneDeclarations: true }],
            quotes: 'off',
            radix: 'error',
            semi: 'off',
            '@stylistic/spaced-comment': ['error', 'always', { markers: ['/'] }],
            'use-isnan': 'error',
            'valid-typeof': 'off',
            '@typescript-eslint/no-redundant-type-constituents': 'off',
            '@typescript-eslint/no-explicit-any': ['warn', { ignoreRestArgs: true }],
            '@typescript-eslint/consistent-type-imports': [
                'error',
                {
                    prefer: 'type-imports',
                    fixStyle: 'separate-type-imports',
                },
            ],
            'no-console': 'error',
            '@typescript-eslint/only-throw-error': 'warn',
        },
        languageOptions: {
            parserOptions: {
                projectService: true,
            },
        },
    }),
    {
        ignores: ['**/out-tsc', '<rootDir>/tests/**/*.spec.ts', '<rootDir>/tests/**/*.test.ts'],
    },
];
// @ts-ignore
typegen(configs);

export default configs;
