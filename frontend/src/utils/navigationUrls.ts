/**
 * Navigation URL resolver.
 * Handles production vs. localhost environments dynamically.
 * In production (e.g. Vercel, custom domain), automatically avoids broken localhost links
 * even if environment variables are missing or misconfigured with local dev defaults.
 */

export function getCustomerUrl(): string {
  const envUrl = (import.meta.env.VITE_CUSTOMER_URL as string | undefined)?.trim();

  if (typeof window !== 'undefined') {
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    // On production domain:
    if (!isLocalhost) {
      // If a valid remote URL is provided in env (not localhost), use it
      if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
        return envUrl;
      }
      // Otherwise stay within the live production website root
      return '/';
    }
  }

  // Local development default
  return envUrl || 'http://localhost:4000';
}

export function getAdminUrl(): string {
  const envUrl = (import.meta.env.VITE_ADMIN_URL as string | undefined)?.trim();

  if (typeof window !== 'undefined') {
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    // On production domain:
    if (!isLocalhost) {
      // If a valid remote URL is provided in env (not localhost), use it
      if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
        return envUrl;
      }
      // Otherwise navigate to admin page on current production host
      return '/admin.html';
    }
  }

  // Local development default
  return envUrl || 'http://localhost:4001';
}
