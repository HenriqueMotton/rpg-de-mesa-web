import { create } from "zustand";

type AppState = {
  themeMode: "dark" | "light";
  setThemeMode: (mode: "dark" | "light") => void;

  sessionName: string;
  setSessionName: (name: string) => void;
};

export const useAppStore = create<AppState>((set) => ({
  themeMode: "dark",
  setThemeMode: (mode) => set({ themeMode: mode }),

  sessionName: "Campanha",
  setSessionName: (sessionName) => set({ sessionName }),
}));