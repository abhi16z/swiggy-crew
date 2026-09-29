import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { OnboardingGate } from '@/components/onboarding';
import { useOnboardingStore } from '@/components/onboarding/store';
import { PerformancePanel } from '@/components/performance-panel';
import { setPerformancePanelVisible } from '@/components/performance-panel/store';

import { Settings } from '.';

async function renderSettingsWithPanel() {
  await render(
    <>
      <Settings />
      <PerformancePanel />
    </>,
  );
}

afterEach(async () => {
  await act(async () => setPerformancePanelVisible(false));
});

describe('Settings', () => {
  it('starts with the performance panel hidden', async () => {
    await renderSettingsWithPanel();

    expect(screen.getByRole('switch', { name: 'Performance panel' })).toHaveProp('value', false);
    expect(
      screen.queryByRole('button', { name: 'Expand performance panel' }),
    ).not.toBeOnTheScreen();
  });

  // Same regression as the feed: content must start below the status bar, and the bottom
  // belongs to the tab bar.
  it('keeps the screen below the status bar and leaves the bottom to the tab bar', async () => {
    await render(<Settings />);

    const safeArea = screen.root?.children[0];
    expect(safeArea).toHaveProp(
      'edges',
      expect.objectContaining({ top: 'additive', bottom: 'off' }),
    );
    expect(screen.getByRole('header', { name: 'Settings' })).toBeOnTheScreen();
  });

  it('includes the Ask Crew section with the OpenRouter key field', async () => {
    await render(<Settings />);

    expect(screen.getByRole('header', { name: 'Ask Crew' })).toBeOnTheScreen();
    expect(await screen.findByLabelText('OpenRouter key')).toBeOnTheScreen();
  });

  it('shows and hides the app-wide performance panel from the switch', async () => {
    await renderSettingsWithPanel();
    const toggle = screen.getByRole('switch', { name: 'Performance panel' });

    await fireEvent(toggle, 'valueChange', true);
    expect(await screen.findByRole('button', { name: 'Expand performance panel' })).toBeVisible();
    expect(toggle).toHaveProp('value', true);

    await fireEvent(toggle, 'valueChange', false);
    expect(
      screen.queryByRole('button', { name: 'Expand performance panel' }),
    ).not.toBeOnTheScreen();
  });

  it('replays the onboarding over the app', async () => {
    await useOnboardingStore.persist.rehydrate();
    await act(async () => useOnboardingStore.setState({ completed: true }));
    await render(
      <>
        <Settings />
        <OnboardingGate />
      </>,
    );
    expect(screen.queryByTestId('onboarding')).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Replay onboarding' }));

    expect(await screen.findByRole('button', { name: 'Skip onboarding' })).toBeOnTheScreen();
    await act(async () => useOnboardingStore.setState({ completed: true }));
  });
});
