/**
 * Cookie storage utilities for managing authentication tokens and user sessions.
 * Standardizes cookie creation, retrieval, and deletion with security attributes.
 */

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const nameEQ = `${encodeURIComponent(name)}=`;
  const cookies = document.cookie.split(';');

  for (let i = 0; i < cookies.length; i++) {
    const c = cookies[i].trim();
    if (c.indexOf(nameEQ) === 0) {
      try {
        return decodeURIComponent(c.substring(nameEQ.length));
      } catch {
        return c.substring(nameEQ.length);
      }
    }
  }

  return null;
}

export function setCookie(name: string, value: string, days = 7): void {
  if (typeof document === 'undefined') return;

  const maxAge = days * 24 * 60 * 60;
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

  // Use Secure; SameSite=None on HTTPS (for cross-domain deployments), otherwise SameSite=Lax for localhost
  const sameSiteAttr = isHttps ? '; SameSite=None; Secure' : '; SameSite=Lax';

  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}${sameSiteAttr}`;
}

export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;

  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const sameSiteAttr = isHttps ? '; SameSite=None; Secure' : '; SameSite=Lax';

  document.cookie = `${encodeURIComponent(name)}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT${sameSiteAttr}`;
}
