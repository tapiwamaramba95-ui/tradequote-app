import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 1.0,
  
  // Environment
  environment: process.env.NODE_ENV,

  // Enable debug during development
  debug: process.env.NODE_ENV === 'development',

  // Server-specific integrations
  integrations: [
    // Note: Http integration removed due to API changes
  ],
});