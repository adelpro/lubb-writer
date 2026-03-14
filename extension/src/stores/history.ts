import { Storage } from "@plasmohq/storage";
import { useStorage } from "@plasmohq/storage/hook";

export interface HistoryItem {
  id: string;
  originalText: string;
  enhancedText: string;
  mode: string;
  model: string;
  timestamp: number;
}

const defaultHistory: HistoryItem[] = [];

export const historyStorage = new Storage({
  area: "local",
});

export const useHistoryStore = () => {
  const [history, setHistoryData] = useStorage<HistoryItem[]>(
    {
      key: "lubb-writer-history",
      instance: historyStorage,
    },
    defaultHistory
  );

  const addItem = async (item: Omit<HistoryItem, "id" | "timestamp">) => {
    const newItem: HistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    
    // Keep only the last 50 items to prevent storage bloat
    const nextHistory = [newItem, ...(history || [])].slice(0, 50);
    await setHistoryData(nextHistory);
  };

  const clearHistory = async () => {
    await setHistoryData([]);
  };
  
  const removeItem = async (id: string) => {
    if (!history) return;
    const nextHistory = history.filter(item => item.id !== id);
    await setHistoryData(nextHistory);
  };

  return {
    history: history || [],
    addItem,
    clearHistory,
    removeItem
  };
};
