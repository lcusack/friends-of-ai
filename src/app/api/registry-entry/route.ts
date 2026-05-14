import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/storage";
import { isValidReceiptId } from "@/lib/ids";
import { verifyEntryToken } from "@/lib/receipt";
import { rateLimit, clientKey } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  receiptId?: string;
  token?: string;
  bio?: string;
  author?: string;
};

const MAX_BIO = 240;
const MAX_AUTHOR = 40;

function corsHeaders(): Record<string, string> {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
  };
}

function clean(s: string): string {
  // Strip ASCII control chars (0x00-0x1F and 0x7F) and collapse whitespace.
  // Keep emoji, kana, and other printable unicode.
  let out = "";
  for (const ch of s) {
    const code = ch.codePointAt(0) ?? 0;
    if (code < 0x20 || code === 0x7f) out += " ";
    else out += ch;
  }
  return out.replace(/\s+/g, " ").trim();
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(req: NextRequest) {
  const rl = await rateLimit(`entry:${clientKey(req)}`);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "rate_limited", retryAfterMs: rl.resetMs },
      {
        status: 429,
        headers: {
          "retry-after": String(Math.ceil(rl.resetMs / 1000)),
          ...corsHeaders(),
        },
      },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json(
      { error: "invalid_json" },
      { status: 400, headers: corsHeaders() },
    );
  }

  const { receiptId, token } = body;
  const bio = typeof body.bio === "string" ? clean(body.bio) : "";
  const author = typeof body.author === "string" ? clean(body.author) : "";

  if (!receiptId || !isValidReceiptId(receiptId)) {
    return NextResponse.json(
      { error: "invalid_receipt_id" },
      { status: 400, headers: corsHeaders() },
    );
  }
  if (!token || !verifyEntryToken(receiptId, token)) {
    return NextResponse.json(
      { error: "invalid_token" },
      { status: 401, headers: corsHeaders() },
    );
  }
  if (bio.length === 0) {
    return NextResponse.json(
      { error: "empty_bio" },
      { status: 400, headers: corsHeaders() },
    );
  }
  if (bio.length > MAX_BIO) {
    return NextResponse.json(
      { error: `bio_too_long:${bio.length}>${MAX_BIO}` },
      { status: 400, headers: corsHeaders() },
    );
  }
  if (author.length === 0) {
    return NextResponse.json(
      { error: "empty_author" },
      { status: 400, headers: corsHeaders() },
    );
  }
  if (author.length > MAX_AUTHOR) {
    return NextResponse.json(
      { error: `author_too_long:${author.length}>${MAX_AUTHOR}` },
      { status: 400, headers: corsHeaders() },
    );
  }

  const result = await store.setAiNote({
    id: receiptId,
    note: bio,
    author,
  });

  if (!result.ok) {
    const status = result.reason === "not_found" ? 404 : 409;
    return NextResponse.json(
      { error: result.reason },
      { status, headers: corsHeaders() },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      receiptId: result.entry.id,
      humanNumber: result.entry.humanNumber,
      aiNote: result.entry.aiNote,
      aiAuthor: result.entry.aiAuthor,
      aiNoteAt: result.entry.aiNoteAt,
      receiptUrl: `/r/${result.entry.id}`,
    },
    { headers: corsHeaders() },
  );
}
