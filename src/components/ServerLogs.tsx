"use client";

import React, { useState, ChangeEvent, useEffect } from "react";
import { format } from "date-fns";
import {
  ChevronRight,
  Server,
  File,
  X,
  Search,
  Settings,
  RotateCcw,
  Download,
  CalendarIcon,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Calendar } from "./ui/calendar";
import { Label } from "./ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "../lib/utils";
import axios from "axios";
import toast from "react-hot-toast";
import { FileEntry, ServerType } from "../types/types";
import store from "../features/store";

type DirectoryInputProps = React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
> & {
  webkitdirectory?: string;
  directory?: string;
};

export default function ServerLogsViewer() {
  const [servers, setServers] = useState<ServerType[]>([]);
  const [openServerModal, setOpenServerModal] = useState<boolean>(false);
  const [newServerName, setNewServerName] = useState<string>("");
  const [newServerPath, setNewServerPath] = useState<string>("");
  const [selectedServer, setSelectedServer] = useState<ServerType | null>(null);
  const [files, setFiles] = useState<Record<string, FileEntry[]>>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);
  const [checkedFiles, setCheckedFiles] = useState<Set<string>>(new Set());
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();
  const [isDateFiltered, setIsDateFiltered] = useState(false);
  const [allChecked, setAllChecked] = useState(false);
  const [analysisInProgress, setAnalysisInProgress] = useState<
    Record<string, boolean>
  >({});
  const [solutionInProgress, setSolutionInProgress] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    const loadData = () => {
      const storedServers = store.get("servers") || [];
      const storedFiles = store.get("files") || {};
      const storedSelectedServerId = store.get("selectedServerId");
      setServers(storedServers);
      setFiles(storedFiles);
      if (storedSelectedServerId) {
        const selectedServer = storedServers.find(
          (server: ServerType) => server.id === storedSelectedServerId
        );
        setSelectedServer(selectedServer || null);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    setFromDate(undefined);
    setToDate(undefined);
    setIsDateFiltered(false);
    setAllChecked(false);
    setCheckedFiles(new Set());
  }, [selectedServer]);

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
      const updatedServers = [...servers, newServer];
      setServers(updatedServers);
      store.set("servers", updatedServers);
      store.set("selectedServerId", newServer.id);
      store.set("files", files);
      setNewServerName("");
      setNewServerPath("");
      setOpenServerModal(false);
      setSelectedServer(newServer);
    }
  };

  const handleSelectServer = (server: ServerType) => {
    setSelectedServer(server);
    store.set("selectedServerId", server.id);
  };

  const handleDirectorySelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      const fileList: FileEntry[] = await Promise.all(
        Array.from(selectedFiles).map(async (file) => {
          const content = await readFileContent(file);
          return {
            name: file.name,
            path: file.webkitRelativePath,
            actualPath: file.path,
            timestamp: new Date().toISOString(),
            content: content,
            type: file.type || getFileTypeFromName(file.name),
          };
        })
      );
      if (selectedFiles.length > 0) {
        const serverPath = selectedFiles[0].webkitRelativePath.split("/")[0];
        setNewServerPath(serverPath);
        const updatedFiles = {
          ...files,
          [serverPath]: fileList,
        };
        setFiles(updatedFiles);
        store.set("files", updatedFiles);
      }
    }
  };

  const readFileContent = (
    file: File
  ): Promise<string | ArrayBuffer | null> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target) {
          resolve(event.target.result);
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = (error) => reject(error);

      if (file.type.startsWith("image/")) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const getFileTypeFromName = (fileName: string): string => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "js":
        return "application/javascript";
      case "py":
        return "text/x-python";
      case "html":
        return "text/html";
      case "css":
        return "text/css";
      default:
        return "text/plain";
    }
  };

  const filteredFiles = selectedServer
    ? (files[selectedServer.path] || []).filter((file) => {
        const fileDate = new Date(file.timestamp);
        const matchesSearch = file.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const matchesDateRange =
          !isDateFiltered ||
          ((!fromDate || fileDate >= fromDate) &&
            (!toDate || fileDate <= toDate));

        const isExactMatch =
          !fromDate ||
          fileDate.toDateString() === fromDate.toDateString() ||
          !toDate ||
          fileDate.toDateString() === toDate.toDateString();

        return matchesSearch && (matchesDateRange || isExactMatch);
      })
    : [];

  const handleFileClick = (file: FileEntry) => {
    setSelectedFile(file);
  };

  const handleFilterDate = () => {
    if (fromDate || toDate) {
      setIsDateFiltered(true);
    } else {
      setIsDateFiltered(false);
    }
  };

  const handlePostFile = async (file: FileEntry) => {
    const formData = new FormData();
    if (file.content) {
      const blob = new Blob([file.content], { type: file.type });
      formData.append("file", blob, file.name);
    }
    const toastId = toast.loading(`Evaluating ${file.name}...`);

    try {
      const res = await axios.post(
        "https://ufbdku1y3j.execute-api.ap-south-1.amazonaws.com/dev/analyze-logs",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      console.log(res);

      if (res.data && res.data.analysis_s3_link && res.data.solution_s3_link) {
        // Update the file object with the new links
        const updatedFiles = { ...files };
        const fileIndex = updatedFiles[selectedServer!.path].findIndex(
          (f) => f.path === file.path
        );
        if (fileIndex !== -1) {
          updatedFiles[selectedServer!.path][fileIndex] = {
            ...file,
            analysisLink: res.data.analysis_s3_link,
            solutionLink: res.data.solution_s3_link,
          };
          setFiles(updatedFiles);
          store.set("files", updatedFiles);
          toast.success(`${file.name} evaluated successfully`, { id: toastId });

          // Start checking the status of analysis and solution
          checkStatus(
            file.path,
            res.data.analysis_s3_link,
            res.data.solution_s3_link
          );
        }
      }
    } catch (error) {
      toast.error("Failed to evaluate file");
      toast.error(`Error evaluating ${file.name}`, { id: toastId });
      console.error(error);
    }
  };

  const handlePostFiles = async () => {
    const formData = new FormData();

    filteredFiles.forEach((file) => {
      if (checkedFiles.has(file.path) && file.content) {
        const blob = new Blob([file.content], { type: file.type });
        formData.append("files", blob, file.actualPath);
      }
    });
    console.log(formData);
    try {
      const res = await axios.post(
        "https://ufbdku1y3j.execute-api.ap-south-1.amazonaws.com/devs",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      console.log(res);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCheckAll = () => {
    setAllChecked(!allChecked);
    if (!allChecked) {
      const allFilePaths = filteredFiles.map((file) => file.path);
      setCheckedFiles(new Set(allFilePaths));
    } else {
      setCheckedFiles(new Set());
    }
  };

  const checkStatus = async (
    filePath: string,
    analysisLink: string,
    solutionLink: string
  ) => {
    setAnalysisInProgress((prev) => ({ ...prev, [filePath]: true }));
    setSolutionInProgress((prev) => ({ ...prev, [filePath]: true }));

    const checkAnalysis = async () => {
      try {
        const res = await axios.get(analysisLink);
        if (res.data.status !== "In Progress") {
          setAnalysisInProgress((prev) => ({ ...prev, [filePath]: false }));
        } else {
          setTimeout(checkAnalysis, 5000); // Check again after 5 seconds
        }
      } catch (error) {
        console.error("Error checking analysis status:", error);
        setAnalysisInProgress((prev) => ({ ...prev, [filePath]: false }));
      }
    };

    const checkSolution = async () => {
      try {
        const res = await axios.get(solutionLink);
        if (res.data.status !== "In Progress") {
          setSolutionInProgress((prev) => ({ ...prev, [filePath]: false }));
        } else {
          setTimeout(checkSolution, 5000); // Check again after 5 seconds
        }
      } catch (error) {
        console.error("Error checking solution status:", error);
        setSolutionInProgress((prev) => ({ ...prev, [filePath]: false }));
      }
    };

    checkAnalysis();
    checkSolution();
  };

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      <div className="border-b py-3 px-4">
        <h1 className="text-3xl font-bold text-center text-blue-500">
          RCA-Tool
        </h1>
      </div>
      <br />
      <h2 className="text-2xl font-bold text-center text-blue-400">
        Server Log Viewer
      </h2>

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
          <div className="border-b p-4 flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search logs..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label>From:</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[200px] justify-start text-left font-normal",
                      !fromDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fromDate ? (
                      format(fromDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={fromDate}
                    onSelect={(date) => {
                      setFromDate(date);
                      setIsDateFiltered(false);
                      if (toDate && date && date > toDate) {
                        setToDate(date);
                      }
                    }}
                    disabled={(date) =>
                      date > new Date() || (toDate ? date > toDate : false)
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-2">
              <Label>To:</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[200px] justify-start text-left font-normal",
                      !toDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {toDate ? format(toDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={toDate}
                    onSelect={(date) => {
                      setToDate(date);
                      setIsDateFiltered(false);
                      if (fromDate && date && date < fromDate) {
                        setFromDate(date);
                      }
                    }}
                    disabled={(date) =>
                      date > new Date() || (fromDate ? date < fromDate : false)
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button
              onClick={handleFilterDate}
              variant="default"
              size="sm"
              className="h-9 bg-green-600 hover:bg-green-700"
              disabled={!fromDate && !toDate}
            >
              Filter Date
            </Button>
            <Button
              onClick={() => {
                setFromDate(undefined);
                setToDate(undefined);
                setIsDateFiltered(false);
              }}
              variant="outline"
              size="sm"
              className="h-9"
            >
              Clear Filter
            </Button>
            <Button
              onClick={handlePostFiles}
              variant="default"
              size="sm"
              className="h-9 bg-blue-600 hover:bg-blue-700"
            >
              Mass Evaluate
            </Button>
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
            <div className="flex justify-between items-center mb-4">
              <Button
                onClick={handleCheckAll}
                variant="outline"
                size="sm"
                className="h-9 bg-blue-600 text-white hover:bg-blue-700 hover:text-white rounded-xl"
              >
                {allChecked ? "Unselect All" : "Select All"}
              </Button>
              <span>{checkedFiles.size} file(s) selected</span>
            </div>
            {selectedServer ? (
              filteredFiles.length > 0 ? (
                <div className="space-y-2">
                  {filteredFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-3 hover:bg-accent rounded-lg cursor-pointer"
                    >
                      <div
                        className="flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          id={`file-${index}`}
                          checked={checkedFiles.has(file.path)}
                          onCheckedChange={(checked) => {
                            setCheckedFiles((prev) => {
                              const newChecked = new Set(prev);
                              if (checked) {
                                newChecked.add(file.path);
                              } else {
                                newChecked.delete(file.path);
                              }
                              setAllChecked(
                                newChecked.size === filteredFiles.length
                              );
                              return newChecked;
                            });
                          }}
                          className="border-blue-600 "
                        />
                      </div>
                      <div
                        onClick={() => handleFileClick(file)}
                        className="flex items-center gap-4 flex-1"
                      >
                        <File className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 font-mono text-sm">
                          [LOG] {file.timestamp} - {file.type}: {file.name}
                        </div>
                      </div>

                      <Button
                        onClick={() => handlePostFile(file)}
                        variant="default"
                        size="sm"
                        className="h-8  bg-blue-500 hover:bg-blue-700"
                      >
                        Evaluate
                      </Button>
                      <div className="flex items-center gap-2">
                        {file.analysisLink && (
                          <Button
                            variant="default"
                            size="sm"
                            className="h-8 bg-purple-500 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() =>
                              window.open(file.analysisLink, "_blank")
                            }
                            disabled={analysisInProgress[file.path]}
                          >
                            {analysisInProgress[file.path] ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Analyzing
                              </>
                            ) : (
                              "Analysis"
                            )}
                          </Button>
                        )}
                        {file.solutionLink && (
                          <Button
                            variant="default"
                            size="sm"
                            className="h-8 bg-green-500 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() =>
                              window.open(file.solutionLink, "_blank")
                            }
                            disabled={solutionInProgress[file.path]}
                          >
                            {solutionInProgress[file.path] ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Solving
                              </>
                            ) : (
                              "Solution"
                            )}
                          </Button>
                        )}
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
                className="bg-red-500 hover:bg-red-700 hover:border-red-700 text-white hover:text-white"
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
                    {...({} as DirectoryInputProps)}
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

      <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedFile?.name}</DialogTitle>
            <DialogDescription>
              Path: {selectedFile?.path} | Type: {selectedFile?.type} |
              Timestamp: {selectedFile?.timestamp}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto mt-4">
            {selectedFile && renderFileContent(selectedFile)}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const renderFileContent = (file: FileEntry) => {
  if (typeof file.content === "string") {
    return <pre>{file.content}</pre>;
  } else if (file.content instanceof ArrayBuffer) {
    const blob = new Blob([file.content], { type: file.type });
    const url = URL.createObjectURL(blob);
    return <img src={url} alt={file.name} />;
  } else {
    return <p>No content to display</p>;
  }
};
