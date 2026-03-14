import { useState } from "react";
import { useSettingsStore } from "../stores/settings";
import { enhanceText } from "../lib/api";
import { MODES, MODELS } from "../constants";
import { Sparkles, Copy, Check, Settings, Loader2 } from "lucide-react";
import clsx from "clsx";

export default function Popup() {
  const settings = useSettingsStore();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState(settings.defaultMode);
  const [model, setModel] = useState(settings.defaultModel);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
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
      const result = await enhanceText(input, mode, model);
      setOutput(result.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enhance text");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openOptions = () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    }
  };

  return (
    <div className="w-[360px] p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="font-semibold">Lubb Writer</span>
        </div>
        <button
          onClick={openOptions}
          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Settings className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Input */}
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter text to enhance..."
        className="w-full p-3 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        rows={4}
      />

      {/* Options */}
      <div className="flex gap-2">
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
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
          className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {MODELS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* Enhance Button */}
      <button
        onClick={handleEnhance}
        disabled={loading || !input.trim()}
        className={clsx(
          "w-full py-2.5 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors",
          "bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white"
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
            Enhance
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg">
          {error}
        </div>
      )}

      {/* Output */}
      {output && (
        <div className="space-y-2">
          <textarea
            value={output}
            readOnly
            className="w-full p-3 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 resize-none"
            rows={4}
          />
          <button
            onClick={handleCopy}
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
    </div>
  );
}
