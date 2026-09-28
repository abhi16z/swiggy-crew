import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import type { FrameInfo } from 'react-native-reanimated';

import { COPIED_FEEDBACK_MS, HUD_COLORS } from './constants';
import PerformancePanelBody from './panel';

jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(() => Promise.resolve(true)) }));

// The frame callback is captured so tests can feed frames with exact timings.
let mockFrameCallback: ((frame: FrameInfo) => void) | undefined;
jest.mock('react-native-reanimated', () => {
  const actual =
    jest.requireActual<typeof import('react-native-reanimated')>('react-native-reanimated');
  return {
    __esModule: true,
    ...actual,
    useFrameCallback: (callback: (frame: FrameInfo) => void) => {
      mockFrameCallback = callback;
      return { setActive: jest.fn(), isActive: true, callbackId: 0 };
    },
  };
});

const VSYNC = 1000 / 60;
let timestamp = 0;

// Feeds frames the way Reanimated does: a `null` delta first, then one call per frame. Frames
// run inside act so the snapshot published for React (a microtask) is flushed too.
async function frames(deltas: (number | null)[]) {
  await act(async () => {
    for (const delta of deltas) {
      timestamp += delta ?? 0;
      mockFrameCallback?.({
        timestamp,
        timeSincePreviousFrame: delta,
        timeSinceFirstFrame: timestamp,
      });
    }
    jest.runAllTicks();
  });
}

function steady(count: number) {
  return new Array<number>(count).fill(VSYNC);
}

// The worklets mock runs UI-thread work (mapper registration, scheduleOnUI) on a 0 ms timer.
async function flushUiThread() {
  await act(async () => {
    jest.advanceTimersByTime(1);
  });
}

async function renderPanel() {
  await render(<PerformancePanelBody />);
  await flushUiThread();
  await frames([null]);
}

async function expand() {
  await fireEvent.press(screen.getByRole('button', { name: 'Expand performance panel' }));
  await flushUiThread();
}

async function collapse() {
  await fireEvent.press(screen.getByRole('button', { name: 'Collapse performance panel' }));
  await flushUiThread();
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  timestamp = 1000;
  mockFrameCallback = undefined;
  jest.mocked(Clipboard.setStringAsync).mockClear();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('PerformancePanelBody', () => {
  it('opens compact with only the three tiles, no header or expanded content', async () => {
    await renderPanel();

    expect(screen.getByText('UI FPS')).toBeOnTheScreen();
    expect(screen.getByText('DROPS')).toBeOnTheScreen();
    expect(screen.getByText('under 45 FPS')).toBeOnTheScreen();
    expect(screen.getByTestId('hud-js-label')).toHaveAnimatedProps({ text: 'JS THREAD' });
    expect(screen.getByTestId('hud-js-value')).toHaveAnimatedProps({ text: 'Idle' });
    expect(screen.getByTestId('hud-js-sub')).toHaveAnimatedProps({ text: 'no blocks yet' });
    expect(screen.queryByRole('header', { name: 'Performance' })).not.toBeOnTheScreen();
    expect(screen.queryByText(/^Recording/)).not.toBeOnTheScreen();
    expect(screen.queryByText('Frame time')).not.toBeOnTheScreen();
  });

  it('shows the live FPS and counts only frames under 45 FPS as drops', async () => {
    await renderPanel();

    await frames(steady(60));
    expect(screen.getByTestId('hud-fps')).toHaveAnimatedProps({ text: '60' });
    expect(screen.getByTestId('hud-drops')).toHaveAnimatedProps({ text: '0' });

    // A 2-frame stall (33 ms) and a slow-but-not-dropped frame (20 ms): one drop.
    await frames([2 * VSYNC, 20, ...steady(30)]);
    expect(screen.getByTestId('hud-drops')).toHaveAnimatedProps({ text: '1' });
    expect(Number(screen.getByTestId('hud-fps').props.jestAnimatedProps.value.text)).toBeLessThan(
      60,
    );
  });

  it('flags the JS thread as blocked while its heartbeat is missing', async () => {
    await renderPanel();
    await frames(steady(30));
    expect(screen.getByTestId('hud-js-dot')).toHaveAnimatedStyle({
      backgroundColor: HUD_COLORS.idle,
    });

    // 300 ms of wall time pass with no JS heartbeat: the UI thread notices on its own.
    jest.setSystemTime(Date.now() + 300);
    await frames(steady(30));

    expect(screen.getByTestId('hud-js-label')).toHaveAnimatedProps({ text: 'JS BLOCKED' });
    expect(screen.getByTestId('hud-js-value').props.jestAnimatedProps.value.text).toMatch(
      /^30\d ms$/,
    );
    expect(screen.getByTestId('hud-js-dot')).toHaveAnimatedStyle({
      backgroundColor: HUD_COLORS.blocked,
    });

    // JS gets its next frame and reports how long the block was, like the expanded tile.
    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    await frames(steady(20));
    expect(screen.getByTestId('hud-js-sub').props.jestAnimatedProps.value.text).toMatch(
      /^last block \d+ ms$/,
    );
  });

  it('expands into the full panel fed by snapshots, and collapses back', async () => {
    await renderPanel();
    await frames([...steady(100), 48.3, ...steady(20)]);

    await expand();
    await frames(steady(20));

    expect(screen.getByRole('header', { name: 'Performance' })).toBeOnTheScreen();
    expect(screen.getByText(/^Recording · 00:0\d$/)).toBeOnTheScreen();
    expect(screen.getByLabelText('DROPS: 1, under 45 FPS')).toBeOnTheScreen();
    expect(screen.getByLabelText('JS THREAD: Idle, no blocks yet')).toBeOnTheScreen();
    expect(screen.getByText('Frame time')).toBeOnTheScreen();
    expect(screen.getByText('Session summary')).toBeOnTheScreen();
    expect(screen.getByText(/^1\d\d frames · \d s$/)).toBeOnTheScreen();
    expect(screen.getByLabelText('P50: 16.6 ms, 60 FPS')).toBeOnTheScreen();
    expect(screen.getByLabelText('Worst: 48.3 ms, at 00:00')).toBeOnTheScreen();
    expect(
      screen.getByText('Every frame sampled on the UI thread · redraws 4× a second'),
    ).toBeOnTheScreen();
    expect(
      screen.queryByRole('button', { name: 'Expand performance panel' }),
    ).not.toBeOnTheScreen();

    await collapse();

    expect(screen.queryByText('Frame time')).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Expand performance panel' })).toBeOnTheScreen();
    // The session survives the collapse.
    await frames(steady(20));
    expect(screen.getByTestId('hud-drops')).toHaveAnimatedProps({ text: '1' });
  });

  it('resets the session from the expanded panel', async () => {
    await renderPanel();
    await frames([...steady(30), 48.3]);
    await expand();
    await frames(steady(20));
    expect(screen.getByLabelText('DROPS: 1, under 45 FPS')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Reset session' }));
    // Until the next redraw the summary is empty rather than stale.
    expect(screen.getByLabelText('DROPS: 0, under 45 FPS')).toBeOnTheScreen();
    expect(screen.getByLabelText('Worst: 0.0 ms, at 00:00')).toBeOnTheScreen();

    await flushUiThread();
    await frames(steady(20));

    expect(screen.getByLabelText('DROPS: 0, under 45 FPS')).toBeOnTheScreen();
    expect(screen.getByLabelText('Worst: 16.7 ms, at 00:00')).toBeOnTheScreen();
    expect(screen.getByText(/^\d frames · 0 s$/)).toBeOnTheScreen();

    await collapse();
    await frames(steady(20));
    expect(screen.getByTestId('hud-drops')).toHaveAnimatedProps({ text: '0' });
  });

  it('copies a report of the session and confirms briefly', async () => {
    await renderPanel();
    await frames([...steady(30), 48.3]);
    await expand();
    await frames(steady(20));

    await fireEvent.press(screen.getByRole('button', { name: 'Copy report' }));

    expect(Clipboard.setStringAsync).toHaveBeenCalledTimes(1);
    const report = jest.mocked(Clipboard.setStringAsync).mock.calls[0][0];
    expect(report).toContain('SwiggyCrew performance report');
    expect(report).toContain('Frames under 45 FPS: 1');
    expect(report).toContain('worst 48.3 ms');
    expect(await screen.findByText('Copied')).toBeOnTheScreen();

    await act(async () => {
      jest.advanceTimersByTime(COPIED_FEEDBACK_MS);
    });
    expect(screen.getByText('Copy report')).toBeOnTheScreen();
  });
});
