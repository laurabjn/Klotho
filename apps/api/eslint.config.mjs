import { nodeConfig } from '@klotho/eslint-config/node';

const frameworkImports = [
  '@nestjs/*',
  '@prisma/*',
  'prisma',
  '**/generated/**',
];

export default [
  { ignores: ['src/generated/**', 'prisma.config.ts', '.scripts/**'] },
  ...nodeConfig(import.meta.dirname),
  // Clean Architecture boundaries: dependencies only point inwards.
  {
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: frameworkImports,
              message: 'The domain layer must stay framework-free.',
            },
            {
              group: [
                '**/application/**',
                '**/infrastructure/**',
                '**/interfaces/**',
              ],
              message: 'The domain layer cannot depend on outer layers.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/application/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@prisma/*', 'prisma', '**/generated/**'],
              message: 'Use cases reach persistence through domain ports only.',
            },
            {
              group: ['**/infrastructure/**', '**/interfaces/**'],
              message: 'The application layer cannot depend on outer layers.',
            },
          ],
        },
      ],
    },
  },
];
