import type { Settings } from "../stores/settings";

export interface EnhanceResponse {
  result: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function enhanceText(
  text: string,
  mode: string,
  settings: Settings,
  model?: string
): Promise<EnhanceResponse> {
  if (!settings.apiUrl) {
    throw new Error("API URL not configured. Please set it in settings.");
  }

  const url = `${settings.apiUrl.replace(/\/+$/, '')}/enhance`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (settings.apiToken) {
    headers["Authorization"] = `Bearer ${settings.apiToken.trim()}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      text,
      mode,
      model: model || settings.defaultModel,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}
