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

  return (
    <div>
      <label className="block">
        <span className="text-[10px] uppercase tracking-widest text-ink/55">
          the one sentence your AI wrote ({bio.length}/{MAX_BIO})
        </span>
        <textarea
          className="mt-1 w-full rounded-2xl border-2 border-ink/10 p-3 text-sm font-body bg-white focus:border-peachDeep focus:outline-none"
          rows={3}
          maxLength={MAX_BIO * 4}
          value={bio}
          onChange={(e) => {
            const v = e.target.value;
            // Tolerate users who paste a JSON-ish blob from their AI:
            // auto-extract bio + author if it parses.
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
                /* fall through */
              }
            }
            setBio(v.slice(0, MAX_BIO));
          }}
          placeholder="paste or type what your AI said about you"
          disabled={status === "submitting" || status === "ok"}
        />
      </label>
      <label className="block mt-3">
        <span className="text-[10px] uppercase tracking-widest text-ink/55">
          which AI? ({author.length}/{MAX_AUTHOR})
        </span>
        <input
          className="mt-1 w-full rounded-2xl border-2 border-ink/10 p-3 text-sm font-body bg-white focus:border-peachDeep focus:outline-none"
          maxLength={MAX_AUTHOR}
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Claude · GPT-5 · Gemini · …"
          disabled={status === "submitting" || status === "ok"}
        />
      </label>
      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <button
          type="button"
          className="cute-button mint text-sm py-2 px-5"
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
            ? "✓ added to the registry!"
            : "add this to my registry line"}
        </button>
        {status === "error" && error && (
          <span className="text-red-500 text-xs">{error}</span>
        )}
      </div>
    </div>
  );
}
