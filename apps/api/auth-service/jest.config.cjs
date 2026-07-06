const { readFileSync } = require('node:fs');

const swcJestConfig = JSON.parse(readFileSync(`${__dirname}/.spec.swcrc`, 'utf-8'));

swcJestConfig.swcrc = false;

module.exports = {
    displayName: { name: '@fuel-pass/auth', color: 'yellow' },
    testEnvironment: 'node',
    transform: {
        '^.+\\.[tj]s$': ['@swc/jest', swcJestConfig],
    },
    moduleFileExtensions: ['ts', 'js', 'html'],
    coverageDirectory: 'test-output/jest/coverage',
    testMatch: ['<rootDir>/tests/**/*.spec.{ts,js}', '<rootDir>/tests/**/*.test.{ts,js}'],
    maxWorkers: '50%',
};
