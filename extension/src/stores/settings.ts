import { Storage } from "@plasmohq/storage";
import { useStorage } from "@plasmohq/storage/hook";

export interface Settings {
  apiUrl: string;
  apiToken: string;
  defaultMode: string;
  defaultModel: string;
  showInlineIcon: boolean;
  theme: "light" | "dark" | "system";
  historyEnabled: boolean;
}

const defaultSettings: Settings = {
  apiUrl: process.env.PLASMO_API_URL || "https://lubb-writer-api.adelpro.us.kg",
  apiToken: "",
  defaultMode: "humanize",
  defaultModel: "MiniMax-M2.1",
  showInlineIcon: true,
  theme: "system",
  historyEnabled: true,
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
    defaultSettings
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
