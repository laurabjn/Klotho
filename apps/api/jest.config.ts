import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    // The generated Prisma client imports its own files with a `.js` suffix.
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  collectCoverageFrom: ['src/**/*.(t|j)s', '!src/generated/**', '!src/main.ts'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
};

export default config;
