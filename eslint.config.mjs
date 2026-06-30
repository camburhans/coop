import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      // Prototype reference material (the locked visual contract we mine, not
      // application source). Kept in-repo for reference; not linted/built.
      'design-reference/**',
    ],
  },
  {
    rules: {
      // Honor the `_`-prefix convention for intentionally-unused bindings
      // (e.g. the AIProvider stub's `_req` params, future handler signatures).
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
];

export default eslintConfig;
