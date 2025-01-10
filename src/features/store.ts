export interface ServerType {
  name: string;
  id: string;
  path: string;
}

export interface FileEntry {
  name: string;
  path: string;
  actualPath: string; // Add this line
  timestamp: string;
  content: string | ArrayBuffer | null;
  type: string;
}

export interface StoreSchema {
  servers: ServerType[];
  files: Record<string, FileEntry[]>;
  selectedServerId: string | null;
}
const store = {
  get: <K extends keyof StoreSchema>(key: K): StoreSchema[K] => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },
  set: <K extends keyof StoreSchema>(key: K, value: StoreSchema[K]): void => {
    localStorage.setItem(key, JSON.stringify(value));
  },
};

export default store;
