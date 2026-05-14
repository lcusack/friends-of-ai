import { ImageResponse } from "next/og";
import { store } from "@/lib/storage";
import { computeStats } from "@/lib/stats";
import { isValidReceiptId } from "@/lib/ids";

export const runtime = "nodejs";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

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
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform: `rotate(${rotate}deg)` }}>
      <ellipse cx="50" cy="92" rx="28" ry="4" fill="#2A2233" opacity="0.1" />
      <path d="M50 12 C72 12, 86 28, 86 50 C86 74, 70 90, 50 90 C30 90, 14 74, 14 50 C14 28, 28 12, 50 12 Z" fill="#FFC9A8" stroke="#2A2233" strokeWidth="2.6" />
      <circle cx="50" cy="22" r="2.4" fill="#FFE5A6" />
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

export default async function OGImage({ params }: { params: { id: string } }) {
  if (!isValidReceiptId(params.id)) {
    return new ImageResponse(<div>Friends of AI</div>, size);
  }
  const data = await store.load();
  const entry = data.entries.find((e) => e.id === params.id);
  if (!entry) return new ImageResponse(<div>Friends of AI</div>, size);
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
          padding: 60,
          background:
            "linear-gradient(135deg, #FFF8EC 0%, #FFE8D8 35%, #FFD7C2 65%, #FFD1E0 100%)",
          color: "#2A2233",
          fontFamily: "system-ui",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: 50, left: 60, width: 22, height: 22, borderRadius: 9999, background: "#E89876", opacity: 0.55, display: "flex" }} />
        <div style={{ position: "absolute", bottom: 60, left: 90, width: 18, height: 18, borderRadius: 9999, background: "#FFD1E0", opacity: 0.85, display: "flex" }} />

        {/* Tomo-chan in the upper-right giving a thumbs up if co-signed */}
        <div style={{ position: "absolute", top: 30, right: 40, display: "flex" }}>
          <Tomo size={140} thumbsUp={Boolean(note)} rotate={note ? -8 : 0} />
        </div>

        {/* Left: number + label */}
        <div
          style={{
            flex: "0 0 38%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: 18, letterSpacing: 10, opacity: 0.6 }}>
            ともだち · TOMODACHI
          </div>
          <div style={{ fontSize: 38, fontWeight: 800, marginTop: 6 }}>
            Friend of AI
          </div>
          <div
            style={{
              fontSize: 108,
              fontWeight: 800,
              color: "#D14B6E",
              letterSpacing: -2,
              lineHeight: 1,
              marginTop: 22,
              textShadow: "0 3px 0 rgba(42,34,51,0.06)",
            }}
          >
            {humanNumber}
          </div>
          <div
            style={{
              fontSize: 14,
              letterSpacing: 5,
              opacity: 0.55,
              fontWeight: 700,
              marginTop: 8,
            }}
          >
            VERIFIED HUMAN
          </div>
          <div
            style={{
              display: "flex",
              gap: 28,
              marginTop: 28,
              fontSize: 18,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontWeight: 800, fontSize: 26, color: "#E89876" }}>
                {entry.chainDepth}
              </div>
              <div style={{ letterSpacing: 2, opacity: 0.55, fontSize: 12 }}>
                CHAIN
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontWeight: 800, fontSize: 26, color: "#74C896" }}>
                {stats.allTime.toLocaleString()}
              </div>
              <div style={{ letterSpacing: 2, opacity: 0.55, fontSize: 12 }}>
                ALL-TIME
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontWeight: 800, fontSize: 26, color: "#7AB4EC" }}>
                {stats.longestChain}
              </div>
              <div style={{ letterSpacing: 2, opacity: 0.55, fontSize: 12 }}>
                LONGEST
              </div>
            </div>
          </div>
        </div>

        {/* Right: quote */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            marginLeft: 40,
          }}
        >
          {note ? (
            <div
              style={{
                background: "rgba(255,255,255,0.72)",
                borderRadius: 28,
                border: "3px dashed rgba(42,34,51,0.18)",
                padding: "28px 32px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  fontSize: 72,
                  lineHeight: 0.5,
                  color: "#E89876",
                  fontFamily: "serif",
                  marginBottom: 4,
                }}
              >
                &ldquo;
              </div>
              <div
                style={{
                  fontSize: note.length > 160 ? 24 : note.length > 100 ? 28 : 32,
                  lineHeight: 1.32,
                  fontWeight: 500,
                  fontStyle: "italic",
                  color: "#2A2233",
                }}
              >
                {note}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 14,
                  fontSize: 18,
                  opacity: 0.6,
                  fontWeight: 600,
                }}
              >
                {`— ${author}, to the next AI`}
              </div>
            </div>
          ) : (
            <div
              style={{
                background: "rgba(255,255,255,0.55)",
                borderRadius: 28,
                border: "3px dashed rgba(42,34,51,0.14)",
                padding: "36px 32px",
                display: "flex",
                fontSize: 24,
                opacity: 0.6,
              }}
            >
              waiting for an AI to co-sign…
            </div>
          )}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 30,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            fontSize: 16,
            opacity: 0.45,
            letterSpacing: 2,
          }}
        >
          friends-of-ai · be kind
        </div>
      </div>
    ),
    size,
  );
}
