// src/stores/ui.store.ts
import { create } from "zustand";

function getInitialDarkMode(): boolean {
  const stored = localStorage.getItem("darkMode");
  return stored !== null ? stored === "true" : true;
}

function applyDarkClass(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
}

interface UIStore {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  darkMode: getInitialDarkMode(),
  toggleDarkMode: () =>
    set((s) => {
      const next = !s.darkMode;
      localStorage.setItem("darkMode", String(next));
      applyDarkClass(next);
      return { darkMode: next };
    }),
}));
