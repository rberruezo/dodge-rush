/**
 * Lightweight, dependency-free diagnostics.
 *
 * The game swallows several "expected" failures (private-mode localStorage,
 * missing assets, blocked audio) so play never breaks. Silently dropping them,
 * though, makes field issues invisible. `Diagnostics` records each such event in
 * a small ring buffer, optionally mirrors it to the console (dev), and lets a
 * sink be attached later (analytics/telemetry, see backlog #4) — without any of
 * the call sites needing to know where the data ends up.
 */
export type DiagLevel = 'warn' | 'error';

export interface DiagEvent {
  level: DiagLevel;
  scope: string; // coarse area: 'storage' | 'asset' | 'audio' | …
  message: string;
  detail?: string; // optional extra context (e.g. an error's message)
  at: number; // epoch ms when recorded
}

export type DiagSink = (event: DiagEvent) => void;

const RING_SIZE = 50;

class DiagnosticsImpl {
  private events: DiagEvent[] = [];
  private sinks: DiagSink[] = [];
  private mirror = true; // echo to console (handy in dev; silence in tests)

  /** Record an event, ring-buffering the most recent `RING_SIZE`. */
  record(level: DiagLevel, scope: string, message: string, detail?: unknown): DiagEvent {
    const event: DiagEvent = {
      level,
      scope,
      message,
      detail: detail === undefined ? undefined : DiagnosticsImpl.stringify(detail),
      at: Date.now()
    };

    this.events.push(event);
    if (this.events.length > RING_SIZE) this.events.shift();

    if (this.mirror) {
      const line = `[DodgeRush:${scope}] ${message}`;
      if (level === 'error') console.error(line, detail ?? '');
      else console.warn(line, detail ?? '');
    }

    for (const sink of this.sinks) {
      try {
        sink(event);
      } catch {
        /* a broken sink must never break the game */
      }
    }
    return event;
  }

  warn(scope: string, message: string, detail?: unknown): void {
    this.record('warn', scope, message, detail);
  }

  error(scope: string, message: string, detail?: unknown): void {
    this.record('error', scope, message, detail);
  }

  /** Most-recent-last view of the buffered events. */
  get recent(): readonly DiagEvent[] {
    return this.events;
  }

  /** Count of buffered events, optionally filtered by level. */
  count(level?: DiagLevel): number {
    return level ? this.events.filter((e) => e.level === level).length : this.events.length;
  }

  clear(): void {
    this.events = [];
  }

  /** Attach a sink (e.g. telemetry). Returns an unsubscribe function. */
  addSink(sink: DiagSink): () => void {
    this.sinks.push(sink);
    return () => {
      const i = this.sinks.indexOf(sink);
      if (i !== -1) this.sinks.splice(i, 1);
    };
  }

  /** Toggle console mirroring (tests disable it to stay quiet). */
  setConsoleMirror(on: boolean): void {
    this.mirror = on;
  }

  private static stringify(detail: unknown): string {
    if (detail instanceof Error) return detail.message;
    if (typeof detail === 'string') return detail;
    try {
      return JSON.stringify(detail);
    } catch {
      return String(detail);
    }
  }
}

export const Diagnostics = new DiagnosticsImpl();
