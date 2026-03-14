import cssText from "data-text:../styles.css"
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import { useEffect, useState } from "react"
import { Sparkles, X, Loader2, Check } from "lucide-react"
import { useSettingsStore } from "../stores/settings"
import { useHistoryStore } from "../stores/history"
import { enhanceText } from "../lib/api"
import { MODES } from "../constants"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

export const getStyle: PlasmoGetStyle = () => {
  const element = document.createElement("style")
  element.textContent = cssText
  return element
}

interface Position {
  x: number
  y: number
}

// Helper to determine if an element is an editable input/textarea or contenteditable
const isEditableElement = (el: Element | null): boolean => {
  if (!el) return false;
  if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
    const inputType = (el as HTMLInputElement).type;
    return !['button', 'checkbox', 'hidden', 'radio', 'submit'].includes(inputType);
  }
  if (el.getAttribute('contenteditable') === 'true' || el.hasAttribute('data-lexical-editor')) return true;
  return false;
}

export default function InlineToolbar() {
  const settings = useSettingsStore()
  const { addItem } = useHistoryStore()
  
  const [selection, setSelection] = useState("")
  const [position, setPosition] = useState<Position | null>(null)
  const [activeElement, setActiveElement] = useState<HTMLElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      // Don't close if clicking within our own toolbar
      if ((e.target as HTMLElement).closest('#lubb-writer-toolbar')) return;

      setTimeout(() => {
        const windowSelection = window.getSelection()
        const text = windowSelection?.toString().trim()
        const active = document.activeElement as HTMLElement

        // Ensure we are selecting within an editable field AND that inline is enabled
        if (text && isEditableElement(active) && settings.showInlineIcon) {
          const range = windowSelection?.getRangeAt(0)
          const rect = range?.getBoundingClientRect()
          
          if (rect) {
            setSelection(text)
            setActiveElement(active)
            // Position slightly above the selection
            setPosition({
              x: e.clientX,
              y: rect.top - 40
            })
          }
        } else {
          // If they click away, hide the toolbar
          if (!isOpen) {
            setPosition(null)
            setSelection("")
            setActiveElement(null)
            setIsOpen(false)
          }
        }
      }, 10)
    }

    document.addEventListener("mouseup", handleMouseUp)
    return () => document.removeEventListener("mouseup", handleMouseUp)
  }, [isOpen, settings.showInlineIcon])

  const handleEnhance = async (modeValue: string) => {
    if (!selection || !activeElement) return

    setLoading(true)
    try {
      const response = await enhanceText(selection, modeValue, settings.defaultModel)
      const newText = response.result
      
      // Attempt to replace the text in-place
      replaceTextInElement(activeElement, newText)
      
      if (settings.historyEnabled) {
        await addItem({
          originalText: selection,
          enhancedText: newText,
          mode: modeValue,
          model: settings.defaultModel
        })
      }

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        handleClose()
      }, 2000)

    } catch (error) {
      console.error("Lubb Writer: Failed to enhance text inline", error)
      alert("Lubb Writer Failed: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  const replaceTextInElement = (element: HTMLElement, newText: string) => {
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      const el = element as HTMLInputElement | HTMLTextAreaElement
      const start = el.selectionStart || 0
      const end = el.selectionEnd || 0
      
      el.value = el.value.substring(0, start) + newText + el.value.substring(end)
      // Trigger a React/native change event so the underlying site realizes it changed
      el.dispatchEvent(new Event('input', { bubbles: true }))
    } else if (element.isContentEditable) {
      document.execCommand('insertText', false, newText)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setPosition(null)
    setSelection("")
    setActiveElement(null)
  }

  // If floating is completely disabled or we have no position, render nothing
  if (!settings.showInlineIcon || !position) return null

  // The small simple bubble that appears first
  if (!isOpen && !loading && !success) {
    return (
      <div
        id="lubb-writer-toolbar"
        style={{
          position: "fixed",
          left: position.x + "px",
          top: position.y + "px",
          transform: "translate(-50%, -100%)",
          zIndex: 2147483647 // Max z-index to stay above everything
        }}
        className="animate-in zoom-in duration-200"
      >
        <button
          onClick={() => setIsOpen(true)}
          className="bg-background dark:bg-gray-800 text-primary shadow-lg border border-gray-200 dark:border-gray-700 p-2 rounded-full hover:scale-105 hover:shadow-xl transition-all"
          title="Enhance with Lubb Writer"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      </div>
    )
  }

  // The expanded toolbar with Quick Actions
  return (
    <div
        id="lubb-writer-toolbar"
        style={{
          position: "fixed",
          left: position.x + "px",
          top: position.y + "px",
          transform: "translate(-50%, -100%)",
          zIndex: 2147483647
        }}
        className="bg-background dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 rounded-xl p-2 flex items-center gap-1.5 animate-in slide-in-from-bottom-2 duration-200"
      >
        {success ? (
          <div className="px-4 flex items-center gap-2 text-green-500 font-medium py-1">
            <Check className="w-4 h-4" />
            Replaced text!
          </div>
        ) : loading ? (
          <div className="px-4 flex items-center gap-2 text-primary font-medium py-1">
            <Loader2 className="w-4 h-4 animate-spin" />
            Enhancing...
          </div>
        ) : (
          <>
            {/* Quick Actions */}
            {MODES.slice(0, 4).map((m) => (
              <button
                key={m.value}
                onClick={() => handleEnhance(m.value)}
                className="px-3 py-1.5 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg whitespace-nowrap transition-colors flex items-center text-gray-700 dark:text-gray-200"
                title={m.label}
              >
                {m.label.split(' ')[0]} {/* Shorten label for toolbar */}
              </button>
            ))}
            
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
            
            <button
              onClick={handleClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
  )
}
