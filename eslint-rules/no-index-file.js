/**
 * Disallows `index.*` module files. Name the file after what it contains
 * (e.g. `trip-card/trip-card.tsx`) so files are distinguishable in search and editor tabs.
 * Scope it with `ignores` in the config for folders that need index files (expo-router routes).
 */
const path = require('path');

const INDEX_FILE = /^index\.[cm]?[jt]sx?$/;

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow index.* files; name the file after its folder or contents.',
    },
    schema: [],
    messages: {
      indexFile:
        "Don't name files '{{name}}'. Name it after its contents, e.g. '{{folder}}/{{folder}}{{ext}}'.",
    },
  },
  create(context) {
    const name = path.basename(context.filename);
    if (!INDEX_FILE.test(name)) return {};

    return {
      Program(node) {
        context.report({
          node,
          loc: { line: 1, column: 0 },
          messageId: 'indexFile',
          data: {
            name,
            folder: path.basename(path.dirname(context.filename)),
            ext: path.extname(name),
          },
        });
      },
    };
  },
};
