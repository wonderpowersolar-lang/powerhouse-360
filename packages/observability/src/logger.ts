import { redact } from "./redact";

/**
 * Strukturierter JSON-Zeilen-Logger mit zentraler Redaction (Masterplan §8).
 * Bewusst klein: stdout/stderr, ein JSON-Objekt je Zeile — Container-Logs
 * bleiben greppbar und maschinenlesbar; ein Log-Backend kann später andocken.
 * Alle Felder laufen durch `redact` — sensible Werte können nicht versehentlich
 * geloggt werden.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export type Logger = {
  debug: (msg: string, fields?: Record<string, unknown>) => void;
  info: (msg: string, fields?: Record<string, unknown>) => void;
  warn: (msg: string, fields?: Record<string, unknown>) => void;
  error: (msg: string, fields?: Record<string, unknown>) => void;
  child: (context: Record<string, unknown>) => Logger;
};

function write(level: LogLevel, context: Record<string, unknown>, msg: string, fields?: Record<string, unknown>) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    msg,
    ...(redact(context) as Record<string, unknown>),
    ...(fields ? (redact(fields) as Record<string, unknown>) : {}),
  });
  if (level === "error" || level === "warn") process.stderr.write(line + "\n");
  else process.stdout.write(line + "\n");
}

export function createLogger(context: Record<string, unknown> = {}): Logger {
  return {
    debug: (msg, fields) => write("debug", context, msg, fields),
    info: (msg, fields) => write("info", context, msg, fields),
    warn: (msg, fields) => write("warn", context, msg, fields),
    error: (msg, fields) => write("error", context, msg, fields),
    child: (extra) => createLogger({ ...context, ...extra }),
  };
}
