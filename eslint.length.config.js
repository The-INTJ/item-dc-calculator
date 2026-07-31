import tsParser from '@typescript-eslint/parser';

const sourceFiles = ['app/**/*.{js,jsx,ts,tsx}', 'src/**/*.{js,jsx,ts,tsx}'];

const exemptions = [
  'app/(dc-calculator)/**',
  'src/features/dc-calculator/**',
  '**/__tests__/**',
  '**/*.{test,spec}.{js,jsx,ts,tsx}',
  '**/fixtures/**',
  '**/knowledge/**',
  '**/content.{js,jsx,ts,tsx}',
  '**/generated/**',
  '**/*.generated.{js,jsx,ts,tsx}',
  '**/*.d.ts',
  '**/*Types.{ts,tsx}',
  '**/*-types.{ts,tsx}',
  '**/types.{ts,tsx}',
];

export default [
  {
    name: 'source-length-policy',
    files: sourceFiles,
    ignores: exemptions,
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      'max-lines': [
        'error',
        { max: 199, skipBlankLines: true, skipComments: true },
      ],
      'max-lines-per-function': [
        'error',
        {
          max: 80,
          skipBlankLines: true,
          skipComments: true,
          IIFEs: true,
        },
      ],
    },
  },
];
