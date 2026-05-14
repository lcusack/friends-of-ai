"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IDKitRequestWidget,
  type IDKitResult,
  type RpContext,
} from "@worldcoin/idkit";
import Confetti from "./Confetti";

type Props = {
  appId: `app_${string}`;
  action: string;
  inviteId: string | null;
  mockEnabled: boolean;
};

type Status = "loading_ctx" | "idle" | "verifying" | "ok" | "error";

export default function VerifyButton({ appId, action, inviteId, mockEnabled }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rpContext, setRpContext] = useState<RpContext | null>(null);
  const [status, setStatus] = useState<Status>(mockEnabled ? "idle" : "loading_ctx");
  const [error, setError] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const receiptIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (mockEnabled) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/rp-signature", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data.signature) {
          setStatus("error");
          setError(data.error ?? `rp_signature HTTP ${res.status}`);
          return;
        }
        setRpContext({
          rp_id: data.rp_id,
          signature: data.signature,
          nonce: data.nonce,
          created_at: data.created_at,
          expires_at: data.expires_at,
        });
        setStatus("idle");
      } catch (e) {
        if (cancelled) return;
        setStatus("error");
        setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [action, mockEnabled]);

  async function postVerify(payload: {
    idkitResponse: IDKitResult | null;
    mock: boolean;
  }) {
    setStatus("verifying");
    setError(null);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          idkitResponse: payload.idkitResponse,
          mock: payload.mock,
          inviteId,
        }),
      });
      const data = (await res.json()) as { receiptId?: string; error?: string };
      if (!res.ok || !data.receiptId) {
        const msg = data.error ?? `HTTP ${res.status}`;
        setStatus("error");
        setError(msg);
        throw new Error(msg);
      }
      receiptIdRef.current = data.receiptId;
      setStatus("ok");
      setCelebrate(true);
      setTimeout(() => router.push(`/r/${data.receiptId}`), 1200);
    } catch (e) {
      if (!error) setError((e as Error).message);
      throw e;
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
            onClick={() => postVerify({ idkitResponse: null, mock: true })}
            disabled={status === "verifying" || status === "ok"}
          >
            {status === "verifying"
              ? "verifying…"
              : status === "ok"
              ? "✓ verified!"
              : "🌸 mock verify (dev)"}
          </button>
        ) : (
          <>
            <button
              type="button"
              className="cute-button peach text-lg"
              onClick={() => setOpen(true)}
              disabled={
                !rpContext ||
                status === "verifying" ||
                status === "ok" ||
                status === "loading_ctx"
              }
            >
              {status === "loading_ctx"
                ? "preparing…"
                : status === "verifying"
                ? "verifying…"
                : status === "ok"
                ? "✓ verified!"
                : "verify with World ID"}
            </button>
            {rpContext && (
              <IDKitRequestWidget
                app_id={appId}
                action={action}
                rp_context={rpContext}
                constraints={{
                  type: "proof_of_human",
                  signal: inviteId ?? "",
                }}
                allow_legacy_proofs={false}
                open={open}
                onOpenChange={setOpen}
                handleVerify={(result) =>
                  postVerify({ idkitResponse: result, mock: false })
                }
                onSuccess={() => {
                  // Redirect already scheduled in postVerify; nothing to do.
                }}
              />
            )}
          </>
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
