import { useState, useRef, useCallback, useEffect } from "react";
import SignIn from "./components/SignIn";
import Dashboard from "./components/Dashboard";
import TopBar from "./components/TopBar";
import FileExplorer from "./components/FileExplorer";
import PreviewFrame from "./components/PreviewFrame";
import FileViewer from "./components/FileViewer";
import Terminal from "./components/Terminal";
import AiChat from "./components/AIChat";

type TabId = "preview" | "files";
type Status = "ready" | "loading" | "error";

interface SandboxState {
  sandboxId: string;
  previewUrl: string;
  agentBase: string;
}

interface SandboxCreatedData {
  sandboxId: string;
  previewUrl: string;
}

interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sandbox, setSandbox] = useState<SandboxState | null>(null);
  const [status, setStatus] = useState<Status>("ready");
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data) setUser(data);
      })
      .catch(() => {
        // Not logged in — SignIn screen handles this.
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setUser(null);
      setSandbox(null);
    }
  }, []);

  const [activeTab, setActiveTab] = useState<TabId>("preview");
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [fileRefreshKey, setFileRefreshKey] = useState(0);

  const [terminalHeight, setTerminalHeight] = useState(220);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartH = useRef(0);

  const handleSandboxCreated = useCallback(
    (data: SandboxCreatedData, prompt?: string) => {
      const agentBase = `http://${data.sandboxId}.agent.localhost`;
      setSandbox({
        sandboxId: data.sandboxId,
        previewUrl: data.previewUrl,
        agentBase,
      });
      setInitialPrompt(prompt || null);
      setStatus("ready");
    },
    [],
  );

  const handleFilesChanged = useCallback(() => {
    setFileRefreshKey((k) => k + 1);
  }, []);

  const handleBackToProjects = useCallback(() => {
    setSandbox(null);
    setInitialPrompt(null);
    setActiveFile(null);
    setActiveTab("preview");
  }, []);

  const handleFileSelect = useCallback((path: string) => {
    setActiveFile(path);
    setActiveTab("files");
  }, []);

  const handleDragStart = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStartY.current = e.clientY;
    dragStartH.current = terminalHeight;

    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = dragStartY.current - ev.clientY;
      const newH = Math.min(Math.max(dragStartH.current + delta, 80), 500);
      setTerminalHeight(newH);
    };
    const onUp = () => {
      isDragging.current = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  if (checkingSession) {
    return (
      <div
        className="flex items-center justify-center h-full w-full"
        style={{ background: "#151317" }}
      >
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "#d7baff", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (!user) {
    return <SignIn onAuthenticated={(u) => setUser(u)} />;
  }

  if (!sandbox) {
    return (
      <Dashboard
        user={user}
        onSandboxCreated={handleSandboxCreated}
        onLogout={handleLogout}
      />
    );
  }

  const { sandboxId, previewUrl, agentBase } = sandbox;

  return (
    <div
      className="flex flex-col h-full w-full overflow-hidden"
      style={{ background: "#151317" }}
    >
      {/* Top bar */}
      <TopBar
        sandboxId={sandboxId}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        status={status}
        onBack={handleBackToProjects}
      />

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* File Explorer sidebar */}
        <FileExplorer
          agentBase={agentBase}
          activeFile={activeFile}
          onFileSelect={handleFileSelect}
          refreshKey={fileRefreshKey}
        />

        {/* Center — main content + terminal */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Main content area */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "preview" ? (
              <PreviewFrame previewUrl={previewUrl} />
            ) : (
              <FileViewer agentBase={agentBase} filePath={activeFile} />
            )}
          </div>

          {/* Drag handle */}
          <div
            className="shrink-0 flex items-center justify-center cursor-row-resize select-none"
            style={{
              height: "6px",
              background: "#1d1b1f",
              borderTop: "1px solid #30363d",
              borderBottom: "1px solid #30363d",
              zIndex: 10,
            }}
            onMouseDown={handleDragStart}
            title="Drag to resize terminal"
          >
            <div
              className="w-12 h-0.5 rounded-full"
              style={{ background: "#373438" }}
            />
          </div>

          {/* Terminal */}
          <div
            className="shrink-0 overflow-hidden"
            style={{ height: `${terminalHeight}px` }}
          >
            <Terminal sandboxId={sandboxId} />
          </div>
        </div>

        {/* Right — AI Chat */}
        <div className="shrink-0 overflow-hidden" style={{ width: "340px" }}>
          <AiChat
            sandboxId={sandboxId}
            onFilesChanged={handleFilesChanged}
            initialPrompt={initialPrompt}
          />
        </div>
      </div>
    </div>
  );
}