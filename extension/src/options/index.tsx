import "../styles.css";
import iconUrl from "data-base64:../../assets/icon.png";
import { useSettingsStore } from "../stores/settings";
import { MODES, VERSION } from "../constants";
import { Check, Loader2, Settings, Key, SlidersHorizontal } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchAvailableModels } from "../lib/api";
import clsx from "clsx";

export default function Options() {
  const settings = useSettingsStore();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "features" | "api">(
    "general",
  );
  const [tempToken, setTempToken] = useState("");
  const [tempUrl, setTempUrl] = useState("http://localhost:3001");
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

  const isRTL = chrome.i18n.getUILanguage().startsWith("ar");

  const loadModels = async () => {
    if (!settings.apiToken || !settings.apiUrl) return;

    setModelsLoading(true);
    setModelsError(null);
    try {
      const models = await fetchAvailableModels(settings);
      const modelOptions = models.map((m) => ({
        value: m.name,
        label: `${m.providerName}: ${formatModelLabel(m.name)}`,
      }));
      await settings.setSettings({ availableModels: modelOptions });
    } catch (err) {
      console.error("Failed to fetch models:", err);
      setModelsError(
        err instanceof Error ? err.message : "Failed to load models",
      );
    } finally {
      setModelsLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, [settings.apiToken, settings.apiUrl]);

  const formatModelLabel = (name: string): string => {
    return name
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const displayModels = settings.availableModels;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveToken = async () => {
    const cleanToken = tempToken.trim();
    if (!cleanToken) return;
    setSaving(true);
    await settings.setSettings({
      apiToken: cleanToken,
      apiUrl: tempUrl.trim() || "http://localhost:3001",
    });
    setSaving(false);
    await loadModels();
  };

  if (!settings.apiToken) {
    return (
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6 text-gray-900 dark:text-gray-100"
      >
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-8 text-center space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md bg-white/90 flex items-center justify-center p-2 ring-1 ring-gray-200/50 dark:ring-gray-700/50">
                <img
                  src={iconUrl}
                  alt="Lubb Writer"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">
                  {chrome.i18n.getMessage("configureExtension") ||
                    "Configure Lubb Writer"}
                </h1>
                <p className="text-sm text-gray-500">
                  {chrome.i18n.getMessage("apiKeyRequired") ||
                    "Please provide your API token to get started."}
                </p>
              </div>
            </div>

            <div className="space-y-4 text-left bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {chrome.i18n.getMessage("apiUrl") || "API URL"}:
                </label>
                <input
                  type="url"
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                  placeholder="http://localhost:3001"
                  className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm shadow-sm transition-shadow"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {chrome.i18n.getMessage("apiToken") || "API Token"}:
                </label>
                <input
                  type="password"
                  value={tempToken}
                  onChange={(e) => setTempToken(e.target.value)}
                  placeholder={
                    chrome.i18n.getMessage("apiTokenPlaceholder") ||
                    "Enter your API Token"
                  }
                  className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm shadow-sm transition-shadow"
                  onKeyDown={(e) => e.key === "Enter" && handleSaveToken()}
                />
              </div>
              <button
                onClick={handleSaveToken}
                disabled={!tempToken.trim() || saving}
                className="w-full py-3 px-4 rounded-xl font-medium bg-primary hover:bg-primary-hover shadow hover:shadow-md disabled:opacity-50 text-white transition-all duration-200 flex justify-center items-center gap-2"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
                {saving
                  ? chrome.i18n.getMessage("saving") || "Saving..."
                  : chrome.i18n.getMessage("saveAndContinue") ||
                    "Save & Continue"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
    >
      <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm bg-white/90 flex items-center justify-center p-1.5 ring-1 ring-gray-200/50 dark:ring-gray-700/50">
            <img
              src={iconUrl}
              alt="Writer"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-xl font-semibold">
            {chrome.i18n.getMessage("settingsTitle") || "Settings"}
          </h1>
        </div>

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Settings navigation"
          className="flex border-b border-gray-200 dark:border-gray-700"
        >
          <button
            role="tab"
            aria-selected={activeTab === "general"}
            onClick={() => setActiveTab("general")}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 border-b-2 font-medium transition-colors text-sm",
              activeTab === "general"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
            )}
          >
            <Settings className="w-4 h-4" aria-hidden="true" />{" "}
            {chrome.i18n.getMessage("general") || "General"}
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "features"}
            onClick={() => setActiveTab("features")}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 border-b-2 font-medium transition-colors text-sm",
              activeTab === "features"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
            )}
          >
            <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />{" "}
            {chrome.i18n.getMessage("features") || "Features"}
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "api"}
            onClick={() => setActiveTab("api")}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 border-b-2 font-medium transition-colors text-sm",
              activeTab === "api"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
            )}
          >
            <Key className="w-4 h-4" aria-hidden="true" />{" "}
            {chrome.i18n.getMessage("apiConfiguration") || "API Configuration"}
          </button>
        </div>

        <div className="w-full">
          {/* General Tab */}
          {activeTab === "general" && (
            <section className="space-y-4">
              <h2 className="font-medium text-lg hidden">Defaults</h2>
              <div className="space-y-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    {chrome.i18n.getMessage("defaultModeLabel") ||
                      "Default Mode"}
                  </label>
                  <select
                    value={settings.defaultMode}
                    onChange={async (e) =>
                      await settings.setSettings({
                        defaultMode: e.target.value,
                      })
                    }
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
                  <label className="block text-sm font-medium">
                    {chrome.i18n.getMessage("defaultModel") || "Default Model"}{" "}
                    {modelsLoading &&
                      `(${chrome.i18n.getMessage("loading") || "Loading..."})`}
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={settings.defaultModel}
                      onChange={async (e) =>
                        await settings.setSettings({
                          defaultModel: e.target.value,
                        })
                      }
                      className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                      disabled={modelsLoading}
                    >
                      {modelsLoading ? (
                        <option>
                          {chrome.i18n.getMessage("loadingModels") ||
                            "Loading models..."}
                        </option>
                      ) : displayModels.length === 0 ? (
                        <option value="">
                          {chrome.i18n.getMessage("noModelsAvailable") ||
                            "No models available"}
                        </option>
                      ) : (
                        displayModels.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))
                      )}
                    </select>
                    <button
                      onClick={loadModels}
                      disabled={
                        modelsLoading || !settings.apiToken || !settings.apiUrl
                      }
                      className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                      title={
                        chrome.i18n.getMessage("refreshModels") ||
                        "Refresh models"
                      }
                    >
                      <Loader2
                        className={clsx(
                          "w-4 h-4",
                          modelsLoading && "animate-spin",
                        )}
                      />
                    </button>
                  </div>
                  {modelsError && (
                    <p className="text-xs text-red-500 mt-1">{modelsError}</p>
                  )}
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
                    onChange={async (e) =>
                      await settings.setSettings({
                        showInlineIcon: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-primary rounded focus:ring-primary"
                  />
                  <div>
                    <span className="font-medium flex items-center gap-2">
                      {chrome.i18n.getMessage("showInlineEnhancement") ||
                        "Show inline enhancement icon"}
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary dark:bg-primary/20 rounded-full">
                        {chrome.i18n.getMessage("comingSoon") || "Coming Soon"}
                      </span>
                    </span>
                    <p className="text-xs text-gray-500">
                      {chrome.i18n.getMessage("showIconNextToInputs") ||
                        "Show ✨ icon next to text inputs on webpages"}
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.historyEnabled}
                    onChange={async (e) =>
                      await settings.setSettings({
                        historyEnabled: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-primary rounded focus:ring-primary"
                  />
                  <div>
                    <span className="font-medium">
                      {chrome.i18n.getMessage("enableHistorySetting") ||
                        "Enable history"}
                    </span>
                    <p className="text-xs text-gray-500">
                      {chrome.i18n.getMessage("storeRecentEnhancements") ||
                        "Store recent enhancements in the popup"}
                    </p>
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
                  <label className="block text-sm font-medium">
                    {chrome.i18n.getMessage("apiUrl") || "API URL"}
                  </label>
                  <input
                    type="url"
                    autoComplete="off"
                    spellCheck={false}
                    value={settings.apiUrl}
                    onChange={async (e) => {
                      await settings.setSettings({ apiUrl: e.target.value });
                      await loadModels();
                    }}
                    placeholder="https://lubb-writer-api.adelpro.us.kg"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {chrome.i18n.getMessage("yourApiEndpoint") ||
                      "Your Lubb Writer API endpoint"}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <label className="block text-sm font-medium pt-2">
                    {chrome.i18n.getMessage("yourApiToken") || "API Token"}
                  </label>
                  <input
                    type="password"
                    autoComplete="off"
                    spellCheck={false}
                    value={settings.apiToken}
                    onChange={async (e) => {
                      await settings.setSettings({
                        apiToken: e.target.value.trim(),
                      });
                      await loadModels();
                    }}
                    placeholder={
                      chrome.i18n.getMessage("apiTokenPlaceholder") ||
                      "Your API token"
                    }
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {chrome.i18n.getMessage("leaveEmptyIfNoAuth") ||
                      "Leave empty if the API defaults don't require authorization"}
                  </p>
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
              "bg-primary hover:bg-primary-hover text-white disabled:opacity-50 shadow-sm hover:shadow",
            )}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {chrome.i18n.getMessage("saving") || "Saving..."}
              </>
            ) : saved ? (
              <>
                <Check className="w-4 h-4" />
                {chrome.i18n.getMessage("saved") || "Saved!"}
              </>
            ) : (
              chrome.i18n.getMessage("save") || "Save Settings"
            )}
          </button>
          <div
            className={clsx(
              "text-xs text-gray-400 dark:text-gray-500",
              isRTL ? "mr-auto" : "ml-auto",
            )}
          >
            v{VERSION}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-6 pt-6 text-xs text-gray-400 dark:text-gray-500 border-t border-gray-200 dark:border-gray-700">
          <a
            href="https://lubbwriter.adelpro.us.kg"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            Home
          </a>
          <span>•</span>
          <a
            href="https://lubbwriter.adelpro.us.kg/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            Privacy
          </a>
        </div>
      </div>
    </div>
  );
}
