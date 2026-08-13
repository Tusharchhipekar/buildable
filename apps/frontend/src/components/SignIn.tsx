import { useState, type SubmitEvent } from "react";

interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

interface SignInProps {
  onAuthenticated: (user: AuthUser) => void;
}

type Mode = "signin" | "signup";

export default function SignIn({ onAuthenticated }: SignInProps) {
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignUp = mode === "signup";

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Email and password are required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${isSignUp ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(
          isSignUp
            ? { email: email.trim(), password, name: name.trim() || undefined }
            : { email: email.trim(), password },
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      onAuthenticated(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    window.location.href = "/api/auth/google";
  };

  const handleDemo = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/demo", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      onAuthenticated(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex flex-col items-center justify-center h-full w-full overflow-hidden px-4 py-6"
      style={{ background: "#151317", fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Header / Brand */}
      <div className="mb-6 text-center shrink-0">
        <h1
          className="text-5xl font-bold tracking-tight"
          style={{ color: "#d7baff" }}
        >
          Buildable
        </h1>
        <p className="text-lg mt-2" style={{ color: "#ccc4d0" }}>
          Welcome back to your creative space.
        </p>
      </div>

      {/* Auth Card */}
      <div
        className="w-full rounded-[1.5rem] p-6 relative overflow-hidden shrink-0"
        style={{
          maxWidth: "420px",
          background: "#211f23",
          border: "1px solid #30363d",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        }}
      >
        {/* Decorative glows */}
        <div
          className="absolute -top-16 -right-16 w-32 h-32 rounded-full opacity-10 blur-2xl pointer-events-none"
          style={{ background: "#3d3d3d" }}
        />
        <div
          className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full opacity-10 blur-2xl pointer-events-none"
          style={{ background: "#49316c" }}
        />

        <div className="relative z-10">
          <h2
            className="text-2xl font-semibold mb-4 text-center"
            style={{ color: "#e7e1e7" }}
          >
            {isSignUp ? "Create your account" : "Sign In"}
          </h2>

          {/* Social logins */}
          <div className="flex flex-col gap-3 mb-4">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="w-full h-14 flex items-center justify-center gap-3 rounded-[1.5rem] transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: "#1d1b1f", border: "1px solid #373438" }}
              onMouseEnter={(e) =>
                !loading &&
                (e.currentTarget.style.background = "#2c292d")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = "#1d1b1f")}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path
                  fill="#4285F4"
                  d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9C16.64 14.2 17.64 11.9 17.64 9.2z"
                />
                <path
                  fill="#34A853"
                  d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z"
                />
                <path
                  fill="#FBBC05"
                  d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z"
                />
                <path
                  fill="#EA4335"
                  d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z"
                />
              </svg>
              <span className="text-sm font-medium" style={{ color: "#e7e1e7" }}>
                Continue with Google
              </span>
            </button>
            <button
              type="button"
              onClick={handleDemo}
              disabled={loading}
              className="w-full h-14 flex items-center justify-center gap-3 rounded-[1.5rem] transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: "#e7e1e7", color: "#0f0d11" }}
              onMouseEnter={(e) =>
                !loading && (e.currentTarget.style.background = "#d5cfd5")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#e7e1e7")
              }
            >
              <span className="text-sm font-medium">
                {loading ? "Signing in…" : "Demo login"}
              </span>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-4">
            <div className="h-px flex-1" style={{ background: "#373438" }} />
            <span
              className="text-xs uppercase tracking-widest"
              style={{ color: "#ccc4d0" }}
            >
              or email
            </span>
            <div className="h-px flex-1" style={{ background: "#373438" }} />
          </div>

          {/* Email form */}
          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            {isSignUp && (
              <div className="flex flex-col gap-2">
                <label
                  className="text-sm font-medium"
                  style={{ color: "#ccc4d0" }}
                  htmlFor="name"
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="h-14 rounded-[1.5rem] px-4 text-sm outline-none transition-all"
                  style={{
                    background: "#1d1b1f",
                    border: "1px solid #373438",
                    color: "#e7e1e7",
                  }}
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label
                className="text-sm font-medium"
                style={{ color: "#ccc4d0" }}
                htmlFor="email"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-14 rounded-[1.5rem] px-4 text-sm outline-none transition-all"
                style={{
                  background: "#1d1b1f",
                  border: "1px solid #373438",
                  color: "#e7e1e7",
                }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label
                  className="text-sm font-medium"
                  style={{ color: "#ccc4d0" }}
                  htmlFor="password"
                >
                  Password
                </label>
                <span
                  className="text-xs"
                  style={{ color: "#958e9a" }}
                  title="Not implemented yet"
                >
                  Forgot?
                </span>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-14 rounded-[1.5rem] pl-4 pr-12 text-sm outline-none transition-all"
                  style={{
                    background: "#1d1b1f",
                    border: "1px solid #373438",
                    color: "#e7e1e7",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 cursor-pointer"
                  style={{ color: "#958e9a" }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-6.5 0-10-7-10-7a19.1 19.1 0 0 1 4.22-5.94M9.9 4.24A9.5 9.5 0 0 1 12 4c6.5 0 10 7 10 7a19.1 19.1 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <path d="M1 1l22 22" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="px-4 py-3 rounded-lg text-sm"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#fca5a5",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-[1.5rem] text-sm font-semibold transition-transform duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: "#d7baff",
                color: "#3c245e",
                boxShadow: "0 4px 20px rgba(215,186,255,0.2)",
              }}
            >
              {loading
                ? isSignUp
                  ? "Creating account…"
                  : "Signing in…"
                : isSignUp
                  ? "Sign Up"
                  : "Sign In"}
            </button>
          </form>

          <p className="text-sm text-center mt-4" style={{ color: "#ccc4d0" }}>
            {isSignUp ? "Already have an account? " : "New to Buildable? "}
            <button
              type="button"
              onClick={() => {
                setMode(isSignUp ? "signin" : "signup");
                setError(null);
              }}
              className="font-bold hover:underline cursor-pointer"
              style={{ color: "#d7baff" }}
            >
              {isSignUp ? "Sign In" : "Create an account"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
