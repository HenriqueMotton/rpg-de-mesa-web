const TOKEN_KEY = "token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function decodeToken(token: string | null): Record<string, unknown> {
  if (!token) return {};
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}