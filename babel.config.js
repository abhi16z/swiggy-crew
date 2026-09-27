module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    env: {
      // Metro supports `import()` natively; Jest's CommonJS runtime needs it rewritten to require.
      test: {
        plugins: ['@babel/plugin-transform-dynamic-import'],
      },
    },
  };
};
