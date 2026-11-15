"use client";

import { create } from "zustand";

interface CommandPaletteState {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

const useCommandPaletteStore = create<CommandPaletteState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((state) => ({ open: !state.open })),
}));

/**
 * useCommandPalette — global Ctrl/Cmd+K palette state shared by the shell,
 * the topbar trigger and the sidebar.
 *
 * @example
 * const { open, toggle } = useCommandPalette();
 * <button onClick={toggle}>بحث سريع</button>;
 */
export function useCommandPalette() {
  return useCommandPaletteStore();
}

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (value: boolean) => void;
  editDashboard: boolean;
  setEditDashboard: (value: boolean) => void;
}

/** useUI — persisted shell preferences (sidebar state, dashboard edit mode). */
export const useUI = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
  editDashboard: false,
  setEditDashboard: (value) => set({ editDashboard: value }),
}));
