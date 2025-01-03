interface ServerType {
  name: string;
  id: string;
  path: string;
}

interface FileEntry {
  name: string;
  path: string;
  timestamp: string;
  content: string | ArrayBuffer | null;
  type: string;
}

interface StoreSchema {
  servers: ServerType[];
  files: Record<string, FileEntry[]>;
  selectedServerId: string | null;
}

declare global {
  interface Window {
    electronAPI: {
      store: {
        get: (key: string) => Promise<any>;
        set: (key: string, value: any) => Promise<void>;
      };
    };
  }
}

const store = {
  get: async <K extends keyof StoreSchema>(key: K): Promise<StoreSchema[K]> => {
    return window.electronAPI.store.get(key);
  },
  set: async <K extends keyof StoreSchema>(
    key: K,
    value: StoreSchema[K]
  ): Promise<void> => {
    return window.electronAPI.store.set(key, value);
  },
};

export default store;
