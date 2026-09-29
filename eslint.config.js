const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');
const localPlugin = require('./eslint-rules/plugin');

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    plugins: { local: localPlugin },
  },
  {
    // Must come after the Prettier config, which turns max-len off.
    rules: {
      'max-len': [
        'error',
        {
          code: 100,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreUrls: true,
          ignoreRegExpLiterals: true,
        },
      ],
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      'react/no-multi-comp': ['error', { ignoreStateless: false }],
      'local/no-reexport': 'error',
    },
  },
  {
    // expo-router needs index files for routes; everywhere else, name files after their contents.
    ignores: ['src/app/**'],
    rules: {
      'local/no-index-file': 'error',
    },
  },
  {
    ignores: ['dist/*', 'local/*'],
  },
]);
