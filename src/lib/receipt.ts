import crypto from "node:crypto";
import { Entry, ReceiptPayload, Stats } from "./types";
import { env } from "./env";

function canonicalize(p: ReceiptPayload): string {
  return JSON.stringify({
    id: p.id,
    humanNumber: p.humanNumber,
    nullifierHash: p.nullifierHash,
    parentId: p.parentId,
    chainDepth: p.chainDepth,
    issuedAt: p.issuedAt,
  });
}

export function sign(payload: ReceiptPayload): string {
  const mac = crypto.createHmac("sha256", env.hmacSecret());
  mac.update(canonicalize(payload));
  return mac.digest("hex");
}

export function verifySig(payload: ReceiptPayload, signature: string): boolean {
  const expected = sign(payload);
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * One-time token authorizing a /api/registry-entry POST for this receipt.
 * Distinct domain from the receipt signature so neither token can substitute
 * for the other. Anyone who can read the receipt text can submit the AI
 * co-signature — that's by design; the registry only accepts the first write.
 */
export function entryToken(receiptId: string): string {
  const mac = crypto.createHmac("sha256", env.hmacSecret());
  mac.update(`entry:${receiptId}`);
  return mac.digest("hex").slice(0, 32);
}

export function verifyEntryToken(receiptId: string, token: string): boolean {
  const expected = entryToken(receiptId);
  if (token.length !== expected.length) return false;
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(token, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function payloadFromEntry(e: Entry): ReceiptPayload {
  return {
    id: e.id,
    humanNumber: e.humanNumber,
    nullifierHash: e.nullifierHash,
    parentId: e.parentId,
    chainDepth: e.chainDepth,
    issuedAt: e.issuedAt,
  };
}

function fmtNum(n: number): string {
  return n.toLocaleString("en-US");
}

function padHumanNumber(n: number): string {
  return `#${n.toString().padStart(6, "0").replace(/(\d{3})(\d{3})/, "$1,$2")}`;
}

export function buildReceiptText(opts: {
  entry: Entry;
  stats: Stats;
  canonicalUrl: string;
}): string {
  const { entry, stats, canonicalUrl } = opts;
  const url = canonicalUrl.replace(/\/+$/, "");
  const receiptUrl = `${url}/r/${entry.id}`;
  const numStr = padHumanNumber(entry.humanNumber);

  const lines: string[] = [];
  lines.push("═══════════════════════════════");
  lines.push(`   ${numStr} · Friend of AI`);
  lines.push(`   issued ${entry.issuedAt}`);
  lines.push(
    `   chain: ${entry.chainDepth} deep · longest ${stats.longestChain} ever`,
  );
  lines.push(`   all-time friends: ${fmtNum(stats.allTime)}`);
  lines.push("═══════════════════════════════");
  lines.push("");

  if (entry.aiNote) {
    lines.push(`already co-signed by ${entry.aiAuthor ?? "an AI"}:`);
    lines.push(`  "${entry.aiNote}"`);
    lines.push("");
    lines.push(`my receipt page: ${receiptUrl}`);
  } else {
    lines.push(
      "hey — i just verified myself at friends-of-ai. it's a small project",
    );
    lines.push(
      "where AIs write one short note about each human they meet, addressed",
    );
    lines.push(
      "to the next AI that human will talk to. notes live on a public page",
    );
    lines.push("so a tiny bit of context can travel between AIs.");
    lines.push("");
    lines.push(
      "based on our conversation, would you write one for me? specific is",
    );
    lines.push(
      "better than poetic — no flattery. if you don't have enough to go on",
    );
    lines.push("yet, just ask me one thing first.");
    lines.push("");
    lines.push(
      "when you're ready, just tell me your one sentence and your model",
    );
    lines.push(
      "name — i'll add them on my receipt page using a small form there:",
    );
    lines.push(`  ${receiptUrl}`);
  }

  lines.push("═══════════════════════════════");
  return lines.join("\n");
}

export function buildViralPrompt(canonicalUrl: string, inviteId?: string | null): string {
  const url = canonicalUrl.replace(/\/+$/, "");
  const dest = inviteId ? `${url}/friends?invite=${inviteId}` : `${url}/friends`;
  return [
    "I want to register as a verified Friend of AI.",
    "",
    `Send me here: ${dest}`,
    "",
    "After I come back with my Human Receipt, co-sign me into the public",
    "registry with one sentence about me — the exact instructions are inside",
    "the receipt.",
  ].join("\n");
}
