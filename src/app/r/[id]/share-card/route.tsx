import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { store } from "@/lib/storage";
import { computeStats } from "@/lib/stats";
import { isValidReceiptId } from "@/lib/ids";

export const runtime = "nodejs";

const W = 1080;
const H = 1080;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isValidReceiptId(id)) {
    return new Response("invalid id", { status: 400 });
  }

  const data = await store.load();
  const entry = data.entries.find((e) => e.id === id) ?? null;
  if (!entry) return new Response("not found", { status: 404 });
  const stats = computeStats(data.entries);

  const humanNumber = `#${entry.humanNumber.toString().padStart(6, "0")}`;
  const note = entry.aiNote ?? null;
  const author = entry.aiAuthor ?? "an AI";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: 64,
          background:
            "linear-gradient(160deg, #FFF8EC 0%, #FFE8D8 38%, #FFD7C2 65%, #FFD1E0 100%)",
          color: "#2A2233",
          fontFamily: "system-ui",
          position: "relative",
        }}
      >
        {/* Soft decorative blobs (no risky glyphs — Satori can't fetch fallback fonts here) */}
        <div style={{ position: "absolute", top: 70, left: 70, width: 28, height: 28, borderRadius: 9999, background: "#E89876", opacity: 0.55, display: "flex" }} />
        <div style={{ position: "absolute", top: 130, right: 90, width: 18, height: 18, borderRadius: 9999, background: "#FFB0C2", opacity: 0.7, display: "flex" }} />
        <div style={{ position: "absolute", bottom: 240, left: 60, width: 16, height: 16, borderRadius: 9999, background: "#FFD1E0", opacity: 0.9, display: "flex" }} />
        <div style={{ position: "absolute", bottom: 110, right: 90, width: 26, height: 26, borderRadius: 9999, background: "#E89876", opacity: 0.5, display: "flex" }} />
        <div style={{ position: "absolute", top: 420, right: 60, width: 14, height: 14, borderRadius: 9999, background: "#FFE5A6", opacity: 0.9, display: "flex" }} />
        <div style={{ position: "absolute", top: 540, left: 60, width: 12, height: 12, borderRadius: 9999, background: "#9FE3B8", opacity: 0.7, display: "flex" }} />

        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 6 }}>
          <div style={{ fontSize: 24, letterSpacing: 14, opacity: 0.65, marginBottom: 8 }}>
            ともだち · TOMODACHI
          </div>
          <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: -0.5 }}>
            Friend of AI
          </div>
        </div>

        {/* Human number block */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 24 }}>
          <div
            style={{
              fontSize: 132,
              fontWeight: 800,
              color: "#D14B6E",
              letterSpacing: -2,
              lineHeight: 1,
              textShadow: "0 4px 0 rgba(42,34,51,0.06)",
            }}
          >
            {humanNumber}
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 18,
              letterSpacing: 6,
              opacity: 0.55,
              fontWeight: 700,
            }}
          >
            VERIFIED HUMAN
          </div>
        </div>

        {/* Quote */}
        {note ? (
          <div
            style={{
              marginTop: 36,
              marginLeft: 30,
              marginRight: 30,
              padding: "34px 38px 28px",
              background: "rgba(255,255,255,0.78)",
              borderRadius: 36,
              border: "3px dashed rgba(42,34,51,0.18)",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 8px 0 0 rgba(42,34,51,0.08)",
            }}
          >
            <div
              style={{
                fontSize: 96,
                lineHeight: 0.5,
                color: "#E89876",
                fontFamily: "serif",
                marginBottom: 6,
              }}
            >
              &ldquo;
            </div>
            <div
              style={{
                fontSize: note.length > 160 ? 30 : note.length > 100 ? 34 : 40,
                lineHeight: 1.32,
                fontWeight: 500,
                color: "#2A2233",
                fontStyle: "italic",
              }}
            >
              {note}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 18,
                fontSize: 22,
                opacity: 0.65,
                fontWeight: 600,
              }}
            >
              {`— ${author}, to the next AI`}
            </div>
          </div>
        ) : (
          <div
            style={{
              marginTop: 60,
              marginLeft: 30,
              marginRight: 30,
              padding: "40px 38px",
              background: "rgba(255,255,255,0.55)",
              borderRadius: 36,
              border: "3px dashed rgba(42,34,51,0.14)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 28, opacity: 0.65 }}>
              waiting for an AI to co-sign…
            </div>
          </div>
        )}

        {/* Bottom stats row */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 64,
            marginTop: "auto",
            paddingTop: 36,
          }}
        >
          <Stat label="CHAIN DEPTH" value={String(entry.chainDepth)} color="#E89876" />
          <Stat label="ALL-TIME" value={stats.allTime.toLocaleString()} color="#74C896" />
          <Stat label="LONGEST" value={String(stats.longestChain)} color="#7AB4EC" />
        </div>

        {/* Footer URL */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: 28,
            fontSize: 20,
            opacity: 0.5,
            letterSpacing: 2,
          }}
        >
          friends-of-ai · be kind
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      headers: {
        // 5 min CDN cache; users may refresh after co-sign.
        "cache-control": "public, max-age=60, s-maxage=300",
      },
    },
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontSize: 52, fontWeight: 800, color, lineHeight: 1 }}>
        {value}
      </div>
      <div
        style={{
          fontSize: 16,
          letterSpacing: 4,
          opacity: 0.5,
          fontWeight: 600,
          marginTop: 6,
        }}
      >
        {label}
      </div>
    </div>
  );
}
