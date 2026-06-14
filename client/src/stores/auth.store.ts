// src/stores/auth.store.ts
import type { AuthUser } from "@/types/users.type";
import { create } from "zustand";

interface AuthStore {
  user: AuthUser | null;
  permissions: string[];
  isAuthenticated: boolean;
  isBootstrapped: boolean;

  setAuth: (payload: { user: AuthUser; permissions: string[] }) => void;
  clearAuth: () => void;
  can: (permission: string) => boolean;
  canAny: (permissions: string[]) => boolean;
  canAll: (permissions: string[]) => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  permissions: [],
  isAuthenticated: false,
  isBootstrapped: false,

  setAuth: ({ user, permissions }) =>
    set({ user, permissions, isAuthenticated: true, isBootstrapped: true }),

  clearAuth: () =>
    set({ user: null, permissions: [], isAuthenticated: false, isBootstrapped: true }),

  can: (permission) => {
    const { permissions } = get();
    return permissions.includes("*") || permissions.includes(permission);
  },

  canAny: (perms) => {
    const { permissions } = get();
    if (permissions.includes("*")) return true;
    return perms.some((p) => permissions.includes(p));
  },

  canAll: (perms) => {
    const { permissions } = get();
    if (permissions.includes("*")) return true;
    return perms.every((p) => permissions.includes(p));
  },
}));
