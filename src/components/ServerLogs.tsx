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
} from "lucide-react";
import React, { useState } from "react";

interface LogEntry {
  type: "INFO" | "ERROR" | "WARNING" | "DEBUG";
  timestamp: string;
  message: string;
}

interface ServerType {
  name: string;
  id: string;
}

export default function ServerLogs() {
  const [servers] = useState<ServerType[]>([
    { name: "Production Server", id: "prod" },
    { name: "Development Server", id: "dev" },
    { name: "Testing Server", id: "test" },
  ]);

  const [logs] = useState<LogEntry[]>([
    {
      type: "INFO",
      timestamp: "2024-11-13 10:15:23",
      message: "Application started successfully",
    },
    {
      type: "ERROR",
      timestamp: "2024-11-13 10:15:25",
      message: "Failed to connect to database",
    },
    {
      type: "WARNING",
      timestamp: "2024-11-13 10:15:30",
      message: "High memory usage detected",
    },
    {
      type: "INFO",
      timestamp: "2024-11-13 10:15:35",
      message: "Database connection restored",
    },
    {
      type: "ERROR",
      timestamp: "2024-11-13 10:15:25",
      message: "Failed to connect to database",
    },
    {
      type: "DEBUG",
      timestamp: "2024-11-13 10:15:40",
      message: "Processing user request #12345",
    },
    {
      type: "WARNING",
      timestamp: "2024-11-13 10:15:30",
      message: "High memory usage detected",
    },
    {
      type: "INFO",
      timestamp: "2024-11-13 10:15:35",
      message: "Database connection restored",
    },
  ]);

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
            <h2 className="mb-4 font-semibold">SERVERS</h2>
            <div className="space-y-1">
              {servers.map((server) => (
                <button
                  key={server.id}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
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
        </div>

        {/* Status Bar */}
        <div className="border-t px-4 py-2 text-center">
          <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground sm:flex-row sm:justify-between">
            <span>Last updated: 2024-11-13 10:15:40</span>
            <div className="flex items-center gap-4">
              <span>Connected to 3 servers</span>
              <span>•</span>
              <span>Showing 8 log entries</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
