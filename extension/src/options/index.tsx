import "../styles.css";
import iconUrl from "data-base64:../../assets/icon.png";
import { useSettingsStore } from "../stores/settings";
import { MODES, MODELS } from "../constants";
import { Sparkles, Check, Loader2, Settings, Key, Wand2 } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

export default function Options() {
  const settings = useSettingsStore();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "features" | "api">("general");
  const [tempToken, setTempToken] = useState("");

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveToken = async () => {
    const cleanToken = tempToken.trim();
    if (!cleanToken) return;
    setSaving(true);
    await settings.setSettings({ apiToken: cleanToken });
    setSaving(false);
  };

  if (!settings.apiToken) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6 text-gray-900 dark:text-gray-100">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-8 text-center space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md bg-gray-100 flex items-center justify-center p-2">
                <img src={iconUrl} alt="Lubb Writer" className="w-full h-full object-contain" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">Configure Lubb Writer</h1>
                <p className="text-sm text-gray-500">Please provide your API token to get started.</p>
              </div>
            </div>

            <div className="space-y-4 text-left bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="space-y-2">
                <label className="text-sm font-medium">API Token:</label>
                <input
                  type="password"
                  value={tempToken}
                  onChange={(e) => setTempToken(e.target.value)}
                  placeholder="Enter your API Token"
                  className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm shadow-sm transition-shadow"
                  onKeyDown={(e) => e.key === "Enter" && handleSaveToken()}
                />
              </div>
              <button
                onClick={handleSaveToken}
                disabled={!tempToken.trim() || saving}
                className="w-full py-3 px-4 rounded-xl font-medium bg-primary hover:bg-primary-hover shadow hover:shadow-md disabled:opacity-50 text-white transition-all duration-200 flex justify-center items-center gap-2"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                {saving ? "Saving..." : "Save & Continue"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-gray-200 dark:border-gray-700">
        <Sparkles className="w-6 h-6 text-primary" />
        <h1 className="text-xl font-semibold">Lubb Writer Settings</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("general")}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 border-b-2 font-medium transition-colors text-sm",
            activeTab === "general"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          <Settings className="w-4 h-4" /> General
        </button>
        <button
          onClick={() => setActiveTab("features")}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 border-b-2 font-medium transition-colors text-sm",
            activeTab === "features"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          <Wand2 className="w-4 h-4" /> Features
        </button>
        <button
          onClick={() => setActiveTab("api")}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 border-b-2 font-medium transition-colors text-sm",
            activeTab === "api"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          <Key className="w-4 h-4" /> API Configuration
        </button>
      </div>

      <div className="w-full">
        {/* General Tab */}
        {activeTab === "general" && (
          <section className="space-y-4">
            <h2 className="font-medium text-lg hidden">Defaults</h2>
            <div className="space-y-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Default Mode</label>
                <select
                  value={settings.defaultMode}
                  onChange={async (e) => await settings.setSettings({ defaultMode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
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
                  onChange={async (e) => await settings.setSettings({ defaultModel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {MODELS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-medium pt-2">Theme</label>
                <select
                  value={settings.theme}
                  onChange={async (e) => await settings.setSettings({ theme: e.target.value as "light" | "dark" | "system" })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="system">System Default</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
          </section>
        )}

        {/* Features Tab */}
        {activeTab === "features" && (
          <section className="space-y-4">
            <div className="space-y-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={settings.showInlineIcon}
                  onChange={async (e) => await settings.setSettings({ showInlineIcon: e.target.checked })}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                <div>
                  <span className="font-medium">Show inline enhancement icon</span>
                  <p className="text-xs text-gray-500">Show ✨ icon next to text inputs on webpages</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={settings.historyEnabled}
                  onChange={async (e) => await settings.setSettings({ historyEnabled: e.target.checked })}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                <div>
                  <span className="font-medium">Enable history</span>
                  <p className="text-xs text-gray-500">Store recent enhancements in the popup</p>
                </div>
              </label>
            </div>
          </section>
        )}

        {/* API Tab */}
        {activeTab === "api" && (
          <section className="space-y-4">
            <div className="space-y-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="space-y-2">
                <label className="block text-sm font-medium">API URL</label>
                <input
                  type="url"
                  value={settings.apiUrl}
                  onChange={async (e) => await settings.setSettings({ apiUrl: e.target.value })}
                  placeholder="https://lubb-writer-api.adelpro.us.kg"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Your Lubb Writer API endpoint</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-medium pt-2">API Token</label>
                <input
                  type="password"
                  value={settings.apiToken}
                  onChange={async (e) => await settings.setSettings({ apiToken: e.target.value.trim() })}
                  placeholder="Your API token"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty if the API defaults don't require authorization</p>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleSave}
          disabled={saving}
          className={clsx(
            "px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all duration-200",
            "bg-primary hover:bg-primary-hover text-white disabled:opacity-50 shadow-sm hover:shadow"
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
    </div>
  );
}
