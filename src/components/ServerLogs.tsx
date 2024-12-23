import React, { useState, ChangeEvent, useEffect } from "react";
import {
  Search,
  Settings,
  RefreshCw,
  Download,
  ChevronRight,
  Server,
  Info,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  X,
  File,
} from "lucide-react";

declare module "react" {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    directory?: string;
    webkitdirectory?: string;
  }
}

interface LogEntry {
  type: "INFO" | "ERROR" | "WARNING" | "DEBUG" | "FILE";
  timestamp: string;
  message: string;
}

interface ServerType {
  name: string;
  id: string;
  path: string;
}

export default function ServerLogs() {
  const [servers, setServers] = useState<ServerType[]>([]);
  const [openServerModel, setOpenServerModel] = useState<boolean>(false);
  const [newServerName, setNewServerName] = useState<string>("");
  const [newServerPath, setNewServerPath] = useState<string>("");
  const [selectedServer, setSelectedServer] = useState<ServerType | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const handleOpenAddServerModel = () => {
    setOpenServerModel(!openServerModel);
  };

  const handleAddServer = () => {
    if (newServerName && newServerPath) {
      const newServer = {
        name: newServerName,
        id: Date.now().toString(),
        path: newServerPath,
      };
      setServers([...servers, newServer]);
      setNewServerName("");
      setNewServerPath("");
      setOpenServerModel(false);
      setSelectedServer(newServer);
    }
  };

  const handleSelectServer = (server: ServerType) => {
    setSelectedServer(server);
  };

  useEffect(() => {
    if (selectedServer) {
      // In a real Electron app, you would use the fs module to read the directory
      // For this example, we'll simulate reading files
      const simulateReadDir = () => {
        const files = [
          "config.json",
          "app.log",
          "data.db",
          "index.html",
          "styles.css",
          "script.js",
        ];
        const newLogs: LogEntry[] = files.map((file) => ({
          type: "FILE",
          timestamp: new Date().toISOString(),
          message: `File: ${file}`,
        }));
        setLogs(newLogs);
      };

      simulateReadDir();
    }
  }, [selectedServer]);

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      <div className="container mx-auto min-w-[100vw] px-4 flex flex-col h-full">
        <div className="border-b py-3 text-center">
          <h1 className="text-2xl font-semibold">Server Log Viewer</h1>
        </div>

        {/* Search Bar */}
        <div className="flex items-center justify-center gap-2 border-b py-4">
          <div className="flex flex-1 items-center gap-2 rounded-md border bg-background px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search logs..."
              className="flex-1 bg-transparent outline-none"
            />
          </div>
          <button className="rounded-md p-2 hover:bg-accent">
            <RefreshCw className="h-5 w-5" />
          </button>
          <button className="rounded-md p-2 hover:bg-accent">
            <Settings className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">SERVERS</h2>
              <button
                className="bg-blue-600 text-white px-2 py-1 rounded-md text-sm hover:bg-blue-700"
                onClick={handleOpenAddServerModel}
              >
                + Add Server
              </button>
            </div>
            <div className="space-y-1">
              {servers.map((server) => (
                <button
                  key={server.id}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent ${
                    selectedServer?.id === server.id ? "bg-accent" : ""
                  }`}
                  onClick={() => handleSelectServer(server)}
                >
                  <ChevronRight className="h-4 w-4" />
                  <Server className="h-4 w-4" />
                  <span className="text-sm">{server.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b p-4 gap-4">
              <div className="flex gap-2">
                <select className="rounded-md border bg-background px-3 py-1 text-sm">
                  <option>Last 15 minutes</option>
                  <option>Last hour</option>
                  <option>Last 24 hours</option>
                </select>
                <select className="rounded-md border bg-background px-3 py-1 text-sm">
                  <option>All levels</option>
                  <option>Info</option>
                  <option>Warning</option>
                  <option>Error</option>
                  <option>Debug</option>
                </select>
              </div>
              <button className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700">
                <Download className="h-4 w-4" />
                Download Logs
              </button>
            </div>

            {/* Logs */}
            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-2">
                {logs.map((log, index) => {
                  const getIcon = () => {
                    switch (log.type) {
                      case "INFO":
                        return <Info className="h-4 w-4 text-blue-500" />;
                      case "ERROR":
                        return <AlertCircle className="h-4 w-4 text-red-500" />;
                      case "WARNING":
                        return (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        );
                      case "DEBUG":
                        return <Sparkles className="h-4 w-4 text-purple-500" />;
                      case "FILE":
                        return <File className="h-4 w-4 text-gray-500" />;
                    }
                  };

                  const getBackground = () => {
                    switch (log.type) {
                      case "INFO":
                        return "bg-blue-50";
                      case "ERROR":
                        return "bg-red-50";
                      case "WARNING":
                        return "bg-yellow-50";
                      case "DEBUG":
                        return "bg-purple-50";
                      case "FILE":
                        return "bg-gray-50";
                    }
                  };

                  const getTextColor = () => {
                    switch (log.type) {
                      case "INFO":
                        return "text-blue-600";
                      case "ERROR":
                        return "text-red-600";
                      case "WARNING":
                        return "text-yellow-600";
                      case "DEBUG":
                        return "text-purple-600";
                      case "FILE":
                        return "text-gray-600";
                    }
                  };

                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-3 rounded-md p-3 ${getBackground()}`}
                    >
                      {getIcon()}
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-sm ${getTextColor()}`}>
                          [{log.type}] {log.timestamp} -
                        </span>
                        <span className="text-sm">{log.message}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Add Server Modal */}
          {openServerModel && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Add New Server</h3>
                  <button
                    onClick={() => setOpenServerModel(false)}
                    className="bg-red-500 hover:text-gray-700 rounded-3xl"
                  >
                    <X className="text-white  h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="server-name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Server Name:
                    </label>
                    <input
                      type="text"
                      id="server-name"
                      value={newServerName}
                      onChange={(e) => setNewServerName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="add-server"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Server Directory:
                    </label>
                    <div className="flex items-center">
                      <input
                        type="file"
                        id="add-server"
                        webkitdirectory=""
                        directory=""
                        multiple
                        className="hidden"
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          const files = e.target.files;
                          if (files && files.length > 0) {
                            setNewServerPath(
                              files[0].webkitRelativePath.split("/")[0]
                            );
                          }
                        }}
                      />
                      <input
                        type="text"
                        value={newServerPath}
                        readOnly
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="No directory selected"
                      />
                      <label
                        htmlFor="add-server"
                        className="bg-blue-600 text-white px-3 py-2 rounded-r-md hover:bg-blue-700 cursor-pointer"
                      >
                        Browse
                      </label>
                    </div>
                  </div>
                  <button
                    onClick={handleAddServer}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Add Server
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="border-t px-4 py-2 text-center">
          <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground sm:flex-row sm:justify-between">
            <span>Last updated: {new Date().toLocaleString()}</span>
            <div className="flex items-center gap-4">
              <span>Connected to {servers.length} servers</span>
              <span>•</span>
              <span>Showing {logs.length} log entries</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
