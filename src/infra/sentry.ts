import * as Sentry from '@sentry/browser';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';

type BreadcrumbLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DSN: string = (import.meta as unknown as { env: Record<string, string | undefined> }).env.VITE_SENTRY_DSN || '';
const RELEASE: string = (import.meta as unknown as { env: Record<string, string | undefined> }).env.VITE_RELEASE || 'dev';
const ENVIRONMENT: string = (import.meta as unknown as { env: Record<string, string | undefined> }).env.MODE || 'development';

let initialized = false;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function initSentry(): void {
  if (initialized || !DSN) return;

  Sentry.init({
    dsn: DSN,
    release: `sofia-cantina@${RELEASE}`,
    environment: ENVIRONMENT,
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.2 : 1.0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    beforeBreadcrumb(breadcrumb: Sentry.Breadcrumb): Sentry.Breadcrumb | null {
      // Filter noisy breadcrumbs
      if (breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch') {
        return breadcrumb;
      }
      if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
        return null;
      }
      return breadcrumb;
    },
  });

  initialized = true;
}

export function captureError(
  error: unknown,
  context: Record<string, unknown> = {},
): void {
  if (!initialized) {
    // eslint-disable-next-line no-console
    console.error('[Sentry not initialized]', error, context);
    return;
  }
  Sentry.withScope((scope: Sentry.Scope) => {
    Object.entries(context).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });
    Sentry.captureException(error);
  });
}

export function captureMessage(
  message: string,
  level: SeverityLevel = 'info',
  context: Record<string, unknown> = {},
): void {
  if (!initialized) return;
  Sentry.withScope((scope: Sentry.Scope) => {
    Object.entries(context).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });
    Sentry.captureMessage(message, level);
  });
}

export function addBreadcrumb(
  category: string,
  message: string,
  data: Record<string, unknown> = {},
  level: BreadcrumbLevel = 'info',
): void {
  if (!initialized) return;
  Sentry.addBreadcrumb({ category, message, data, level });
}

export function setUser(
  id: string,
  email?: string,
  username?: string,
): void {
  if (!initialized) return;
  Sentry.setUser({ id, email, username });
}

export function clearUser(): void {
  if (!initialized) return;
  Sentry.setUser(null);
}
