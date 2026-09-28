const LINE_BREAK = /\r\n|\r|\n/;

/**
 * Incremental parser for server-sent events. Feed it decoded text as it arrives; it calls
 * `onData` once per complete event with that event's `data:` lines joined by newlines.
 * Comment lines (such as OpenRouter's `: OPENROUTER PROCESSING` keep-alive) and other fields
 * are ignored.
 */
export function createSseParser(onData: (data: string) => void) {
  let buffer = '';
  let dataLines: string[] = [];

  function dispatch() {
    if (dataLines.length === 0) return;
    const data = dataLines.join('\n');
    dataLines = [];
    onData(data);
  }

  function processLine(line: string) {
    if (line === '') {
      dispatch();
      return;
    }
    if (line.startsWith(':')) return;
    const colon = line.indexOf(':');
    const field = colon === -1 ? line : line.slice(0, colon);
    if (field !== 'data') return;
    const value = colon === -1 ? '' : line.slice(colon + 1);
    dataLines.push(value.startsWith(' ') ? value.slice(1) : value);
  }

  return {
    push(text: string) {
      buffer += text;
      let match = LINE_BREAK.exec(buffer);
      while (match) {
        // A trailing `\r` may be the first half of `\r\n` split across chunks; wait for more.
        if (match[0] === '\r' && match.index === buffer.length - 1) break;
        const line = buffer.slice(0, match.index);
        buffer = buffer.slice(match.index + match[0].length);
        processLine(line);
        match = LINE_BREAK.exec(buffer);
      }
    },
    /** Flushes a final event that the server did not close with a blank line. */
    end() {
      if (buffer !== '') processLine(buffer.replace(/\r$/, ''));
      buffer = '';
      dispatch();
    },
  };
}
