module.exports = {
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    jest: true,
    es6: true,
    node: true,
    browser: true,
  },
  plugins: ['react', 'react-hooks'],
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react/prop-types': 'off',
    'react/display-name': 'off',
    'prefer-const': 'warn',
    'no-var': 'error',
  },
  ignorePatterns: ['node_modules/', 'dist/', 'build/', 'coverage/'],
};




