/** ~20 UI updates a second: smooth to read, cheap enough for low-end Android. */
export const FLUSH_INTERVAL_MS = 50;

/**
 * Collects streamed text and hands it on at most once per interval, so a fast model does not
 * re-render the chat for every token.
 */
export function createDeltaBuffer(flush: (text: string) => void, intervalMs = FLUSH_INTERVAL_MS) {
  let pending = '';
  let timer: ReturnType<typeof setTimeout> | null = null;

  function run() {
    timer = null;
    if (pending === '') return;
    const text = pending;
    pending = '';
    flush(text);
  }

  return {
    push(text: string) {
      pending += text;
      timer ??= setTimeout(run, intervalMs);
    },
    /** Hands on anything still pending right away. */
    flush() {
      if (timer !== null) clearTimeout(timer);
      run();
    },
  };
}
