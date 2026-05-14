import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/storage";
import { verifyProof, IDKitV4Response } from "@/lib/worldid";
import { newReceiptId, isValidReceiptId } from "@/lib/ids";
import { sign } from "@/lib/receipt";
import { rateLimit, clientKey } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VerifyRequest = {
  idkitResponse?: IDKitV4Response | null;
  mock?: boolean;
  inviteId?: string | null;
};

export async function POST(req: NextRequest) {
  const rl = await rateLimit(clientKey(req));
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "rate_limited", retryAfterMs: rl.resetMs },
      { status: 429, headers: { "retry-after": String(Math.ceil(rl.resetMs / 1000)) } },
    );
  }

  let body: VerifyRequest;
  try {
    body = (await req.json()) as VerifyRequest;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const inviteId =
    body.inviteId && isValidReceiptId(body.inviteId) ? body.inviteId : null;

  const result = await verifyProof(body.idkitResponse ?? null);
  if (!result.ok) {
    // Include a redacted echo of what we received so we can diagnose shape
    // mismatches without spelunking through serverless logs.
    const received = body.idkitResponse;
    const shape: Record<string, unknown> = {};
    if (received && typeof received === "object") {
      for (const k of Object.keys(received)) {
        const v = (received as Record<string, unknown>)[k];
        if (Array.isArray(v)) {
          shape[k] = v.length === 0 ? "[]" : `array(len=${v.length}, keys=${Object.keys(v[0] ?? {}).join("|")})`;
        } else if (v && typeof v === "object") {
          shape[k] = `object(keys=${Object.keys(v).join("|")})`;
        } else {
          shape[k] = typeof v === "string" ? v.slice(0, 40) : typeof v;
        }
      }
    } else {
      shape["__top__"] = received === null ? "null" : typeof received;
    }
    return NextResponse.json({ error: result.error, debug: shape }, { status: 400 });
  }

  const { entry, created } = await store.mintOrGet({
    nullifierHash: result.nullifierHash,
    inviteId,
    issuedAt: new Date().toISOString(),
    newId: newReceiptId,
    sign,
  });

  return NextResponse.json({
    receiptId: entry.id,
    humanNumber: entry.humanNumber,
    alreadyVerified: !created,
  });
}
