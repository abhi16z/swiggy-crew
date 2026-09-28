import { render, screen, userEvent, within } from '@testing-library/react-native';

import { HomeActions, HomeSheets } from '.';

const mockFiltersSnapTo = jest.fn();
const mockAskCrewSnapTo = jest.fn();

// Focus follows mount: unmounting the screen stands in for Home losing focus.
jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual<typeof import('react')>('react');
  return {
    useFocusEffect: (effect: () => void | (() => void)) => useEffect(effect, [effect]),
  };
});

// A plain View keeps the `edges` prop visible to the test.
jest.mock('react-native-screens/experimental', () => ({
  SafeAreaView: jest.requireActual<typeof import('react-native')>('react-native').View,
}));

// Stand-ins exposing only the imperative handle; each sheet has its own tests.
jest.mock('./filters-sheet', () => {
  const { forwardRef, useImperativeHandle } = jest.requireActual<typeof import('react')>('react');
  return {
    FiltersSheet: forwardRef(function FiltersSheet(_props, ref) {
      useImperativeHandle(ref, () => ({ snapTo: mockFiltersSnapTo }));
      return null;
    }),
  };
});

jest.mock('./ask-crew-sheet', () => {
  const { forwardRef, useImperativeHandle } = jest.requireActual<typeof import('react')>('react');
  return {
    AskCrewSheet: forwardRef(function AskCrewSheet(_props, ref) {
      useImperativeHandle(ref, () => ({ snapTo: mockAskCrewSnapTo }));
      return null;
    }),
  };
});

const homeRenders = jest.fn();

// Home screen buttons plus the sheets the root layout mounts above the tabs.
function HomeWithSheets({ homeMounted = true }: { homeMounted?: boolean }) {
  homeRenders();
  return (
    <>
      {homeMounted ? <HomeActions /> : null}
      <HomeSheets />
    </>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('HomeActions', () => {
  it('opens each root-mounted sheet at half height from its floating button', async () => {
    const user = userEvent.setup();
    await render(<HomeWithSheets />);

    await user.press(screen.getByRole('button', { name: 'Open filters' }));
    expect(mockFiltersSnapTo).toHaveBeenCalledWith('half');
    expect(mockAskCrewSnapTo).not.toHaveBeenCalled();

    await user.press(screen.getByRole('button', { name: 'Open Ask Crew' }));
    expect(mockAskCrewSnapTo).toHaveBeenCalledWith('half');
  });

  // Regression: on iOS the native tab bar floats over the screen and covered the buttons.
  it('keeps the floating buttons inside the bottom safe area so the tab bar cannot cover them', async () => {
    await render(<HomeActions />);

    const bottomSafeArea = screen.root!;
    expect(bottomSafeArea).toHaveProp('edges', { bottom: true });
    expect(within(bottomSafeArea).getByRole('button', { name: 'Open filters' })).toBeOnTheScreen();
    expect(within(bottomSafeArea).getByRole('button', { name: 'Open Ask Crew' })).toBeOnTheScreen();
  });

  it('does not re-render the Home screen, and so the feed, when a sheet is opened', async () => {
    const user = userEvent.setup();
    await render(<HomeWithSheets />);

    await user.press(screen.getByRole('button', { name: 'Open filters' }));
    await user.press(screen.getByRole('button', { name: 'Open Ask Crew' }));

    expect(homeRenders).toHaveBeenCalledTimes(1);
  });

  it('closes both sheets when Home loses focus so they never cover another tab', async () => {
    await render(<HomeWithSheets />);
    expect(mockFiltersSnapTo).not.toHaveBeenCalled();

    await screen.rerender(<HomeWithSheets homeMounted={false} />);

    expect(mockFiltersSnapTo).toHaveBeenCalledWith('closed');
    expect(mockAskCrewSnapTo).toHaveBeenCalledWith('closed');
  });
});
