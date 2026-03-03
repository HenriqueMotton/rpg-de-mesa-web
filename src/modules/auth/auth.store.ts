import { create } from "zustand";
import { setToken, getToken, clearToken } from "../../shared/auth/token";

type AuthStore = {
  token: string | null;
  setAuthToken: (token: string) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  token: getToken(),
  setAuthToken: (token) => {
    setToken(token);
    set({ token });
  },
  logout: () => {
    clearToken();
    set({ token: null });
  },
}));