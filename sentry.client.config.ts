import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of transactions
  
  // Session Replay (optional - captures user sessions)
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
  
  // Environment
  environment: process.env.NODE_ENV,

  // Enable debug during development
  debug: process.env.NODE_ENV === 'development',

  // Integrations
  integrations: [
    // Note: UserAgent integration removed due to API changes
  ],
});