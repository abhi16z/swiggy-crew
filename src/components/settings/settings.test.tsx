import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { PerformancePanel, setPerformancePanelVisible } from '@/components/performance-panel';

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
    expect(screen.queryByText('Performance HUD')).not.toBeOnTheScreen();
  });

  it('shows and hides the app-wide performance panel from the switch', async () => {
    await renderSettingsWithPanel();
    const toggle = screen.getByRole('switch', { name: 'Performance panel' });

    await fireEvent(toggle, 'valueChange', true);
    expect(await screen.findByText('Performance HUD')).toBeVisible();
    expect(toggle).toHaveProp('value', true);

    await fireEvent(toggle, 'valueChange', false);
    expect(screen.queryByText('Performance HUD')).not.toBeOnTheScreen();
  });
});
