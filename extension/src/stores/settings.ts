import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Settings {
  apiUrl: string;
  apiToken: string;
  defaultMode: string;
  defaultModel: string;
  showInlineIcon: boolean;
  theme: "light" | "dark" | "system";
  historyEnabled: boolean;
}

interface SettingsStore extends Settings {
  setSettings: (settings: Partial<Settings>) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      apiUrl: "https://lubb-writer-api.adelpro.us.kg",
      apiToken: "",
      defaultMode: "humanize",
      defaultModel: "MiniMax-M2.1",
      showInlineIcon: true,
      theme: "system",
      historyEnabled: true,
      setSettings: (settings) => set((state) => ({ ...state, ...settings })),
    }),
    {
      name: "lubb-writer-settings",
    }
  )
);
