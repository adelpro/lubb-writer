export const VERSION = "1.0.0";

export const MODES = [
  { value: "humanize", label: "Humanize" },
  { value: "rewrite", label: "Rewrite" },
  { value: "summarize", label: "Summarize" },
  { value: "grammar", label: "Grammar" },
  { value: "formal", label: "Formal" },
  { value: "casual", label: "Casual" },
  { value: "academic", label: "Academic" },
  { value: "seo", label: "SEO" },
  { value: "persuasive", label: "Persuasive" },
  { value: "creative", label: "Creative" },
  { value: "twitter", label: "Twitter" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "story", label: "Story" },
] as const;

export const MODELS = [
  { value: "MiniMax-M2.1", label: "MiniMax M2.1" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet" },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
] as const;
