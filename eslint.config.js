import globals from 'globals';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      'api/server.cjs',
      'coverage/**'
    ]
  },
  {
    files: ['apps/web/**/*.js', 'services/api/**/*.js', 'api/**/*.js', 'tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      'no-constant-binary-expression': 'error',
      'no-debugger': 'error',
      'no-dupe-keys': 'error',
      'no-undef': 'error',
      'no-unreachable': 'error',
      'no-unsafe-finally': 'error',
      'valid-typeof': 'error'
    }
  }
];
