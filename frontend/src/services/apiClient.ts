export const GRAPHQL_URL =
  (import.meta.env.VITE_GRAPHQL_URL as string) || 'http://localhost:8000/graphql';
export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem('aura_token');
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem('aura_token', token);
    } else {
      localStorage.removeItem('aura_token');
    }
  } catch {
    // Ignore storage errors
  }
}

export async function graphqlRequest<T = any>(
  query: string,
  variables?: Record<string, unknown>,
  tokenOverride?: string
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  const token = tokenOverride || getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const result = await response.json();

    if (!response.ok || result.errors?.length) {
      const errorMsg = result.errors?.[0]?.message ?? `GraphQL request failed with HTTP ${response.status}`;
      throw new Error(errorMsg);
    }

    return result.data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export async function checkBackendConnection(): Promise<boolean> {
  try {
    const data = await graphqlRequest<{ getAllProduct?: unknown[] }>(`
      query HealthCheck {
        getAllProduct {
          id
        }
      }
    `);
    return Boolean(data);
  } catch {
    return false;
  }
}
