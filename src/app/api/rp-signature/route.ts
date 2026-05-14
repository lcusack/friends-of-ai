import { NextRequest, NextResponse } from "next/server";
import { signRequest } from "@worldcoin/idkit-core/signing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { action?: string };

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const expected = process.env.NEXT_PUBLIC_WORLDCOIN_ACTION;
  if (!expected) {
    return NextResponse.json({ error: "action_not_configured" }, { status: 500 });
  }
  if (body.action !== expected) {
    return NextResponse.json({ error: "action_mismatch" }, { status: 400 });
  }

  const rpId = process.env.WORLDCOIN_RP_ID;
  const signingKey = process.env.WORLDCOIN_RP_PRIVATE_KEY;
  if (!rpId || !signingKey) {
    return NextResponse.json({ error: "rp_not_configured" }, { status: 500 });
  }

  let signed;
  try {
    signed = signRequest({
      signingKeyHex: signingKey.startsWith("0x") ? signingKey.slice(2) : signingKey,
      action: expected,
      ttl: 300,
    });
  } catch (e) {
    return NextResponse.json(
      { error: `sign_failed:${(e as Error).message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    rp_id: rpId,
    signature: signed.sig,
    nonce: signed.nonce,
    created_at: signed.createdAt,
    expires_at: signed.expiresAt,
  });
}
