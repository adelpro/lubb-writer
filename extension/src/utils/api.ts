// API client for Lubb Writer

export interface Settings {
  apiUrl: string;
  apiToken: string;
  defaultMode: string;
  defaultModel: string;
  showInlineIcon: boolean;
  theme: 'light' | 'dark' | 'system';
  historyEnabled: boolean;
}

export interface EnhanceResponse {
  result: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const DEFAULT_SETTINGS: Settings = {
  apiUrl: 'https://lubb-writer-api.adelpro.us.kg',
  apiToken: '',
  defaultMode: 'humanize',
  defaultModel: 'MiniMax-M2.1',
  showInlineIcon: true,
  theme: 'system',
  historyEnabled: true,
};

export async function getSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (result) => {
      resolve(result as Settings);
    });
  });
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set(settings, () => {
      resolve();
    });
  });
}

export async function enhanceText(
  text: string,
  mode: string,
  model?: string
): Promise<EnhanceResponse> {
  const settings = await getSettings();
  
  if (!settings.apiUrl) {
    throw new Error('API URL not configured. Please set it in settings.');
  }

  const url = `${settings.apiUrl}/enhance`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (settings.apiToken) {
    headers['Authorization'] = `Bearer ${settings.apiToken}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      text,
      mode,
      model: model || settings.defaultModel,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function getModels(): Promise<string[]> {
  const settings = await getSettings();
  
  if (!settings.apiUrl) {
    return [];
  }

  try {
    const url = `${settings.apiUrl}/models`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    return data.models?.map((m: { name: string }) => m.name) || [];
  } catch {
    return [];
  }
}
