import { useState, useEffect, type FormEvent } from "react";

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
  [key: string]: unknown;
}

interface DashboardProps {
  user: User | null;
  onSandboxCreated: (sandboxData: SandboxData) => void;
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
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/sandbox/project", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { projects: [] }))
      .then((data) => setProjects(data.projects || []))
      .catch(() => {})
      .finally(() => setProjectsLoading(false));
  }, []);

  const isAnyBusy = openingProjectId !== null || submitting;

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

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    const projectTitle = title.trim();
    if (!projectTitle) {
      setError("Please enter a project name");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const projectRes = await fetch("/api/sandbox/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: projectTitle }),
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
      onSandboxCreated(await sandboxRes.json());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create project",
      );
      setSubmitting(false);
    }
  };

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
          <div
            className="rounded-2xl p-6 flex flex-col items-center justify-center text-center min-h-[180px] cursor-pointer transition-colors"
            style={{
              border: "1px dashed #373438",
              background: "transparent",
            }}
            onClick={() => !creating && setCreating(true)}
          >
            {creating ? (
              <form
                onSubmit={handleCreate}
                className="w-full flex flex-col gap-3"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  autoFocus
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Project name…"
                  disabled={submitting}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{
                    background: "#1d1b1f",
                    border: "1px solid #373438",
                    color: "#e7e1e7",
                  }}
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 rounded-lg py-2 text-sm font-semibold cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ background: "#d7baff", color: "#3c245e" }}
                  >
                    {submitting ? "Creating…" : "Create"}
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      setCreating(false);
                      setTitle("");
                      setError(null);
                    }}
                    className="flex-1 rounded-lg py-2 text-sm font-medium cursor-pointer"
                    style={{
                      background: "#1d1b1f",
                      color: "#ccc4d0",
                      border: "1px solid #373438",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl mb-3"
                  style={{ border: "1px solid #373438", color: "#d7baff" }}
                >
                  +
                </div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "#d7baff" }}
                >
                  Start New Project
                </p>
                <p className="text-xs mt-1" style={{ color: "#958e9a" }}>
                  Spin up a new sandbox instantly.
                </p>
              </>
            )}
          </div>

          {!projectsLoading &&
            projects.map((project) => {
              const opening = openingProjectId === project._id;
              return (
                <button
                  key={project._id}
                  type="button"
                  disabled={isAnyBusy}
                  onClick={() => handleOpenProject(project._id)}
                  className="rounded-2xl p-6 flex flex-col text-left min-h-[180px] cursor-pointer transition-colors disabled:cursor-not-allowed"
                  style={{ background: "#211f23", border: "1px solid #30363d" }}
                >
                  <h3
                    className="text-lg font-semibold mb-2"
                    style={{ color: "#e7e1e7" }}
                  >
                    {project.title}
                  </h3>
                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <span className="text-xs" style={{ color: "#958e9a" }}>
                      {timeAgo(project.createdAt) || ""}
                    </span>
                    {opening && (
                      <div
                        className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                        style={{
                          borderColor: "#d7baff",
                          borderTopColor: "transparent",
                        }}
                      />
                    )}
                  </div>
                </button>
              );
            })}
        </div>
      </main>
    </div>
  );
}
