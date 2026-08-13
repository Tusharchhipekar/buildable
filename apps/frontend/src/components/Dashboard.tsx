import { useState, useEffect } from "react";
import NewProjectPrompt from "./NewProjectPrompt";

interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

interface Project {
  _id: string;
  title: string;
  createdAt?: string;
  [key: string]: unknown;
}

interface SandboxData {
  sandboxId: string;
  previewUrl: string;
}

interface DashboardProps {
  user: User | null;
  onSandboxCreated: (sandboxData: SandboxData, initialPrompt?: string) => void;
  onLogout: () => void;
}

function timeAgo(iso?: string): string | null {
  if (!iso) return null;
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "Created just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Created ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Created ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Created ${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Created ${months}mo ago`;
  return `Created ${Math.floor(months / 12)}y ago`;
}

function titleFromPrompt(message: string): string {
  const oneLine = message.replace(/\s+/g, " ").trim();
  return oneLine.length > 60 ? oneLine.slice(0, 57) + "…" : oneLine;
}

export default function Dashboard({
  user,
  onSandboxCreated,
  onLogout,
}: DashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [openingProjectId, setOpeningProjectId] = useState<string | null>(
    null,
  );

  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/sandbox/project", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { projects: [] }))
      .then((data) => setProjects(data.projects || []))
      .catch(() => {})
      .finally(() => setProjectsLoading(false));
  }, []);

  const isAnyBusy = openingProjectId !== null || submitting;

  const handleDeleteProject = async (
    e: React.MouseEvent,
    projectId: string,
  ) => {
    e.stopPropagation();
    if (!window.confirm("Delete this project? This can't be undone.")) return;

    setDeletingId(projectId);
    setError(null);
    try {
      const res = await fetch(`/api/sandbox/project/${projectId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Failed to delete project (${res.status})`);
      setProjects((prev) => prev.filter((p) => p._id !== projectId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete project",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenProject = async (projectId: string) => {
    setOpeningProjectId(projectId);
    setError(null);
    try {
      const res = await fetch("/api/sandbox/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok) throw new Error(`Failed to start sandbox (${res.status})`);
      onSandboxCreated(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start sandbox");
      setOpeningProjectId(null);
    }
  };

  const handleCreateFromPrompt = async (message: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const projectRes = await fetch("/api/sandbox/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: titleFromPrompt(message) }),
      });
      if (!projectRes.ok)
        throw new Error(`Failed to create project (${projectRes.status})`);
      const projectData = await projectRes.json();
      const projectId: string = projectData.project._id;

      const sandboxRes = await fetch("/api/sandbox/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ projectId }),
      });
      if (!sandboxRes.ok)
        throw new Error(`Failed to start sandbox (${sandboxRes.status})`);
      onSandboxCreated(await sandboxRes.json(), message);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create project",
      );
      setSubmitting(false);
    }
  };

  if (creating) {
    return (
      <NewProjectPrompt
        userName={user?.name}
        submitting={submitting}
        error={error}
        onCreate={handleCreateFromPrompt}
        onCancel={() => {
          setCreating(false);
          setError(null);
        }}
      />
    );
  }

  const avatarInitial = (user?.name || user?.email || "?")
    .charAt(0)
    .toUpperCase();

  return (
    <div
      className="h-full w-full overflow-y-auto"
      style={{ background: "#151317", fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-8 py-5"
        style={{ borderBottom: "1px solid #30363d" }}
      >
        <span
          className="text-xl font-bold"
          style={{ color: "#d7baff" }}
        >
          Buildable
        </span>
        <nav className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => {
              setCreating(true);
              setError(null);
            }}
            className="flex items-center gap-1.5 text-sm font-medium cursor-pointer"
            style={{ color: "#e7e1e7" }}
          >
            <span style={{ color: "#d7baff" }}>+</span> New Project
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="text-sm font-medium cursor-pointer"
            style={{ color: "#e7e1e7" }}
          >
            Logout
          </button>
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name || user.email}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
              style={{ background: "#49316c", color: "#e7e1e7" }}
            >
              {avatarInitial}
            </div>
          )}
        </nav>
      </header>

      {/* Main */}
      <main className="px-8 py-10 max-w-6xl mx-auto">
        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: "#e7e1e7" }}
        >
          Active Projects
        </h1>
        <p className="text-sm mb-8" style={{ color: "#ccc4d0" }}>
          Manage your ongoing creative endeavors.
        </p>

        {error && (
          <div
            className="px-4 py-3 rounded-lg text-sm mb-6"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#fca5a5",
            }}
          >
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Start new project card */}
          <button
            type="button"
            onClick={() => {
              setCreating(true);
              setError(null);
            }}
            className="rounded-2xl p-6 flex flex-col items-center justify-center text-center min-h-[180px] cursor-pointer transition-colors"
            style={{
              border: "1px dashed #373438",
              background: "transparent",
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl mb-3"
              style={{ border: "1px solid #373438", color: "#d7baff" }}
            >
              +
            </div>
            <p className="text-sm font-semibold" style={{ color: "#d7baff" }}>
              Start New Project
            </p>
            <p className="text-xs mt-1" style={{ color: "#958e9a" }}>
              Spin up a new sandbox instantly.
            </p>
          </button>

          {!projectsLoading &&
            projects.map((project) => {
              const opening = openingProjectId === project._id;
              const deleting = deletingId === project._id;
              return (
                <div
                  key={project._id}
                  role="button"
                  tabIndex={0}
                  aria-disabled={isAnyBusy || deleting}
                  onClick={() =>
                    !isAnyBusy && !deleting && handleOpenProject(project._id)
                  }
                  onKeyDown={(e) => {
                    if (
                      (e.key === "Enter" || e.key === " ") &&
                      !isAnyBusy &&
                      !deleting
                    ) {
                      e.preventDefault();
                      handleOpenProject(project._id);
                    }
                  }}
                  className="relative rounded-2xl p-6 flex flex-col text-left min-h-[180px] cursor-pointer transition-colors"
                  style={{
                    background: "#211f23",
                    border: "1px solid #30363d",
                    opacity: deleting ? 0.5 : 1,
                    pointerEvents: isAnyBusy || deleting ? "none" : "auto",
                  }}
                >
                  <button
                    type="button"
                    title="Delete project"
                    onClick={(e) => handleDeleteProject(e, project._id)}
                    className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                    style={{ color: "#958e9a", pointerEvents: "auto" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                      e.currentTarget.style.color = "#fca5a5";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#958e9a";
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>

                  <h3
                    className="text-lg font-semibold mb-2 pr-8 line-clamp-2"
                    style={{ color: "#e7e1e7" }}
                  >
                    {project.title}
                  </h3>
                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <span className="text-xs" style={{ color: "#958e9a" }}>
                      {timeAgo(project.createdAt) || ""}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isAnyBusy && !deleting)
                          handleOpenProject(project._id);
                      }}
                      className="flex items-center gap-1 text-xs font-semibold cursor-pointer disabled:cursor-not-allowed"
                      style={{ color: "#d7baff", pointerEvents: "auto" }}
                      disabled={isAnyBusy || deleting}
                    >
                      {opening || deleting ? (
                        <div
                          className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin"
                          style={{
                            borderColor: "#d7baff",
                            borderTopColor: "transparent",
                          }}
                        />
                      ) : (
                        <>
                          View Project
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </main>
    </div>
  );
}
