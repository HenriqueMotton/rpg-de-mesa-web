import { create } from "zustand";
import { setToken, getToken, clearToken, decodeToken } from "../../shared/auth/token";

type AuthStore = {
  token: string | null;
  isMaster: boolean;
  setAuthToken: (token: string) => void;
  logout: () => void;
};

function readIsMaster(token: string | null): boolean {
  const payload = decodeToken(token);
  return payload.isMaster === true;
}

const storedToken = getToken();

export const useAuthStore = create<AuthStore>((set) => ({
  token: storedToken,
  isMaster: readIsMaster(storedToken),
  setAuthToken: (token) => {
    setToken(token);
    set({ token, isMaster: readIsMaster(token) });
  },
  logout: () => {
    clearToken();
    set({ token: null, isMaster: false });
  },
}));
