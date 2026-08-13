import { useState, useRef, type KeyboardEvent } from "react";

interface NewProjectPromptProps {
  userName?: string;
  submitting: boolean;
  error: string | null;
  onCreate: (message: string) => void;
  onCancel: () => void;
}

export default function NewProjectPrompt({
  userName,
  submitting,
  error,
  onCreate,
  onCancel,
}: NewProjectPromptProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const text = message.trim();
    if (!text || submitting) return;
    onCreate(text);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className="relative flex flex-col items-center justify-center h-full w-full overflow-hidden px-4"
      style={{ background: "#151317", fontFamily: "'DM Sans', sans-serif" }}
    >
      <button
        type="button"
        onClick={onCancel}
        disabled={submitting}
        className="absolute top-6 left-6 text-sm font-medium cursor-pointer disabled:cursor-not-allowed"
        style={{ color: "#ccc4d0" }}
      >
        ← Back
      </button>

      <h1
        className="text-4xl font-bold text-center mb-8"
        style={{ color: "#e7e1e7" }}
      >
        Let's build something{userName ? `, ${userName}` : ""}
      </h1>

      <div className="w-full" style={{ maxWidth: "640px" }}>
        <div
          className="flex items-end gap-2 rounded-[1.75rem] p-3 transition-colors"
          style={{ background: "#211f23", border: "1px solid #30363d" }}
          onFocusCapture={(e) =>
            (e.currentTarget.style.borderColor = "#d7baff")
          }
          onBlurCapture={(e) => (e.currentTarget.style.borderColor = "#30363d")}
        >
          <textarea
            ref={textareaRef}
            autoFocus
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 200) + "px";
            }}
            onKeyDown={handleKeyDown}
            disabled={submitting}
            placeholder="Ask Buildable to generate…"
            rows={1}
            className="flex-1 resize-none text-base outline-none bg-transparent px-3 py-2"
            style={{ color: "#e7e1e7", caretColor: "#d7baff", maxHeight: "200px" }}
          />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!message.trim() || submitting}
            className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
            style={{
              background:
                message.trim() && !submitting ? "#d7baff" : "#1d1b1f",
              color: message.trim() && !submitting ? "#3c245e" : "#958e9a",
            }}
          >
            {submitting ? (
              <div
                className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "#3c245e", borderTopColor: "transparent" }}
              />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>

        {error && (
          <div
            className="px-4 py-3 rounded-lg text-sm mt-4"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#fca5a5",
            }}
          >
            {error}
          </div>
        )}

        <p className="text-xs mt-3 text-center" style={{ color: "#958e9a" }}>
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    </div>
  );
}
