import { render, screen, within } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ScreenSafeArea } from '.';

describe('ScreenSafeArea', () => {
  it('pads only the top, leaving the bottom to the tab bar', async () => {
    await render(
      <ScreenSafeArea>
        <Text>Page</Text>
      </ScreenSafeArea>,
    );

    expect(screen.root).toHaveProp(
      'edges',
      expect.objectContaining({ top: 'additive', bottom: 'off' }),
    );
    expect(within(screen.root!).getByText('Page')).toBeOnTheScreen();
  });
});
