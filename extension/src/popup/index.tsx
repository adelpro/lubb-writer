import "../styles.css";
import iconUrl from "data-base64:../../assets/icon.png";
import { useState, useEffect } from "react";
import { useSettingsStore } from "../stores/settings";
import { useHistoryStore } from "../stores/history";
import { enhanceText, fetchAvailableModels } from "../lib/api";
import { MODES, MODELS } from "../constants";
import {
  Sparkles,
  Copy,
  Check,
  Settings,
  Loader2,
  Clock,
  Trash2,
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

  useEffect(() => {
    const loadModels = async () => {
      if (!settings.apiToken || !settings.apiUrl) return;

      setModelsLoading(true);
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
      } finally {
        setModelsLoading(false);
      }
    };

    loadModels();
  }, [settings.apiToken, settings.apiUrl]);

  const formatModelLabel = (name: string): string => {
    return name
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const displayModels =
    settings.availableModels.length > 0 ? settings.availableModels : MODELS;

  const handleEnhance = async () => {
    if (!input.trim()) {
      setError("Please enter some text");
      return;
    }

    setLoading(true);
    setError("");
    setOutput("");

    try {
      const result = await enhanceText(input, mode, settings, model);
      setOutput(result.result);

      if (settings.historyEnabled) {
        await addItem({
          originalText: input,
          enhancedText: result.result,
          mode,
          model: model || settings.defaultModel,
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
  };

  if (!settings.apiToken) {
    return (
      <div className="w-[400px] h-[500px] flex flex-col bg-background dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 p-6 justify-center items-center text-center">
        <div className="space-y-8 w-full max-w-sm">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex overflow-hidden justify-center items-center p-2 w-16 h-16 bg-gray-100 rounded-2xl shadow-md">
              <img
                src={iconUrl}
                alt="Lubb Writer"
                className="object-contain w-full h-full"
              />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold">Welcome</h1>
              <p className="px-4 text-sm text-gray-500">
                Configure your API URL and token to unlock Lubb Writer.
              </p>
            </div>
          </div>

          <div className="p-5 space-y-4 text-left bg-gray-50 rounded-xl border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                API URL
              </label>
              <input
                type="url"
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                placeholder="https://lubb-writer-api.adelpro.us.kg"
                className="w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                API Token
              </label>
              <input
                type="password"
                value={tempToken}
                onChange={(e) => setTempToken(e.target.value)}
                placeholder="Paste your token here"
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
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {loading ? "Saving..." : "Save & Continue"}
            </button>
            <div className="pt-2 text-center">
              <button
                onClick={openOptions}
                className="text-xs text-gray-500 transition-colors hover:text-primary hover:underline"
              >
                Advanced configuration...
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[400px] h-[500px] flex flex-col bg-background dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="flex gap-2 items-center">
          <img src={iconUrl} alt="Lubb Writer" className="w-8 h-8" />
          <span className="text-lg font-semibold">Lubb Writer</span>
        </div>
        <button
          onClick={openOptions}
          title="Settings"
          className="p-2 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Settings className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex px-4 pt-2 w-full border-b border-gray-100 dark:border-gray-800 shrink-0">
        <button
          onClick={() => setActiveTab("write")}
          className={clsx(
            "flex-1 pb-2 text-sm font-medium transition-colors border-b-2",
            activeTab === "write"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
          )}
        >
          Write
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={clsx(
            "flex-1 pb-2 text-sm font-medium transition-colors border-b-2 flex items-center justify-center gap-2",
            activeTab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
          )}
        >
          <Clock className="w-4 h-4" />
          History
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
                  placeholder="Enter text to enhance... or select text on a webpage."
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
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm bg-gray-50 rounded-lg border border-gray-200 transition-colors cursor-pointer dark:border-gray-700 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary hover:bg-gray-100 dark:hover:bg-gray-700/50"
                    disabled={modelsLoading}
                  >
                    {modelsLoading ? (
                      <option>Loading models...</option>
                    ) : (
                      displayModels.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))
                    )}
                  </select>
                </div>

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
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enhancing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Enhance Selected Text
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
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setOutput("");
                    setCopied(false);
                  }}
                  className="px-4 py-2 w-full text-sm font-medium text-gray-700 rounded-lg transition-colors dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  ← New
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium tracking-wider text-gray-500 uppercase">
                Recent Items
              </span>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="flex gap-1 items-center text-xs font-medium text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="flex flex-col gap-3 justify-center items-center py-12 text-gray-400">
                <div className="p-4 bg-gray-50 rounded-full dark:bg-gray-800">
                  <Clock className="w-8 h-8" />
                </div>
                <p className="text-sm">No history yet.</p>
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
                      className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                      title="Remove from history"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex gap-2 items-center mb-2">
                      <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {item.mode}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(item.timestamp).toLocaleDateString()}
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
                          <Check className="w-3.5 h-3.5 text-green-500" />{" "}
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy
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
