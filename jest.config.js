/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['react-native-gesture-handler/jestSetup.js', '<rootDir>/jest.setup.ts'],
  // Expo's pnpm pattern, plus `standard-navigation` (ESM-only, pulled in by expo-router).
  transformIgnorePatterns: [
    'node_modules/(?!(.pnpm|(jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|standard-navigation))',
  ],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/local/'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/app/**'],
};
