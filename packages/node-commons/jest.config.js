import { defineConfig } from 'jest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
// Reading the SWC compilation config for the spec files
const swcJestConfig = JSON.parse(readFileSync(`${path.dirname(import.meta.filename)}/.spec.swcrc`, 'utf-8'));

// Disable .swcrc look-up by SWC core because we're passing in swcJestConfig ourselves
swcJestConfig.swcrc = false;
/**
 * @type {import('jest')}
 */
export default defineConfig({
    displayName: { name: '@fuel-pass/node-commons', color: 'yellow' },
    testEnvironment: 'node',
    transform: {
        '^.+\\.[tj]s$': ['@swc/jest', swcJestConfig],
    },
    moduleFileExtensions: ['ts', 'js', 'html'],
    coverageDirectory: 'test-output/jest/coverage',
    testMatch: ['<rootDir>/tests/**/*.spec.{ts,js}', '<rootDir>/tests/**/*.test.{ts,js}'],
    setupFiles: ['<rootDir>/tests/setup-env.ts'],
    maxWorkers: '50%',
});
