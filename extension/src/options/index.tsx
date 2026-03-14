import { useSettingsStore } from "../stores/settings";
import { MODES, MODELS } from "../constants";
import { Sparkles, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

export default function Options() {
  const settings = useSettingsStore();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Zustand persist auto-saves, just simulate a small delay for UX
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-gray-200 dark:border-gray-700">
        <Sparkles className="w-6 h-6 text-primary" />
        <h1 className="text-xl font-semibold">Lubb Writer Settings</h1>
      </div>

      {/* API Configuration */}
      <section className="space-y-4">
        <h2 className="font-medium text-lg">API Configuration</h2>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">API URL</label>
          <input
            type="url"
            value={settings.apiUrl}
            onChange={(e) => settings.setSettings({ apiUrl: e.target.value })}
            placeholder="https://lubb-writer-api.adelpro.us.kg"
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-gray-500">Your Lubb Writer API endpoint</p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">API Token</label>
          <input
            type="password"
            value={settings.apiToken}
            onChange={(e) => settings.setSettings({ apiToken: e.target.value })}
            placeholder="Your API token"
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-gray-500">Leave empty if API doesn't require auth</p>
        </div>
      </section>

      {/* Defaults */}
      <section className="space-y-4">
        <h2 className="font-medium text-lg">Defaults</h2>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">Default Mode</label>
          <select
            value={settings.defaultMode}
            onChange={(e) => settings.setSettings({ defaultMode: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Default Model</label>
          <select
            value={settings.defaultModel}
            onChange={(e) => settings.setSettings({ defaultModel: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {MODELS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Features */}
      <section className="space-y-4">
        <h2 className="font-medium text-lg">Features</h2>
        
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.showInlineIcon}
            onChange={(e) => settings.setSettings({ showInlineIcon: e.target.checked })}
            className="w-4 h-4 text-primary rounded focus:ring-primary"
          />
          <div>
            <span className="font-medium">Show inline enhancement icon</span>
            <p className="text-xs text-gray-500">Show ✨ icon next to text inputs</p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.historyEnabled}
            onChange={(e) => settings.setSettings({ historyEnabled: e.target.checked })}
            className="w-4 h-4 text-primary rounded focus:ring-primary"
          />
          <div>
            <span className="font-medium">Enable history</span>
            <p className="text-xs text-gray-500">Store recent enhancements</p>
          </div>
        </label>
      </section>

      {/* Appearance */}
      <section className="space-y-4">
        <h2 className="font-medium text-lg">Appearance</h2>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">Theme</label>
          <select
            value={settings.theme}
            onChange={(e) => settings.setSettings({ theme: e.target.value as "light" | "dark" | "system" })}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="system">System Default</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleSave}
          disabled={saving}
          className={clsx(
            "px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors",
            "bg-primary hover:bg-primary-hover text-white disabled:opacity-50"
          )}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <Check className="w-4 h-4" />
              Saved!
            </>
          ) : (
            "Save Settings"
          )}
        </button>
      </div>
    </div>
  );
}
