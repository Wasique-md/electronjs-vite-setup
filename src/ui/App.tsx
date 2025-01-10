import React from "react";
import ServerLogs from "../components/ServerLogs";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <div>
      <ServerLogs />
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;
