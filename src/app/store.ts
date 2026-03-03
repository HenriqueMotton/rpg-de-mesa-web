import { create } from "zustand";
import { persist } from "zustand/middleware";

type AppState = {
  themeMode: "dark" | "light";
  setThemeMode: (mode: "dark" | "light") => void;

  token: string | null;
  setToken: (token: string) => void;
  logout: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      themeMode: "dark",
      setThemeMode: (mode) => set({ themeMode: mode }),

      token: null,
      setToken: (token) => set({ token }),
      logout: () => set({ token: null }),
    }),
    { name: "rpg-app-store" }
  )
);