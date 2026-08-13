type Status = "ready" | "loading" | "error";

interface StatusConfig {
  color: string;
  label: string;
  dot: boolean;
}

const statusConfig: Record<Status, StatusConfig> = {
  ready: { color: "#10b981", label: "Ready", dot: true },
  loading: { color: "#f59e0b", label: "Working…", dot: false },
  error: { color: "#ef4444", label: "Error", dot: true },
};

type TabId = "preview" | "files";

interface Tab {
  id: TabId;
  icon: string;
  label: string;
}

const TABS: Tab[] = [
  { id: "preview", icon: "⬛", label: "Preview" },
  { id: "files", icon: "📄", label: "Files" },
];

interface TopBarProps {
  sandboxId?: string | null;
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
  status?: Status;
  onBack?: () => void;
}

export default function TopBar({
  sandboxId,
  activeTab,
  onTabChange,
  status,
  onBack,
}: TopBarProps) {
  const shortId = sandboxId ? sandboxId.slice(0, 8) + "…" : "";

  const s = (status && statusConfig[status]) || statusConfig.ready;

  return (
    <header
      className="flex items-center justify-between px-4 shrink-0"
      style={{
        height: "48px",
        background: "rgba(29,27,31,0.95)",
        borderBottom: "1px solid #30363d",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Left — Back + Logo + sandbox ID */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            title="Back to projects"
            className="flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-colors"
            style={{ color: "#958e9a" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#e7e1e7")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#958e9a")}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </button>
        )}
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(215,186,255,0.2), rgba(73,49,108,0.1))",
              border: "1px solid rgba(215,186,255,0.3)",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="#d7baff">
              <rect x="1" y="1" width="6" height="6" rx="1" />
              <rect x="9" y="1" width="6" height="6" rx="1" opacity="0.5" />
              <rect x="1" y="9" width="6" height="6" rx="1" opacity="0.5" />
              <rect x="9" y="9" width="6" height="6" rx="1" />
            </svg>
          </div>
          <span className="text-sm font-semibold" style={{ color: "#e7e1e7" }}>
            Sandbox IDE
          </span>
        </div>

        {sandboxId && (
          <div
            className="flex items-center gap-2 px-2 py-0.5 rounded"
            style={{
              background: "rgba(215,186,255,0.06)",
              border: "1px solid rgba(215,186,255,0.15)",
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }}
            />
            <span className="text-xs font-mono" style={{ color: "#958e9a" }}>
              {shortId}
            </span>
          </div>
        )}
      </div>

      {/* Center — Tab switcher */}
      <div
        className="flex items-center gap-1 p-1 rounded-lg"
        style={{ background: "#1d1b1f", border: "1px solid #30363d" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="px-4 py-1 text-xs font-medium rounded-md transition-all duration-200 cursor-pointer"
            style={
              activeTab === tab.id
                ? {
                    background:
                      "linear-gradient(135deg, rgba(215,186,255,0.15), rgba(73,49,108,0.08))",
                    color: "#d7baff",
                    border: "1px solid rgba(215,186,255,0.3)",
                  }
                : {
                    color: "#958e9a",
                    border: "1px solid transparent",
                  }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Right — status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          {s.dot ? (
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: s.color, boxShadow: `0 0 8px ${s.color}` }}
            />
          ) : (
            <div
              className="w-4 h-4 rounded-full border-2 border-t-transparent"
              style={{
                borderColor: s.color,
                borderTopColor: "transparent",
                animation: "spin 0.8s linear infinite",
              }}
            />
          )}
          <span className="text-xs" style={{ color: s.color }}>
            {s.label}
          </span>
        </div>
      </div>
    </header>
  );
}