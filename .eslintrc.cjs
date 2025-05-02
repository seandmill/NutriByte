module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '19.0' } },
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'react/prop-types': 'off', // Disable prop-types validation (use TypeScript instead)
  },
  overrides: [
    // Add Jest-specific configuration for test files
    {
      files: ['**/*.test.js', '**/*.test.jsx', '**/tests/**'],
      env: {
        jest: true,
        node: true
      },
      // Allow Jest globals and disable some rules that conflict with tests
      globals: {
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        it: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        afterAll: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly'
      },
      rules: {
        'no-unused-vars': ['error', { 
          varsIgnorePattern: '^_', 
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true
        }],
        'no-undef': 'off' // Disable undefined errors for test files
      }
    }
  ]
} 