import cssText from "data-text:../styles.css";
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo";
import iconUrl from "data-base64:../../assets/icon.png";
import { useEffect, useState, useCallback } from "react";
import {
  X,
  Loader2,
  Check,
  Copy,
  RefreshCw,
  AlignLeft,
  FileText,
  Scale,
  MessageSquare,
  GraduationCap,
  Search,
  Megaphone,
  Sparkles,
  Send,
  MessageCircle,
  Heart,
} from "lucide-react";
import { useSettingsStore } from "../stores/settings";
import { enhanceText } from "../lib/api";
import { MODES } from "../constants";
import clsx from "clsx";

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
};

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style");
  style.textContent = cssText;
  return style;
};

interface EnhanceModalProps {
  originalText: string;
  onClose: () => void;
}

function EnhanceModal({ originalText, onClose }: EnhanceModalProps) {
  const settings = useSettingsStore();
  const [selectedMode, setSelectedMode] = useState<string>(MODES[0].value);
  const [customPrompt, setCustomPrompt] = useState("");
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  const [enhancedText, setEnhancedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [textareaFocused, setTextareaFocused] = useState(false);

  const isRTL = chrome.i18n.getUILanguage().startsWith("ar");

  const modeIcons: Record<string, React.ReactNode> = {
    grammar: <AlignLeft className="w-4 h-4" />,
    rewrite: <RefreshCw className="w-4 h-4" />,
    humanize: <Heart className="w-4 h-4" />,
    summarize: <FileText className="w-4 h-4" />,
    formal: <Scale className="w-4 h-4" />,
    casual: <MessageSquare className="w-4 h-4" />,
    academic: <GraduationCap className="w-4 h-4" />,
    seo: <Search className="w-4 h-4" />,
    persuasive: <Megaphone className="w-4 h-4" />,
    creative: <Sparkles className="w-4 h-4" />,
  };

  const handleEnhance = async () => {
    if (!settings.apiToken) {
      setError(
        "API token not configured. Please add your API token in extension settings.",
      );
      return;
    }

    if (!settings.apiUrl) {
      setError(
        "API URL not configured. Please add your API URL in extension settings.",
      );
      return;
    }

    setLoading(true);
    setError("");
    setEnhancedText("");
    try {
      const response = await enhanceText(
        originalText,
        selectedMode,
        settings,
        settings.defaultModel,
        useCustomPrompt ? customPrompt : undefined,
      );
      setEnhancedText(response.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enhance text");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (enhancedText) {
      await navigator.clipboard.writeText(enhancedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleInsert = () => {
    if (!enhancedText) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setError("No text selected to replace");
      return;
    }

    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(enhancedText));
    range.collapse(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/50 backdrop-blur-sm font-sans"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="bg-white dark:bg-gray-800 rounded-xl w-[90%] max-w-[560px] max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="flex justify-between items-center px-5 py-4 text-white border-b border-gray-200 dark:border-gray-700 bg-primary">
          <div className="flex gap-2 items-center">
            <div className="p-1 rounded-lg bg-white/20">
              <img src={iconUrl} alt="Lubb Writer" className="w-4 h-4" />
            </div>
            <span className="text-base font-semibold">
              {chrome.i18n.getMessage("largestWriter") || "Lubb Writer"}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label={chrome.i18n.getMessage("closeButton") || "Close modal"}
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors opacity-80 hover:opacity-100"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
              {chrome.i18n.getMessage("originalText") || "Original Text"}
            </label>
            <div className="overflow-y-auto p-3 max-h-20 text-sm text-gray-700 bg-gray-100 rounded-lg dark:text-gray-300 dark:bg-gray-700">
              {originalText}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              {chrome.i18n.getMessage("enhancementMode") || "Enhancement Mode"}
            </label>
            <div
              role="group"
              aria-label="Select enhancement mode"
              className="grid grid-cols-3 gap-2"
            >
              {MODES.slice(0, 6).map((mode) => {
                const isSelected = selectedMode === mode.value;
                return (
                  <button
                    key={mode.value}
                    onClick={() => setSelectedMode(mode.value)}
                    aria-pressed={isSelected}
                    className={clsx(
                      "px-2 py-2.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5",
                      isSelected
                        ? "bg-primary text-white border-2 border-primary"
                        : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-2 border-gray-200 dark:border-gray-600 hover:border-primary/50",
                    )}
                  >
                    <span aria-hidden="true">{modeIcons[mode.value]}</span>
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="flex gap-2 items-center mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useCustomPrompt}
                onChange={(e) => setUseCustomPrompt(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <span className="flex gap-1 items-center text-xs font-medium text-gray-500">
                <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                {chrome.i18n.getMessage("useCustomPromptCheckbox") ||
                  "Use Custom Prompt"}
              </span>
            </label>
            {useCustomPrompt && (
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder={
                  chrome.i18n.getMessage("customPromptPlaceholder") ||
                  "e.g., Make it sound more professional..."
                }
                className={clsx(
                  "p-3 w-full font-sans text-sm text-gray-900 bg-white rounded-lg border transition-colors outline-none resize-y min-h-[60px] dark:bg-gray-700 dark:text-gray-100",
                  textareaFocused
                    ? "border-primary"
                    : "border-gray-200 dark:border-gray-600",
                )}
                onFocus={() => setTextareaFocused(true)}
                onBlur={() => setTextareaFocused(false)}
              />
            )}
          </div>

          {!enhancedText && !error && (
            <button
              onClick={handleEnhance}
              disabled={loading}
              className={clsx(
                "flex gap-2 justify-center items-center py-3 w-full text-sm font-semibold rounded-xl transition-colors",
                loading
                  ? "cursor-not-allowed bg-primary/70"
                  : "text-white bg-primary hover:bg-primary-hover",
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
                  {chrome.i18n.getMessage("enhanceText") || "Enhance Text"}
                </>
              )}
            </button>
          )}

          {error && (
            <div className="p-3 text-sm bg-red-50 rounded-lg border border-red-200 dark:bg-red-900/30 dark:border-red-800">
              <p className="mb-2 text-red-600 dark:text-red-400">{error}</p>
              {error.includes("API token") && (
                <button
                  onClick={() => chrome.runtime.openOptionsPage?.()}
                  className="px-3 py-1.5 bg-primary text-white rounded-md text-xs font-medium hover:bg-primary-hover transition-colors"
                >
                  {chrome.i18n.getMessage("settings") ||
                    "Open Extension Settings"}
                </button>
              )}
            </div>
          )}

          {enhancedText && (
            <>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                  {chrome.i18n.getMessage("enhancedText") || "Enhanced Text"}
                </label>
                <div className="overflow-y-auto p-3 max-h-40 text-sm text-green-700 whitespace-pre-wrap bg-green-50 rounded-lg border border-green-200 dark:text-green-400 dark:bg-green-900/30 dark:border-green-800">
                  {enhancedText}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className={clsx(
                    "flex-1 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-1.5 transition-all",
                    copied
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600",
                  )}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      {chrome.i18n.getMessage("copied") || "Copied!"}
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      {chrome.i18n.getMessage("copy") || "Copy"}
                    </>
                  )}
                </button>
                <button
                  onClick={handleInsert}
                  className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium text-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  {chrome.i18n.getMessage("insertEnhancedText") || "Insert"}
                </button>
              </div>

              <button
                onClick={() => {
                  setEnhancedText("");
                  setError("");
                }}
                className="w-full py-2 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                {chrome.i18n.getMessage("tryDifferentMode") ||
                  "Try different mode"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InlineSelectionIcon({
  onClick,
  position,
}: {
  onClick: () => void;
  position: { x: number; y: number } | null;
}) {
  const settings = useSettingsStore();

  if (!settings.showInlineIcon || !position) return null;

  return (
    <button
      onClick={onClick}
      className="flex fixed justify-center items-center w-9 h-9 bg-white rounded-full border-2 shadow-lg transition-all pointer-events-auto dark:bg-gray-800 border-primary hover:border-primary-hover hover:scale-110 active:scale-95"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -100%)",
        zIndex: 2147483646,
      }}
      aria-label="Enhance text with Lubb Writer"
    >
      <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
    </button>
  );
}

export default function InlineEnhanceHandler() {
  const settings = useSettingsStore();
  const [modalData, setModalData] = useState<{ text: string } | null>(null);
  const [iconPosition, setIconPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const handleMessage = (message: { type: string; text?: string }) => {
      if (message.type === "SHOW_ENHANCE_MODAL" && message.text) {
        setModalData({ text: message.text });
      } else if (message.type === "GET_SELECTION_AND_SHOW_MODAL") {
        const selectedText = window.getSelection()?.toString().trim();
        if (selectedText) {
          setModalData({ text: selectedText });
        }
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  useEffect(() => {
    if (!settings.showInlineIcon) {
      setIconPosition(null);
      return;
    }

    let hideTimeout: ReturnType<typeof setTimeout>;

    const updateIconPosition = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.rangeCount) {
        setIconPosition(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect.width === 0 || rect.height === 0) {
        setIconPosition(null);
        return;
      }

      const x = rect.left + rect.width / 2;
      const y = rect.top - 12;

      setIconPosition({ x, y });
    };

    const handleMouseUp = () => {
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(updateIconPosition, 50);
    };

    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setIconPosition(null);
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      clearTimeout(hideTimeout);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [settings.showInlineIcon]);

  const handleIconClick = () => {
    const selectedText = window.getSelection()?.toString().trim();
    if (selectedText) {
      setModalData({ text: selectedText });
    }
    setIconPosition(null);
  };

  const handleClose = useCallback(() => {
    setModalData(null);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalData) {
        handleClose();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [modalData, handleClose]);

  return (
    <>
      <InlineSelectionIcon onClick={handleIconClick} position={iconPosition} />
      {modalData && (
        <EnhanceModal originalText={modalData.text} onClose={handleClose} />
      )}
    </>
  );
}
