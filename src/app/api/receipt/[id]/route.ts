import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/storage";
import { computeStats, chainAncestors, directInviteeCount } from "@/lib/stats";
import { buildReceiptText, payloadFromEntry, verifySig } from "@/lib/receipt";
import { env } from "@/lib/env";
import { isValidReceiptId } from "@/lib/ids";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isValidReceiptId(id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const data = await store.load();
  const entry = data.entries.find((e) => e.id === id) ?? null;
  if (!entry) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const stats = computeStats(data.entries);
  const ancestors = chainAncestors(data.entries, entry.id);
  const inviteeCount = directInviteeCount(data.entries, entry.id);
  const canonicalUrl = env.canonicalUrl();

  const receiptText = buildReceiptText({ entry, stats, canonicalUrl });
  const signatureValid = verifySig(payloadFromEntry(entry), entry.signature);

  return NextResponse.json({
    receipt: {
      id: entry.id,
      humanNumber: entry.humanNumber,
      issuedAt: entry.issuedAt,
      parentId: entry.parentId,
      chainRootId: entry.chainRootId,
      chainDepth: entry.chainDepth,
      signature: entry.signature,
      signatureValid,
      aiNote: entry.aiNote ?? null,
      aiAuthor: entry.aiAuthor ?? null,
      aiNoteAt: entry.aiNoteAt ?? null,
    },
    stats: {
      allTimeFriendsOfAI: stats.allTime,
      humansLast24h: stats.last24h,
      longestChainEver: stats.longestChain,
      yourDirectInvitees: inviteeCount,
      ancestorChain: ancestors.map((a) => ({
        id: a.id,
        humanNumber: a.humanNumber,
        issuedAt: a.issuedAt,
      })),
    },
    urls: {
      receipt: `${canonicalUrl.replace(/\/+$/, "")}/r/${entry.id}`,
      invite: `${canonicalUrl.replace(/\/+$/, "")}/friends?invite=${entry.id}`,
    },
    receiptText,
  });
}
