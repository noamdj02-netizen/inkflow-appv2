// Next.js Sentry edge (si build Next). Prod InkFlow = Vite — voir docs/MONITORING-P0.md
// DSN : SENTRY_DSN (env), jamais en dur.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 1,
    enableLogs: true,
    sendDefaultPii: true,
  });
}
