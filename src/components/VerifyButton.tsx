"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IDKitWidget, VerificationLevel, ISuccessResult } from "@worldcoin/idkit";
import Confetti from "./Confetti";

type Props = {
  appId: `app_${string}`;
  action: string;
  inviteId: string | null;
  mockEnabled: boolean;
};

export default function VerifyButton({ appId, action, inviteId, mockEnabled }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "verifying" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  async function postVerify(result: ISuccessResult | { mock: true }) {
    setStatus("verifying");
    setError(null);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          proof: "mock" in result
            ? { proof: "mock", merkle_root: "mock", nullifier_hash: "mock", verification_level: "orb" }
            : result,
          inviteId,
        }),
      });
      const data = (await res.json()) as { receiptId?: string; error?: string };
      if (!res.ok || !data.receiptId) {
        setStatus("error");
        setError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setStatus("ok");
      setCelebrate(true);
      setTimeout(() => router.push(`/r/${data.receiptId}`), 1200);
    } catch (e) {
      setStatus("error");
      setError((e as Error).message);
    }
  }

  return (
    <>
      <Confetti active={celebrate} />
      <div className="flex flex-col items-center gap-4">
        {mockEnabled ? (
          <button
            type="button"
            className="cute-button peach text-lg"
            onClick={() => postVerify({ mock: true })}
            disabled={status === "verifying" || status === "ok"}
          >
            {status === "verifying" ? "verifying…" : status === "ok" ? "✓ verified!" : "🌸 mock verify (dev)"}
          </button>
        ) : (
          <IDKitWidget
            app_id={appId}
            action={action}
            signal={inviteId ?? ""}
            verification_level={VerificationLevel.Orb}
            onSuccess={(result) => postVerify(result)}
          >
            {({ open }) => (
              <button
                type="button"
                className="cute-button peach text-lg"
                onClick={open}
                disabled={status === "verifying" || status === "ok"}
              >
                {status === "verifying"
                  ? "verifying…"
                  : status === "ok"
                  ? "✓ verified!"
                  : "verify with World ID"}
              </button>
            )}
          </IDKitWidget>
        )}

        {status === "verifying" && (
          <p className="text-ink/60 text-sm">checking the proof… one sec ✦</p>
        )}
        {status === "ok" && (
          <p className="text-mintDeep font-display text-lg">welcome, friend ♡</p>
        )}
        {status === "error" && error && (
          <p className="text-red-500 text-sm max-w-xs text-center">
            something went wrong: {error}
          </p>
        )}
      </div>
    </>
  );
}
