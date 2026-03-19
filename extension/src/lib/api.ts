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

export interface ModelInfo {
  name: string;
  provider: string;
  providerName: string;
  baseURL: string;
}

export interface ModelsResponse {
  models: ModelInfo[];
}

export async function fetchAvailableModels(
  settings: Settings
): Promise<ModelInfo[]> {
  if (!settings.apiUrl) {
    throw new Error("API URL not configured. Please set it in settings.");
  }

  const url = `${settings.apiUrl.replace(/\/+$/, "")}/models`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (settings.apiToken) {
    headers["Authorization"] = `Bearer ${settings.apiToken.trim()}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch models: HTTP ${response.status}`);
  }

  const data: ModelsResponse = await response.json();
  return data.models;
}

export async function enhanceText(
  text: string,
  mode: string,
  settings: Settings,
  model?: string,
  customPrompt?: string
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

  const requestBody: Record<string, unknown> = {
    text,
    mode,
    model: model || settings.defaultModel,
  };

  if (customPrompt) {
    requestBody.customPrompt = customPrompt;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}
