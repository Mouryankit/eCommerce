import type { User } from '../types';
import { graphqlRequest, getStoredToken, setStoredToken } from './apiClient';

export async function loginToBackend(email: string, password: string): Promise<{
  token: string;
  user: User;
  redirectUrl: string;
}> {
  const data = await graphqlRequest<{
    login: {
      token: string;
      redirectUrl: string;
      user: {
        id: number;
        name: string;
        email: string;
        role: string;
        avatar?: string;
      };
    };
  }>(
    `
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          token
          redirectUrl
          user {
            id
            name
            email
            role
            avatar
          }
        }
      }
    `,
    { input: { email, password } }
  );

  const res = data.login;
  setStoredToken(res.token);

  return {
    token: res.token,
    redirectUrl: res.redirectUrl,
    user: {
      id: res.user.id,
      name: res.user.name,
      email: res.user.email,
      role: res.user.role.toUpperCase() === 'ADMIN' ? 'admin' : 'customer',
      avatar: res.user.avatar,
    },
  };
}

export async function registerToBackend(name: string, email: string, password: string): Promise<{
  token: string;
  user: User;
  redirectUrl: string;
}> {
  const data = await graphqlRequest<{
    register: {
      token: string;
      redirectUrl: string;
      user: {
        id: number;
        name: string;
        email: string;
        role: string;
        avatar?: string;
      };
    };
  }>(
    `
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          token
          redirectUrl
          user {
            id
            name
            email
            role
            avatar
          }
        }
      }
    `,
    { input: { name, email, password } }
  );

  const res = data.register;
  setStoredToken(res.token);

  return {
    token: res.token,
    redirectUrl: res.redirectUrl,
    user: {
      id: res.user.id,
      name: res.user.name,
      email: res.user.email,
      role: 'customer',
      avatar: res.user.avatar,
    },
  };
}

export async function fetchCurrentUser(): Promise<User | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const data = await graphqlRequest<{
      me: {
        id: number;
        name: string;
        email: string;
        role: string;
        avatar?: string;
      };
    }>(`
      query GetCurrentUser {
        me {
          id
          name
          email
          role
          avatar
        }
      }
    `);

    if (!data.me) return null;

    return {
      id: data.me.id,
      name: data.me.name,
      email: data.me.email,
      role: data.me.role.toUpperCase() === 'ADMIN' ? 'admin' : 'customer',
      avatar: data.me.avatar,
    };
  } catch {
    return null;
  }
}
