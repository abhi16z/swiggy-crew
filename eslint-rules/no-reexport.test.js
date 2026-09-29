const { RuleTester } = require('eslint');
const tsParser = require('@typescript-eslint/parser');
const rule = require('./no-reexport');

const ruleTester = new RuleTester({
  languageOptions: { parser: tsParser, ecmaVersion: 'latest', sourceType: 'module' },
});

ruleTester.run('no-reexport', rule, {
  valid: [
    'export const a = 1;',
    'export function f() {}',
    'export type Animal = { name: string };',
    'const a = 1; export { a };',
    'const a = 1; export { a as b };',
    'export default function Screen() {}',
    'const Screen = () => null; export default Screen;',
    "import { a } from './x'; export const b = a;",
    // A local that shadows an import name is not a re-export.
    "import { a } from './x'; function f() { const a = 1; return a; } export { f };",
  ],
  invalid: [
    { code: "export * from './x';", errors: [{ messageId: 'reexport' }] },
    { code: "export * as x from './x';", errors: [{ messageId: 'reexport' }] },
    { code: "export { a } from './x';", errors: [{ messageId: 'reexport' }] },
    { code: "export { default } from './x';", errors: [{ messageId: 'reexport' }] },
    { code: "export type { Animal } from './types';", errors: [{ messageId: 'reexport' }] },
    {
      code: "import { a, b } from './x'; export { a, b };",
      errors: [{ messageId: 'reexportImported' }, { messageId: 'reexportImported' }],
    },
    {
      code: "import type { Animal } from './types'; export type { Animal };",
      errors: [{ messageId: 'reexportImported' }],
    },
    {
      code: "import * as ns from './x'; export { ns };",
      errors: [{ messageId: 'reexportImported' }],
    },
    {
      code: "import Screen from './screen'; export default Screen;",
      errors: [{ messageId: 'reexportImported' }],
    },
  ],
});
