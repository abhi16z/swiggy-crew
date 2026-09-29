const { RuleTester } = require('eslint');
const rule = require('./no-index-file');

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
});

ruleTester.run('no-index-file', rule, {
  valid: [
    { code: 'export const a = 1;', filename: '/repo/src/components/trip-card/trip-card.tsx' },
    { code: 'export const a = 1;', filename: '/repo/src/lib/open-router/types.ts' },
    { code: 'export const a = 1;', filename: '/repo/src/lib/reindex.ts' },
    { code: 'export const a = 1;', filename: '/repo/src/lib/index-utils.ts' },
    { code: 'export const a = 1;', filename: '/repo/src/components/app-tabs.web.tsx' },
  ],
  invalid: [
    {
      code: 'export const a = 1;',
      filename: '/repo/src/components/trip-card/index.tsx',
      errors: [
        {
          message:
            "Don't name files 'index.tsx'. Name it after its contents, e.g. 'trip-card/trip-card.tsx'.",
        },
      ],
    },
    {
      code: '',
      filename: '/repo/src/lib/splash/index.ts',
      errors: [{ messageId: 'indexFile' }],
    },
    {
      code: 'export const a = 1;',
      filename: '/repo/src/components/ui/tab-bar-safe-area/index.android.tsx',
      errors: [
        {
          message:
            "Don't name files 'index.android.tsx'. Name it after its contents, e.g. 'tab-bar-safe-area/tab-bar-safe-area.android.tsx'.",
        },
      ],
    },
    {
      code: 'export const a = 1;',
      filename: '/repo/src/components/app-tabs/index.web.ts',
      errors: [{ messageId: 'indexFile' }],
    },
    {
      code: 'module.exports = {};',
      filename: '/repo/scripts/index.js',
      errors: [{ messageId: 'indexFile' }],
    },
  ],
});
