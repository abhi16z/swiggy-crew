import { createSseParser } from './sse';

function collect() {
  const events: string[] = [];
  const parser = createSseParser((data) => events.push(data));
  return { events, parser };
}

describe('createSseParser', () => {
  it('emits one event per blank-line-terminated block', () => {
    const { events, parser } = collect();

    parser.push('data: {"a":1}\n\ndata: {"b":2}\n\n');

    expect(events).toEqual(['{"a":1}', '{"b":2}']);
  });

  it('joins an event split across chunks at any point', () => {
    const { events, parser } = collect();

    parser.push('da');
    parser.push('ta: hel');
    parser.push('lo\n');
    expect(events).toEqual([]);

    parser.push('\n');
    expect(events).toEqual(['hello']);
  });

  it('ignores keep-alive comments and fields other than data', () => {
    const { events, parser } = collect();

    parser.push(': OPENROUTER PROCESSING\n\nevent: message\nid: 7\ndata: x\n\n');

    expect(events).toEqual(['x']);
  });

  it('handles CRLF line endings, including a CRLF split between chunks', () => {
    const { events, parser } = collect();

    parser.push('data: one\r');
    parser.push('\n\r\ndata: two\r\n\r\n');

    expect(events).toEqual(['one', 'two']);
  });

  it('joins multi-line data with newlines and keeps a value without the optional space', () => {
    const { events, parser } = collect();

    parser.push('data: first\ndata:second\n\n');

    expect(events).toEqual(['first\nsecond']);
  });

  it('flushes a final event that was not closed with a blank line', () => {
    const { events, parser } = collect();

    parser.push('data: [DONE]');
    parser.end();

    expect(events).toEqual(['[DONE]']);
  });
});
