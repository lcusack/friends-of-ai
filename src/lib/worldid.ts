import crypto from "node:crypto";
import { verifyCloudProof, type ISuccessResult } from "@worldcoin/idkit";
import { env } from "./env";

export type IDKitProof = ISuccessResult;

export type VerifyResult =
  | { ok: true; nullifierHash: string; verificationLevel: string }
  | { ok: false; error: string };

export async function verifyProof(
  payload: IDKitProof,
  signal: string,
): Promise<VerifyResult> {
  if (env.isMockWorldId()) {
    const fake = `mock:${crypto.randomBytes(16).toString("hex")}`;
    return { ok: true, nullifierHash: fake, verificationLevel: "orb" };
  }

  if (
    !payload ||
    typeof payload.proof !== "string" ||
    typeof payload.merkle_root !== "string" ||
    typeof payload.nullifier_hash !== "string"
  ) {
    return { ok: false, error: "malformed_proof" };
  }

  const appId = env.worldcoinAppId() as `app_${string}`;
  const action = env.worldcoinAction();

  try {
    const res = await verifyCloudProof(payload, appId, action, signal);
    if (!res.success) {
      return {
        ok: false,
        error: `worldcoin_${res.code ?? "unknown"}:${res.detail ?? ""}`.slice(0, 200),
      };
    }
    return {
      ok: true,
      nullifierHash: payload.nullifier_hash,
      verificationLevel: payload.verification_level ?? "unknown",
    };
  } catch (e) {
    return { ok: false, error: `verify_error:${(e as Error).message}` };
  }
}
