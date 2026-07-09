// Real authentication client — talks to the SchemaGuard backend (/api/auth/*)
// and persists the returned JWT + user profile in localStorage so the app
// stays logged in across reloads. Replaces the old mock auth in lib/mock.ts.
import { authApi } from "./api";

const TOKEN_KEY = "sg_token";
const USER_KEY = "sg_user";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

function readUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

function persist(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export const auth = {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  getUser(): AuthUser | null {
    return readUser();
  },

  /** POST /api/auth/login — throws with the backend's error message on failure. */
  async login(email: string, password: string): Promise<AuthUser> {
    const { token, user } = await authApi.login({ email, password });
    persist(token, user);
    return user;
  },

  /** POST /api/auth/register — throws with the backend's error message on failure. */
  async register(name: string, email: string, password: string): Promise<AuthUser> {
    const { token, user } = await authApi.register({ name, email, password });
    persist(token, user);
    return user;
  },

  /**
   * Re-validates the stored token against GET /api/auth/me. Call this on
   * protected-route entry so a stale/expired token bounces back to /login
   * instead of silently rendering broken data.
   */
  async refresh(): Promise<AuthUser | null> {
    const token = auth.getToken();
    if (!token) return null;
    try {
      const user = await authApi.me();
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    } catch {
      auth.logout();
      return null;
    }
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
