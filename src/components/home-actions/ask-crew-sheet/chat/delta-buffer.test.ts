import { createDeltaBuffer, FLUSH_INTERVAL_MS } from './delta-buffer';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('createDeltaBuffer', () => {
  it('batches deltas that arrive within one interval into a single update', () => {
    const flush = jest.fn();
    const buffer = createDeltaBuffer(flush);

    buffer.push('Hel');
    buffer.push('lo');
    expect(flush).not.toHaveBeenCalled();

    jest.advanceTimersByTime(FLUSH_INTERVAL_MS);
    expect(flush).toHaveBeenCalledTimes(1);
    expect(flush).toHaveBeenCalledWith('Hello');
  });

  it('keeps streaming progressively across intervals', () => {
    const flush = jest.fn();
    const buffer = createDeltaBuffer(flush);

    buffer.push('a');
    jest.advanceTimersByTime(FLUSH_INTERVAL_MS);
    buffer.push('b');
    jest.advanceTimersByTime(FLUSH_INTERVAL_MS);

    expect(flush.mock.calls).toEqual([['a'], ['b']]);
  });

  it('hands on the tail immediately when flushed, and only once', () => {
    const flush = jest.fn();
    const buffer = createDeltaBuffer(flush);

    buffer.push('tail');
    buffer.flush();
    jest.advanceTimersByTime(FLUSH_INTERVAL_MS);

    expect(flush.mock.calls).toEqual([['tail']]);
  });
});
