import pino from 'pino';
import type { Logger } from 'pino';
import { addBreadcrumb } from './sentry';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LogEvent {
  readonly messages?: readonly unknown[];
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const IS_DEV: boolean = !!(import.meta as unknown as { env: { DEV?: boolean } }).env.DEV;

const logger: Logger = pino({
  level: IS_DEV ? 'debug' : 'warn',
  browser: {
    asObject: true,
    transmit: {
      level: 'warn',
      send(level: string, logEvent: LogEvent): void {
        // Pipe warn+ to Sentry breadcrumbs
        const msg = logEvent.messages?.[0] || '';
        const data = logEvent.messages?.[1] || {};
        addBreadcrumb(
          'logger',
          String(msg),
          typeof data === 'object' && data !== null ? data as Record<string, unknown> : {},
          level as 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug',
        );
      },
    },
  },
});

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function createLogger(module: string): Logger {
  return logger.child({ module });
}

export default logger;
