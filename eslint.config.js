import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import jsdoc from 'eslint-plugin-jsdoc';
import n from 'eslint-plugin-n';
import globals from 'globals';

const strictBaseRules = {
  curly: ['error', 'all'],
  eqeqeq: ['error', 'always', { null: 'ignore' }],
  'no-console': ['warn', { allow: ['warn', 'error'] }],
  'no-else-return': 'error',
  'no-implicit-coercion': 'error',
  'no-nested-ternary': 'error',
  'no-param-reassign': ['error', { props: false }],
  'no-throw-literal': 'error',
  'no-unneeded-ternary': 'error',
  'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  'no-var': 'error',
  'object-shorthand': 'error',
  'prefer-arrow-callback': 'error',
  'prefer-const': 'error',
  'prefer-promise-reject-errors': 'error',
  'prefer-template': 'error',
  yoda: 'error',
};

const importRules = {
  'import/first': 'error',
  'import/newline-after-import': 'error',
  'import/no-duplicates': 'error',
  'import/order': [
    'error',
    {
      alphabetize: { order: 'asc', caseInsensitive: true },
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      'newlines-between': 'never',
    },
  ],
};

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'docs/**'],
  },
  js.configs.recommended,
  eslintConfigPrettier,
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    plugins: {
      import: importPlugin,
      jsdoc,
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.mjs', '.cjs'],
        },
      },
    },
    rules: {
      ...strictBaseRules,
      ...importRules,
      'jsdoc/check-alignment': 'error',
      'jsdoc/check-param-names': 'error',
      'jsdoc/check-tag-names': 'error',
      'jsdoc/check-types': 'error',
      'jsdoc/require-param': 'off',
      'jsdoc/require-returns': 'off',
    },
  },
  {
    files: ['src/**/*.js'],
    rules: {
      'no-underscore-dangle': 'off',
    },
  },
  {
    files: ['test/**/*.mjs', 'scripts/**/*.mjs'],
    languageOptions: {
      globals: globals.node,
    },
    plugins: {
      n,
    },
    rules: {
      'import/no-unresolved': 'off',
      'n/no-extraneous-import': 'error',
      'n/no-missing-import': 'off',
      'n/no-unsupported-features/es-syntax': 'off',
      'no-console': 'off',
    },
  },
  {
    files: ['rollup.config.js'],
    languageOptions: {
      globals: globals.node,
    },
    plugins: {
      n,
    },
    rules: {
      'import/no-unresolved': 'off',
      'n/no-extraneous-import': 'error',
      'n/no-missing-import': 'off',
      'n/no-unsupported-features/es-syntax': 'off',
    },
  },
];
