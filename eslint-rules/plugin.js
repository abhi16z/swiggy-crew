/** Project-local ESLint rules, registered as the `local` plugin in eslint.config.js. */
module.exports = {
  meta: { name: 'eslint-plugin-local' },
  rules: {
    'no-index-file': require('./no-index-file'),
    'no-reexport': require('./no-reexport'),
  },
};
