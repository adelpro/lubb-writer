import { Storage } from "@plasmohq/storage";
import { useStorage } from "@plasmohq/storage/hook";

export interface ModelOption {
  value: string;
  label: string;
}

export interface Settings {
  apiUrl: string;
  apiToken: string;
  defaultMode: string;
  defaultModel: string;
  showInlineIcon: boolean;
  theme: "light" | "dark" | "system";
  historyEnabled: boolean;
  availableModels: ModelOption[];
}

const defaultSettings: Settings = {
  apiUrl: "http://localhost:3001",
  apiToken: "",
  defaultMode: "humanize",
  defaultModel: "",
  showInlineIcon: true,
  theme: "light",
  historyEnabled: true,
  availableModels: [],
};

export const settingsStorage = new Storage({
  area: "local",
});

export const useSettingsStore = () => {
  const [settings, setSettingsData] = useStorage<Settings>(
    {
      key: "lubb-writer-settings",
      instance: settingsStorage,
    },
    defaultSettings,
  );

  const setSettings = async (newSettings: Partial<Settings>) => {
    await setSettingsData((prev) => ({
      ...defaultSettings,
      ...(prev || {}),
      ...newSettings,
    }));
  };

  return {
    ...(settings || defaultSettings),
    setSettings,
  };
};
