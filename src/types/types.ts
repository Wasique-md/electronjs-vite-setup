export interface ServerType {
  name: string;
  id: string;
  path: string;
}

export interface FileEntry {
  name: string;
  path: string;
  actualPath: string;
  timestamp: string;
  content: string | ArrayBuffer | null;
  type: string;
  analysisLink?: string;
  solutionLink?: string;
}
