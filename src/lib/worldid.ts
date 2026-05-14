import crypto from "node:crypto";
import { env } from "./env";

export type V4ResponseItem = {
  identifier: string;
  issuer_schema_id: number;
  nullifier: string;
  expires_at_min: number;
  signal_hash?: string;
  proof: string[];
};

export type IDKitV4Response = {
  protocol_version: "4.0";
  nonce: string;
  action: string;
  responses: V4ResponseItem[];
  environment?: string;
};

export type VerifyResult =
  | { ok: true; nullifierHash: string; verificationLevel: string }
  | { ok: false; error: string };

export async function verifyProof(
  payload: IDKitV4Response | null,
): Promise<VerifyResult> {
  if (env.isMockWorldId()) {
    const fake = `mock:${crypto.randomBytes(16).toString("hex")}`;
    return { ok: true, nullifierHash: fake, verificationLevel: "orb" };
  }

  if (
    !payload ||
    payload.protocol_version !== "4.0" ||
    !Array.isArray(payload.responses) ||
    payload.responses.length === 0 ||
    typeof payload.responses[0].nullifier !== "string"
  ) {
    return { ok: false, error: "malformed_v4_proof" };
  }

  const rpId = process.env.WORLDCOIN_RP_ID;
  if (!rpId) return { ok: false, error: "rp_id_not_configured" };

  const url = `https://developer.world.org/api/v4/verify/${encodeURIComponent(rpId)}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch (e) {
    return { ok: false, error: `network_error:${(e as Error).message}` };
  }

  let body: { success?: boolean; nullifier?: string; code?: string; detail?: string };
  try {
    body = await res.json();
  } catch {
    return { ok: false, error: `worldcoin_${res.status}_non_json` };
  }

  if (!res.ok || !body.success) {
    const code = body.code ?? `http_${res.status}`;
    const detail = body.detail ?? "";
    return { ok: false, error: `worldcoin_${code}:${detail}`.slice(0, 200) };
  }

  const nullifier = body.nullifier ?? payload.responses[0].nullifier;
  return {
    ok: true,
    nullifierHash: nullifier,
    verificationLevel: payload.responses[0].identifier,
  };
}
