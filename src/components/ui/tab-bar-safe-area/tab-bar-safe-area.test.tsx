import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { TabBarSafeArea } from '.';

// Jest resolves the iOS file by default; load the Android variant explicitly.
const { TabBarSafeArea: AndroidTabBarSafeArea } =
  jest.requireActual<typeof import('./index.android')>('./index.android');

// A plain View keeps the `edges` prop visible to the test.
jest.mock('react-native-screens/experimental', () => ({
  SafeAreaView: jest.requireActual<typeof import('react-native')>('react-native').View,
}));

describe('TabBarSafeArea', () => {
  it('pads the bottom by the native tab bar inset on iOS', async () => {
    await render(
      <TabBarSafeArea>
        <Text>Floating</Text>
      </TabBarSafeArea>,
    );

    expect(screen.root).toHaveProp('edges', { bottom: true });
    expect(screen.getByText('Floating')).toBeOnTheScreen();
  });

  // Regression: on Android the buttons moved up after switching tabs and coming back,
  // because the native safe area re-applied the navigation bar inset.
  it('adds no bottom inset on Android, where the screen already ends above the tab bar', async () => {
    await render(
      <AndroidTabBarSafeArea>
        <Text>Floating</Text>
      </AndroidTabBarSafeArea>,
    );

    expect(screen.root).not.toHaveProp('edges');
    expect(screen.root).not.toHaveStyle({ paddingBottom: expect.anything() });
    expect(screen.getByText('Floating')).toBeOnTheScreen();
  });
});
