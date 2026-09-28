import { AppState, type AppStateStatus } from 'react-native';

import { JS_BEAT_EVERY } from './constants';
import { startJsHeartbeat } from './js-heartbeat';

// The mocked requestAnimationFrame is a 0 ms timeout; Jest spaces re-scheduled timers 1 ms apart.
const FRAME_MS = 1;

let appStateHandler: ((state: AppStateStatus) => void) | undefined;

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, handler) => {
    appStateHandler = handler;
    return { remove: jest.fn() };
  });
});

afterEach(() => {
  jest.mocked(AppState.addEventListener).mockRestore();
  jest.useRealTimers();
});

function start() {
  const onBeat = jest.fn();
  const onBlock = jest.fn();
  const stop = startJsHeartbeat({ onBeat, onBlock });
  return { onBeat, onBlock, stop };
}

describe('startJsHeartbeat', () => {
  it('beats every few frames while JS is free and never reports a block', () => {
    const { onBeat, onBlock, stop } = start();

    jest.advanceTimersByTime(FRAME_MS * JS_BEAT_EVERY * 4);

    expect(onBeat).toHaveBeenCalledTimes(4);
    expect(onBlock).not.toHaveBeenCalled();
    stop();
  });

  it('reports a late frame as a block, minus the one frame that was expected', () => {
    const { onBeat, onBlock, stop } = start();
    jest.advanceTimersByTime(FRAME_MS);

    // 100 ms passes without a frame: JS was busy.
    jest.setSystemTime(Date.now() + 100);
    jest.advanceTimersByTime(FRAME_MS);

    expect(onBlock).toHaveBeenCalledTimes(1);
    expect(onBlock.mock.calls[0][0]).toBe(84);
    // A block always sends a beat so the UI sees JS is back.
    expect(onBeat).toHaveBeenCalledTimes(1);
    stop();
  });

  it('ignores stalls shorter than the reporting threshold', () => {
    const { onBlock, stop } = start();
    jest.advanceTimersByTime(FRAME_MS);

    jest.setSystemTime(Date.now() + 40);
    jest.advanceTimersByTime(FRAME_MS);

    expect(onBlock).not.toHaveBeenCalled();
    stop();
  });

  it('does not count time spent in the background as a block', () => {
    const { onBlock, stop } = start();
    jest.advanceTimersByTime(FRAME_MS);

    appStateHandler?.('background');
    jest.setSystemTime(Date.now() + 30_000);
    appStateHandler?.('active');
    jest.advanceTimersByTime(FRAME_MS);

    expect(onBlock).not.toHaveBeenCalled();
    stop();
  });

  it('stops beating once cleaned up', () => {
    const { onBeat, stop } = start();
    jest.advanceTimersByTime(FRAME_MS * JS_BEAT_EVERY);
    expect(onBeat).toHaveBeenCalledTimes(1);

    stop();
    jest.advanceTimersByTime(FRAME_MS * JS_BEAT_EVERY * 5);

    expect(onBeat).toHaveBeenCalledTimes(1);
  });
});
