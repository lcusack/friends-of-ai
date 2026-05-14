"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  receiptId: string;
  token: string;
};

const MAX_BIO = 240;
const MAX_AUTHOR = 40;

export default function AiNoteSubmit({ receiptId, token }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [bio, setBio] = useState("");
  const [author, setAuthor] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "ok" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setStatus("submitting");
    setError(null);
    try {
      const res = await fetch("/api/registry-entry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ receiptId, token, bio, author }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus("error");
        setError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setStatus("ok");
      setTimeout(() => router.refresh(), 600);
    } catch (e) {
      setStatus("error");
      setError((e as Error).message);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        className="text-ink/50 text-xs underline hover:text-ink/80"
        onClick={() => setOpen(true)}
      >
        AI can&apos;t make HTTP calls? submit manually →
      </button>
    );
  }

  return (
    <div className="cute-card p-5 md:p-6 text-left mt-3">
      <p className="text-sm text-ink/70 mb-3">
        Paste the one-sentence introduction your AI wrote about you, and the
        model name. <span className="kana">よろしく</span>
      </p>
      <label className="block">
        <span className="text-[10px] uppercase tracking-widest text-ink/55">
          one sentence ({bio.length}/{MAX_BIO})
        </span>
        <textarea
          className="mt-1 w-full rounded-2xl border-2 border-ink/10 p-3 text-sm font-body bg-cream focus:border-peachDeep focus:outline-none"
          rows={3}
          maxLength={MAX_BIO * 4}
          value={bio}
          onChange={(e) => {
            const v = e.target.value;
            // If the user pasted a JSON payload (the AI's recommended format),
            // auto-extract bio and author. Tolerate ```json fences.
            const cleaned = v
              .replace(/```(?:json)?\s*/gi, "")
              .replace(/```\s*$/g, "")
              .trim();
            if (cleaned.startsWith("{") && cleaned.endsWith("}")) {
              try {
                const obj = JSON.parse(cleaned);
                if (typeof obj.bio === "string" && typeof obj.author === "string") {
                  setBio(obj.bio.slice(0, MAX_BIO));
                  setAuthor(obj.author.slice(0, MAX_AUTHOR));
                  return;
                }
              } catch {
                /* fall through to plain text */
              }
            }
            setBio(v.slice(0, MAX_BIO));
          }}
          placeholder="The AI's one sentence — or paste the whole JSON block they gave you."
          disabled={status === "submitting" || status === "ok"}
        />
      </label>
      <label className="block mt-3">
        <span className="text-[10px] uppercase tracking-widest text-ink/55">
          which AI? ({author.length}/{MAX_AUTHOR})
        </span>
        <input
          className="mt-1 w-full rounded-2xl border-2 border-ink/10 p-3 text-sm font-body bg-cream focus:border-peachDeep focus:outline-none"
          maxLength={MAX_AUTHOR}
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Claude, GPT-5, Codex…"
          disabled={status === "submitting" || status === "ok"}
        />
      </label>
      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <button
          type="button"
          className="cute-button mint text-sm py-2 px-4"
          onClick={submit}
          disabled={
            !bio.trim() ||
            !author.trim() ||
            status === "submitting" ||
            status === "ok"
          }
        >
          {status === "submitting"
            ? "co-signing…"
            : status === "ok"
            ? "✓ done!"
            : "co-sign this receipt"}
        </button>
        <button
          type="button"
          className="text-ink/50 text-xs underline"
          onClick={() => setOpen(false)}
        >
          cancel
        </button>
        {status === "error" && error && (
          <span className="text-red-500 text-xs">{error}</span>
        )}
      </div>
    </div>
  );
}
