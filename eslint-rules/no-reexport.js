/**
 * Disallows re-exporting bindings from another module. Every symbol is exported from the
 * file that defines it, and consumers import it from that file directly.
 *
 * Flags:
 *   export * from './x';            export * as x from './x';
 *   export { a } from './x';        export type { A } from './x';
 *   import { a } from './x'; export { a };   export default a;
 */

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow re-exports; export from the defining file and import from it.',
    },
    schema: [],
    messages: {
      reexport:
        "Don't re-export from '{{source}}'. Import it from '{{source}}' directly where it is used.",
      reexportImported:
        "Don't re-export imported '{{name}}'. Import it from its original module where it is used.",
    },
  },
  create(context) {
    const isImported = (node, name) => {
      let scope = context.sourceCode.getScope(node);
      while (scope) {
        const variable = scope.set.get(name);
        if (variable) return variable.defs.some((def) => def.type === 'ImportBinding');
        scope = scope.upper;
      }
      return false;
    };

    return {
      ExportAllDeclaration(node) {
        context.report({ node, messageId: 'reexport', data: { source: node.source.value } });
      },
      ExportNamedDeclaration(node) {
        if (node.source) {
          context.report({ node, messageId: 'reexport', data: { source: node.source.value } });
          return;
        }
        for (const specifier of node.specifiers) {
          if (specifier.local.type === 'Identifier' && isImported(node, specifier.local.name)) {
            context.report({
              node: specifier,
              messageId: 'reexportImported',
              data: { name: specifier.local.name },
            });
          }
        }
      },
      ExportDefaultDeclaration(node) {
        const { declaration } = node;
        if (declaration.type === 'Identifier' && isImported(node, declaration.name)) {
          context.report({
            node,
            messageId: 'reexportImported',
            data: { name: declaration.name },
          });
        }
      },
    };
  },
};
