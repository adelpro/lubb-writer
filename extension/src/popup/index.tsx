import "../styles.css";
import iconUrl from "data-base64:../../assets/icon.png";
import { useState, useEffect } from "react";
import { useSettingsStore } from "../stores/settings";
import { useHistoryStore } from "../stores/history";
import { enhanceText, fetchAvailableModels } from "../lib/api";
import { MODES } from "../constants";
import {
  Sparkles,
  Copy,
  Check,
  Settings,
  Loader2,
  Clock,
  Trash2,
  Keyboard,
} from "lucide-react";
import clsx from "clsx";

export default function Popup() {
  const settings = useSettingsStore();
  const { history, addItem, clearHistory, removeItem } = useHistoryStore();

  const [activeTab, setActiveTab] = useState<"write" | "history">("write");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState(settings.defaultMode);
  const [model, setModel] = useState(settings.defaultModel);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedHistoryId, setCopiedHistoryId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [tokenUsage, setTokenUsage] = useState<number | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  useEffect(() => {
    const loadPendingText = async () => {
      try {
        const response = await chrome.runtime.sendMessage({
          type: "getPendingText",
          tabId: undefined,
        });
        if (response?.text) {
          setInput(response.text);
        }
      } catch (e) {
        // Ignore - popup might be opened without pending text
      }
    };

    loadPendingText();
  }, []);

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

      if (!settings.defaultModel && modelOptions.length > 0) {
        await settings.setSettings({ defaultModel: modelOptions[0].value });
        setModel(modelOptions[0].value);
      } else {
        const modelNames = models.map((m) => m.name);
        if (
          settings.defaultModel &&
          !modelNames.includes(settings.defaultModel)
        ) {
          await settings.setSettings({ defaultModel: modelOptions[0].value });
          setModel(modelOptions[0].value);
        }
      }
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

  const handleEnhance = async () => {
    if (!input.trim()) {
      setError("Please enter some text");
      return;
    }

    // Handle loading state separately
    if (modelsLoading) {
      setError("Models are still loading. Please wait...");
      return;
    }

    // Resolve effective model by validating against available models
    const availableModelNames = settings.availableModels.map((m) => m.value);
    let modelToUse = "";

    if (model && availableModelNames.includes(model)) {
      modelToUse = model;
    } else if (
      settings.defaultModel &&
      availableModelNames.includes(settings.defaultModel)
    ) {
      modelToUse = settings.defaultModel;
    }

    if (!modelToUse) {
      setError("No model available. Please configure an AI provider.");
      return;
    }

    setLoading(true);
    setError("");
    setOutput("");
    setTokenUsage(null);

    try {
      const result = await enhanceText(input, mode, settings, modelToUse);
      setOutput(result.result);
      setTokenUsage(result.usage?.total_tokens || null);

      if (settings.historyEnabled) {
        await addItem({
          originalText: input,
          enhancedText: result.result,
          mode,
          model: modelToUse,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enhance text");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, isHistoryId?: string) => {
    await navigator.clipboard.writeText(text);
    if (isHistoryId) {
      setCopiedHistoryId(isHistoryId);
      setTimeout(() => setCopiedHistoryId(null), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openOptions = () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    }
  };

  const formatRelativeTime = (timestamp: number): string => {
    const uiLang = chrome.i18n.getUILanguage();
    const rtf = new Intl.RelativeTimeFormat(uiLang, {
      numeric: "auto",
    });
    const diffSeconds = Math.round((timestamp - Date.now()) / 1000);

    if (Math.abs(diffSeconds) < 60) {
      return rtf.format(diffSeconds, "second");
    }
    const diffMinutes = Math.round(diffSeconds / 60);
    if (Math.abs(diffMinutes) < 60) {
      return rtf.format(diffMinutes, "minute");
    }
    const diffHours = Math.round(diffMinutes / 60);
    if (Math.abs(diffHours) < 24) {
      return rtf.format(diffHours, "hour");
    }
    const diffDays = Math.round(diffHours / 24);
    if (Math.abs(diffDays) < 30) {
      return rtf.format(diffDays, "day");
    }
    return new Intl.DateTimeFormat(uiLang, {
      month: "short",
      day: "numeric",
    }).format(timestamp);
  };

  const [tempToken, setTempToken] = useState("");
  const [tempUrl, setTempUrl] = useState(settings.apiUrl);

  const handleSaveToken = async () => {
    const cleanToken = tempToken.trim();
    if (!cleanToken) return;
    setLoading(true);
    await settings.setSettings({
      apiToken: cleanToken,
      apiUrl: tempUrl.trim() || settings.apiUrl,
    });
    setLoading(false);
    await loadModels();
  };

  if (!settings.apiToken) {
    return (
      <div className="w-[400px] h-[510px] flex flex-col bg-background dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 p-6 justify-center items-center text-center">
        <div className="space-y-8 w-full max-w-sm">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex overflow-hidden justify-center items-center p-2 mt-8 w-16 h-16 rounded-2xl ring-1 shadow-md bg-white/90 ring-gray-200/50 dark:ring-gray-700/50">
              <img
                src={iconUrl}
                alt="Lubb Writer"
                className="object-contain w-full h-full"
              />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold">
                {chrome.i18n.getMessage("welcome") || "Welcome"}
              </h1>
              <p className="px-4 text-sm text-gray-500">
                {chrome.i18n.getMessage("configureApiToken") ||
                  "Configure your API URL and token to unlock Lubb Writer."}
              </p>
            </div>
          </div>

          <div className="p-5 space-y-4 text-left bg-gray-50 rounded-xl border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {chrome.i18n.getMessage("apiUrl") || "API URL"}
              </label>
              <input
                type="url"
                autoComplete="off"
                spellCheck={false}
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                placeholder="https://lubb-writer-api.adelpro.us.kg"
                className="w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {chrome.i18n.getMessage("apiTokenLabel") || "API Token"}
              </label>
              <input
                type="password"
                autoComplete="off"
                spellCheck={false}
                value={tempToken}
                onChange={(e) => setTempToken(e.target.value)}
                placeholder={
                  chrome.i18n.getMessage("pasteYourTokenHere") ||
                  "Paste your token here"
                }
                className="w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm shadow-sm"
                onKeyDown={(e) => e.key === "Enter" && handleSaveToken()}
              />
            </div>
            <button
              onClick={handleSaveToken}
              disabled={!tempToken.trim() || loading}
              className="w-full py-2.5 px-4 rounded-lg font-medium bg-primary hover:bg-primary-hover shadow-sm hover:shadow disabled:opacity-50 text-white transition-all duration-200 flex justify-center items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="w-4 h-4" aria-hidden="true" />
              )}
              {loading
                ? chrome.i18n.getMessage("saving") || "Saving…"
                : chrome.i18n.getMessage("saveAndContinue") ||
                  "Save & Continue"}
            </button>
            <div className="pt-2 text-center">
              <button
                onClick={openOptions}
                className="text-xs text-gray-500 transition-colors hover:text-primary hover:underline"
              >
                {chrome.i18n.getMessage("advancedConfiguration") ||
                  "Advanced configuration..."}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isRTL = chrome.i18n.getUILanguage().startsWith("ar");

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className={clsx(
        "flex flex-col mt-4 text-sm border w-[400px] h-[500px]",
        isDark
          ? "text-gray-100 bg-gray-900 border-gray-800"
          : "text-gray-900 border-gray-200 bg-background",
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="flex gap-2 items-center">
          <div className="p-1.5 bg-white/90 rounded-xl shadow-sm ring-1 ring-gray-200/50 dark:ring-gray-700/50">
            <img src={iconUrl} alt="Lubb Writer" className="w-5 h-5" />
          </div>
          <span className="text-lg font-semibold">
            {chrome.i18n.getMessage("largestWriter") || "Lubb Writer"}
          </span>
        </div>
        <div className="flex gap-1 items-center">
          <div className="relative">
            <button
              onClick={() => setShowShortcuts(!showShortcuts)}
              aria-label={
                chrome.i18n.getMessage("keyboardShortcutsLabel") ||
                "Keyboard shortcuts"
              }
              aria-expanded={showShortcuts}
              aria-haspopup="true"
              className="p-2 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Keyboard className="w-4 h-4 text-gray-500" />
            </button>
            {showShortcuts && (
              <div
                role="tooltip"
                className={clsx(
                  "absolute z-50 p-3 mt-2 w-48 bg-white rounded-lg border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700",
                  isRTL ? "left-0" : "right-0",
                )}
              >
                <p className="mb-2 text-xs font-medium">
                  {chrome.i18n.getMessage("keyboardShortcuts") ||
                    "Keyboard Shortcuts"}
                </p>
                <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between items-center">
                    <span>
                      {chrome.i18n.getMessage("enhanceSelection") ||
                        "Enhance Selection"}
                    </span>
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px] font-mono">
                      Ctrl+Shift+Y
                    </kbd>
                  </div>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={openOptions}
            aria-label={
              chrome.i18n.getMessage("openSettings") || "Open settings"
            }
            className="p-2 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Settings className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Main navigation"
        className="flex px-4 pt-2 w-full border-b border-gray-100 dark:border-gray-800 shrink-0"
      >
        <button
          role="tab"
          aria-selected={activeTab === "write"}
          onClick={() => setActiveTab("write")}
          className={clsx(
            "flex-1 pb-2 text-sm font-medium transition-colors border-b-2",
            activeTab === "write"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
          )}
        >
          {chrome.i18n.getMessage("write") || "Write"}
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "history"}
          onClick={() => setActiveTab("history")}
          className={clsx(
            "flex-1 pb-2 text-sm font-medium transition-colors border-b-2 flex items-center justify-center gap-2",
            activeTab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
          )}
        >
          <Clock className="w-4 h-4" aria-hidden="true" />
          {chrome.i18n.getMessage("history") || "History"}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="overflow-y-auto flex-1 p-4 space-y-4">
        {activeTab === "write" ? (
          <>
            {/* Input Form - Hide when output is displayed */}
            {!output && (
              <>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    chrome.i18n.getMessage("enterText") ||
                    "Enter text to enhance... or select text on a webpage."
                  }
                  className="p-3 w-full text-sm bg-gray-50 rounded-lg border border-gray-200 transition-shadow resize-none dark:border-gray-700 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={4}
                />

                <div className="flex gap-2">
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm bg-gray-50 rounded-lg border border-gray-200 transition-colors cursor-pointer dark:border-gray-700 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary hover:bg-gray-100 dark:hover:bg-gray-700/50"
                  >
                    {MODES.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-1 min-w-0">
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2 text-sm bg-gray-50 rounded-lg border border-gray-200 transition-colors cursor-pointer dark:border-gray-700 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary hover:bg-gray-100 dark:hover:bg-gray-700/50"
                      disabled={modelsLoading}
                    >
                      {modelsLoading ? (
                        <option>
                          {chrome.i18n.getMessage("loadingModels") ||
                            "Loading models..."}
                        </option>
                      ) : displayModels.length === 0 ? (
                        <option>
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
                      className="px-2 py-2 bg-gray-50 rounded-lg border border-gray-200 transition-colors cursor-pointer dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                </div>
                {modelsError && (
                  <div className="text-xs text-red-600 dark:text-red-400">
                    {modelsError}
                  </div>
                )}

                <button
                  onClick={handleEnhance}
                  disabled={loading || !input.trim()}
                  className={clsx(
                    "w-full py-2.5 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200",
                    "bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-sm hover:shadow",
                  )}
                >
                  {loading ? (
                    <>
                      <Loader2
                        className="w-4 h-4 animate-spin"
                        aria-hidden="true"
                      />
                      {chrome.i18n.getMessage("enhancing") || "Enhancing..."}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" aria-hidden="true" />
                      {chrome.i18n.getMessage("enhanceSelectedText") ||
                        "Enhance Selected Text"}
                    </>
                  )}
                </button>
              </>
            )}

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100 dark:bg-red-900/20 dark:border-red-900/30">
                {error}
              </div>
            )}

            {output && (
              <div className="space-y-2">
                <p className="text-sm leading-relaxed text-gray-900 whitespace-pre-wrap dark:text-gray-100">
                  {output}
                </p>
                {tokenUsage && (
                  <p className="text-xs text-gray-400">
                    {tokenUsage.toLocaleString()}{" "}
                    {chrome.i18n.getMessage("tokensUsed") || "tokens used"}
                  </p>
                )}
                <button
                  onClick={() => handleCopy(output)}
                  className={clsx(
                    "flex gap-2 justify-center items-center px-4 py-2 w-full text-sm font-medium rounded-lg transition-colors",
                    copied
                      ? "text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-300"
                      : "text-white bg-primary hover:bg-primary-hover",
                  )}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" aria-hidden="true" />
                      {chrome.i18n.getMessage("copied") || "Copied!"}
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" aria-hidden="true" />
                      {chrome.i18n.getMessage("copyToClipboard") || "Copy"}
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setOutput("");
                    setCopied(false);
                    setTokenUsage(null);
                  }}
                  className="px-4 py-2 w-full text-sm font-medium text-gray-700 rounded-lg transition-colors dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {chrome.i18n.getMessage("new") || "← New"}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium tracking-wider text-gray-500 uppercase">
                {chrome.i18n.getMessage("recentItems") || "Recent Items"}
              </span>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  aria-label={
                    chrome.i18n.getMessage("clearAllHistory") ||
                    "Clear all history"
                  }
                  className="flex gap-1 items-center text-xs font-medium text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-3 h-3" aria-hidden="true" />
                  {chrome.i18n.getMessage("clear") || "Clear"}
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="flex flex-col gap-3 justify-center items-center py-12 text-gray-400">
                <div className="p-4 bg-gray-50 rounded-full dark:bg-gray-800">
                  <Clock className="w-8 h-8" aria-hidden="true" />
                </div>
                <p className="text-sm">
                  {chrome.i18n.getMessage("noHistoryYet") || "No history yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="relative p-3 bg-gray-50 rounded-lg border border-gray-100 dark:bg-gray-800/50 dark:border-gray-800 group"
                  >
                    <button
                      onClick={() => removeItem(item.id)}
                      aria-label={
                        chrome.i18n.getMessage("removeFromHistory") ||
                        "Remove from history"
                      }
                      className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <div className="flex gap-2 items-center mb-2">
                      <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {item.mode}
                      </span>
                      <span
                        className="text-xs text-gray-500"
                        title={new Date(item.timestamp).toLocaleString()}
                      >
                        {formatRelativeTime(item.timestamp)}
                      </span>
                    </div>
                    <p className="mb-2 text-sm text-gray-900 line-clamp-2 dark:text-gray-100">
                      {item.enhancedText}
                    </p>
                    <button
                      onClick={() => handleCopy(item.enhancedText, item.id)}
                      className="text-xs font-medium flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
                    >
                      {copiedHistoryId === item.id ? (
                        <>
                          <Check
                            className="w-3.5 h-3.5 text-green-500"
                            aria-hidden="true"
                          />{" "}
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" aria-hidden="true" />{" "}
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
