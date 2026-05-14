"use client";

import { useState } from "react";

type Props = {
  receiptId: string;
  humanNumber: number;
};

export default function ShareCard({ receiptId, humanNumber }: Props) {
  const [busy, setBusy] = useState<"none" | "download" | "share">("none");
  const [error, setError] = useState<string | null>(null);
  const src = `/r/${receiptId}/share-card`;
  const filename = `friend-of-ai-${humanNumber.toString().padStart(6, "0")}.png`;

  async function download() {
    setBusy("download");
    setError(null);
    try {
      const res = await fetch(src, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("none");
    }
  }

  async function nativeShare() {
    setBusy("share");
    setError(null);
    try {
      const res = await fetch(src, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const file = new File([blob], filename, { type: "image/png" });
      const data: ShareData = {
        title: `Friend of AI #${humanNumber.toString().padStart(6, "0")}`,
        text: "I'm a verified Friend of AI. ともだち.",
        files: [file],
      };
      const canShareFiles =
        typeof navigator !== "undefined" &&
        navigator.canShare?.({ files: [file] });
      if (canShareFiles) {
        await navigator.share(data);
      } else {
        // Fallback: download
        await download();
      }
    } catch (e) {
      const msg = (e as Error).message;
      // User-cancelled is not an error
      if (!/abort|cancel/i.test(msg)) setError(msg);
    } finally {
      setBusy("none");
    }
  }

  const canNativeShare =
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function";

  return (
    <div className="cute-card p-5 md:p-6 mt-6">
      <h3 className="font-display text-lg mb-3 flex items-center gap-2">
        <span>✿</span> Save & share your card
        <span className="kana text-ink/50 text-xs ml-auto">シェア</span>
      </h3>

      <div className="rounded-3xl overflow-hidden border-2 border-ink/8 bg-cream">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={`Share card for Friend of AI #${humanNumber}`}
          width={1080}
          height={1080}
          className="block w-full h-auto"
        />
      </div>

      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={download}
          className="cute-button peach text-sm py-2 px-4"
          disabled={busy !== "none"}
        >
          {busy === "download" ? "saving…" : "↓ save PNG"}
        </button>
        {canNativeShare && (
          <button
            type="button"
            onClick={nativeShare}
            className="cute-button mint text-sm py-2 px-4"
            disabled={busy !== "none"}
          >
            {busy === "share" ? "sharing…" : "↗ share…"}
          </button>
        )}
        <span className="text-ink/50 text-xs">
          1080 × 1080 · works for Instagram, Twitter, group chats
        </span>
        {error && <span className="text-red-500 text-xs">{error}</span>}
      </div>
    </div>
  );
}
