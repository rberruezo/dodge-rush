import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Diagnostics } from './Diagnostics';

describe('Diagnostics', () => {
  beforeEach(() => {
    Diagnostics.clear();
    Diagnostics.setConsoleMirror(false); // keep test output quiet
  });

  it('records warn/error events with scope, message and timestamp', () => {
    Diagnostics.warn('storage', 'coins read failed', 'QuotaExceeded');
    const [e] = Diagnostics.recent;
    expect(e.level).toBe('warn');
    expect(e.scope).toBe('storage');
    expect(e.message).toBe('coins read failed');
    expect(e.detail).toBe('QuotaExceeded');
    expect(typeof e.at).toBe('number');
  });

  it('counts events, optionally by level', () => {
    Diagnostics.warn('asset', 'missing sprite');
    Diagnostics.error('audio', 'decode failed');
    expect(Diagnostics.count()).toBe(2);
    expect(Diagnostics.count('warn')).toBe(1);
    expect(Diagnostics.count('error')).toBe(1);
  });

  it('serializes an Error detail to its message', () => {
    Diagnostics.error('audio', 'load failed', new Error('boom'));
    expect(Diagnostics.recent[0].detail).toBe('boom');
  });

  it('ring-buffers to the most recent 50 events', () => {
    for (let i = 0; i < 60; i++) Diagnostics.warn('spam', `e${i}`);
    expect(Diagnostics.count()).toBe(50);
    expect(Diagnostics.recent[0].message).toBe('e10'); // oldest 10 dropped
    expect(Diagnostics.recent[Diagnostics.recent.length - 1].message).toBe('e59');
  });

  it('forwards events to attached sinks and supports unsubscribe', () => {
    const sink = vi.fn();
    const off = Diagnostics.addSink(sink);
    Diagnostics.warn('storage', 'one');
    expect(sink).toHaveBeenCalledTimes(1);
    expect(sink.mock.calls[0][0].message).toBe('one');
    off();
    Diagnostics.warn('storage', 'two');
    expect(sink).toHaveBeenCalledTimes(1); // no longer notified
  });

  it('never lets a throwing sink break recording', () => {
    Diagnostics.addSink(() => {
      throw new Error('bad sink');
    });
    expect(() => Diagnostics.warn('storage', 'still recorded')).not.toThrow();
    expect(Diagnostics.count()).toBe(1);
  });
});
