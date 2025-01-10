import { FileEntry, ServerType } from "../types/types";

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
