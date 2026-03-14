import "../styles.css";
import iconUrl from "data-base64:../../assets/icon.png";
import { useState } from "react";
import { useSettingsStore } from "../stores/settings";
import { useHistoryStore } from "../stores/history";
import { enhanceText } from "../lib/api";
import { MODES, MODELS } from "../constants";
import { Sparkles, Copy, Check, Settings, Loader2, Clock, Trash2 } from "lucide-react";
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
          model: model || settings.defaultModel
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

  const handleSaveToken = async () => {
    const cleanToken = tempToken.trim();
    if (!cleanToken) return;
    setLoading(true);
    await settings.setSettings({ apiToken: cleanToken });
    setLoading(false);
  };

  if (!settings.apiToken) {
    return (
      <div className="w-[400px] h-[500px] flex flex-col bg-background dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 p-6 justify-center items-center text-center">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md bg-gray-100 flex items-center justify-center p-2">
              <img src={iconUrl} alt="Lubb Writer" className="w-full h-full object-contain" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold">Welcome</h1>
              <p className="text-sm text-gray-500 px-4">Enter your API token to unlock Lubb Writer.</p>
            </div>
          </div>
          
          <div className="space-y-4 text-left bg-gray-50 dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">API Token</label>
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
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {loading ? "Saving..." : "Save Token & Continue"}
            </button>
            <div className="pt-2 text-center">
              <button 
                onClick={openOptions} 
                className="text-xs text-gray-500 hover:text-primary transition-colors hover:underline"
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
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-1.5 rounded-lg">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <span className="font-semibold text-lg">Lubb Writer</span>
        </div>
        <button
          onClick={openOptions}
          title="Settings"
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Settings className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex w-full px-4 pt-2 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <button
          onClick={() => setActiveTab("write")}
          className={clsx(
            "flex-1 pb-2 text-sm font-medium transition-colors border-b-2",
            activeTab === "write" 
              ? "border-primary text-primary" 
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
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
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          <Clock className="w-4 h-4" />
          History
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === "write" ? (
          <>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter text to enhance... or select text on a webpage."
              className="w-full p-3 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-shadow"
              rows={4}
            />

            <div className="flex gap-2">
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
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
                className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
              >
                {MODELS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleEnhance}
              disabled={loading || !input.trim()}
              className={clsx(
                "w-full py-2.5 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200",
                "bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-sm hover:shadow"
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

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30">
                {error}
              </div>
            )}

            {output && (
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <textarea
                  value={output}
                  readOnly
                  className="w-full p-3 text-sm border border-primary/20 rounded-lg bg-primary/5 dark:bg-primary/10 resize-none font-medium"
                  rows={4}
                />
                <button
                  onClick={() => handleCopy(output)}
                  className="w-full py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Result
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Recent Items</span>
              {history.length > 0 && (
                <button 
                  onClick={clearHistory}
                  className="text-xs flex items-center gap-1 text-red-500 hover:text-red-600 font-medium"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-full">
                  <Clock className="w-8 h-8" />
                </div>
                <p className="text-sm">No history yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div key={item.id} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800 group relative">
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
                    <p className="text-sm line-clamp-2 mb-2 text-gray-900 dark:text-gray-100">
                      {item.enhancedText}
                    </p>
                    <button
                      onClick={() => handleCopy(item.enhancedText, item.id)}
                      className="text-xs font-medium flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
                    >
                      {copiedHistoryId === item.id ? (
                        <><Check className="w-3.5 h-3.5 text-green-500" /> Copied</>
                      ) : (
                        <><Copy className="w-3.5 h-3.5" /> Copy</>
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
