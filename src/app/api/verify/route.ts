import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/storage";
import { verifyProof, IDKitProof } from "@/lib/worldid";
import { newReceiptId, isValidReceiptId } from "@/lib/ids";
import { sign } from "@/lib/receipt";
import { rateLimit, clientKey } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VerifyRequest = {
  proof: IDKitProof;
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
  const signal = inviteId ?? "";

  const result = await verifyProof(body.proof, signal);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
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
