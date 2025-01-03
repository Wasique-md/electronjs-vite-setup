import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  store: {
    get: (key: string) => ipcRenderer.invoke("electron-store-get", key),
    set: (key: string, value: any) =>
      ipcRenderer.invoke("electron-store-set", key, value),
  },
});
