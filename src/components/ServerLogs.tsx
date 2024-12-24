"use client";
import React, { useState, ChangeEvent } from "react";
import {
  ChevronRight,
  Server,
  File,
  X,
  Search,
  Settings,
  RotateCcw,
  Download,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface ServerType {
  name: string;
  id: string;
  path: string;
}

interface FileEntry {
  name: string;
  path: string;
  timestamp: string;
}

export default function ServerLogsViewer() {
  const [servers, setServers] = useState<ServerType[]>([]);
  const [openServerModal, setOpenServerModal] = useState<boolean>(false);
  const [newServerName, setNewServerName] = useState<string>("");
  const [newServerPath, setNewServerPath] = useState<string>("");
  const [selectedServer, setSelectedServer] = useState<ServerType | null>(null);
  const [files, setFiles] = useState<Record<string, FileEntry[]>>({});
  const [searchQuery, setSearchQuery] = useState<string>("");

  const handleOpenAddServerModal = () => {
    setOpenServerModal(!openServerModal);
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
      setOpenServerModal(false);
      setSelectedServer(newServer);
    }
  };

  const handleSelectServer = (server: ServerType) => {
    setSelectedServer(server);
  };

  const handleDirectorySelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      const fileList: FileEntry[] = Array.from(selectedFiles).map((file) => ({
        name: file.name,
        path: file.webkitRelativePath,
        timestamp: new Date().toISOString(),
      }));
      if (selectedFiles.length > 0) {
        const serverPath = selectedFiles[0].webkitRelativePath.split("/")[0];
        setNewServerPath(serverPath);
        setFiles((prevFiles) => ({
          ...prevFiles,
          [serverPath]: fileList,
        }));
      }
    }
  };

  const filteredFiles = selectedServer
    ? (files[selectedServer.path] || []).filter((file) =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      <div className="border-b py-3 px-4">
        <h1 className="text-2xl font-semibold text-center">
          Server Log Viewer
        </h1>
      </div>

      <div className="flex-1 flex">
        <div className="w-64 border-r flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">SERVERS</h2>
              <Button
                variant="default"
                size="sm"
                onClick={handleOpenAddServerModal}
                className="h-8 bg-blue-600 hover:bg-blue-700"
              >
                + Add Server
              </Button>
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
        </div>

        <div className="flex-1 flex flex-col">
          <div className="border-b p-4 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search logs..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select defaultValue="last-24-hours">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-24-hours">Last 24 hours</SelectItem>
                <SelectItem value="last-7-days">Last 7 days</SelectItem>
                <SelectItem value="last-30-days">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="info">
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="default"
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              Download Logs
            </Button>
            <Button variant="ghost" size="icon">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 p-4 overflow-auto">
            {selectedServer ? (
              filteredFiles.length > 0 ? (
                <div className="space-y-2">
                  {filteredFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-3 hover:bg-accent rounded-lg"
                    >
                      <File className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 font-mono text-sm">
                        [LOG] {file.timestamp} - log: {file.name}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No files found for this server.
                </p>
              )
            ) : (
              <p className="text-muted-foreground">
                Select a server to view files
              </p>
            )}
          </div>

          <div className="border-t p-2 text-sm text-muted-foreground flex items-center justify-between">
            <div>Last updated: {new Date().toLocaleString()}</div>
            <div className="flex items-center gap-4">
              <span>Connected to {servers.length} servers</span>
              <span>•</span>
              <span>Showing {filteredFiles.length} log entries</span>
            </div>
          </div>
        </div>
      </div>

      {openServerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-background p-6 rounded-lg shadow-lg w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New Server</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpenServerModal(false)}
                className="bg-red-500"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="server-name"
                  className="block text-sm font-medium mb-1"
                >
                  Server Name:
                </label>
                <Input
                  type="text"
                  id="server-name"
                  placeholder="Enter Server Name"
                  value={newServerName}
                  onChange={(e) => setNewServerName(e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor="add-server"
                  className="block text-sm font-medium mb-1"
                >
                  Server Path:
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={newServerPath}
                    readOnly
                    placeholder="No directory selected"
                  />
                  <input
                    type="file"
                    id="add-server"
                    webkitdirectory=""
                    directory=""
                    multiple
                    className="hidden"
                    onChange={handleDirectorySelect}
                  />
                  <Button
                    variant="secondary"
                    onClick={() =>
                      document.getElementById("add-server")?.click()
                    }
                  >
                    Browse
                  </Button>
                </div>
              </div>
              <Button
                onClick={handleAddServer}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={!newServerName || !newServerPath}
              >
                Add Server
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
