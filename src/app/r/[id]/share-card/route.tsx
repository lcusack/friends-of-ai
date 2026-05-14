import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { store } from "@/lib/storage";
import { computeStats } from "@/lib/stats";
import { isValidReceiptId } from "@/lib/ids";

export const runtime = "nodejs";

const W = 1080;
const H = 1080;

// Inline Tomo-chan mascot SVG with one arm raised in a thumbs-up.
// Simplified for Satori: no <defs>/<radialGradient>/fragments — just
// raw primitives with solid fills and explicit groups.
function Tomo({ size, thumbsUp = true, rotate = -8 }: {
  size: number;
  thumbsUp?: boolean;
  rotate?: number;
}) {
  const arms = thumbsUp
    ? [
        <path key="rarm" d="M84 58 Q92 48 90 38" stroke="#2A2233" strokeWidth="2.6" fill="none" strokeLinecap="round" />,
        <circle key="fist" cx="90" cy="34" r="5.5" fill="#FFD7C2" stroke="#2A2233" strokeWidth="2" />,
        <path key="thumb" d="M90 29 L90 22" stroke="#2A2233" strokeWidth="2.6" fill="none" strokeLinecap="round" />,
      ]
    : [
        <path key="rarm" d="M84 60 Q90 64 86 70" stroke="#2A2233" strokeWidth="2.6" fill="none" strokeLinecap="round" />,
      ];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <ellipse cx="50" cy="92" rx="28" ry="4" fill="#2A2233" opacity="0.1" />
      <path
        d="M50 12 C72 12, 86 28, 86 50 C86 74, 70 90, 50 90 C30 90, 14 74, 14 50 C14 28, 28 12, 50 12 Z"
        fill="#FFC9A8"
        stroke="#2A2233"
        strokeWidth="2.6"
      />
      <circle cx="50" cy="22" r="2.4" fill="#FFE5A6" />
      <circle cx="38" cy="18" r="1.4" fill="#FFE5A6" />
      <circle cx="62" cy="18" r="1.4" fill="#FFE5A6" />
      <circle cx="36" cy="48" r="7" fill="white" stroke="#2A2233" strokeWidth="2" />
      <circle cx="64" cy="48" r="7" fill="white" stroke="#2A2233" strokeWidth="2" />
      <circle cx="36" cy="48" r="3.2" fill="#2A2233" />
      <circle cx="64" cy="48" r="3.2" fill="#2A2233" />
      <circle cx="37" cy="47" r="1" fill="white" />
      <circle cx="65" cy="47" r="1" fill="white" />
      <ellipse cx="32" cy="62" rx="6" ry="3.5" fill="#FFB0C2" opacity="0.85" />
      <ellipse cx="68" cy="62" rx="6" ry="3.5" fill="#FFB0C2" opacity="0.85" />
      <path d="M40 64 Q50 76 60 64" stroke="#2A2233" strokeWidth="3" fill="#FF9BB3" strokeLinecap="round" />
      <path d="M16 60 Q10 64 14 70" stroke="#2A2233" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      {arms}
    </svg>
  );
}

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
        <div style={{ position: "absolute", bottom: 240, left: 60, width: 16, height: 16, borderRadius: 9999, background: "#FFD1E0", opacity: 0.9, display: "flex" }} />
        <div style={{ position: "absolute", bottom: 110, right: 90, width: 26, height: 26, borderRadius: 9999, background: "#E89876", opacity: 0.5, display: "flex" }} />
        <div style={{ position: "absolute", top: 540, left: 60, width: 12, height: 12, borderRadius: 9999, background: "#9FE3B8", opacity: 0.7, display: "flex" }} />

        {/* Tomo-chan, top-right corner, giving thumbs up if co-signed */}
        <div
          style={{
            position: "absolute",
            top: 56,
            right: 56,
            display: "flex",
          }}
        >
          <Tomo size={170} thumbsUp={Boolean(note)} rotate={note ? -8 : 0} />
        </div>

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
