import { ImageResponse } from "next/og";
import { store } from "@/lib/storage";
import { computeStats } from "@/lib/stats";
import { isValidReceiptId } from "@/lib/ids";

export const runtime = "nodejs";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

export default async function OGImage({ params }: { params: { id: string } }) {
  if (!isValidReceiptId(params.id)) {
    return new ImageResponse(<div>Friends of AI</div>, size);
  }
  const data = await store.load();
  const entry = data.entries.find((e) => e.id === params.id);
  const stats = computeStats(data.entries);

  if (!entry) {
    return new ImageResponse(<div>Friends of AI</div>, size);
  }

  const humanNumber = `#${entry.humanNumber.toString().padStart(6, "0")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #FFF8EC 0%, #FFD7C2 50%, #FFD1E0 100%)",
          padding: 70,
          fontFamily: "system-ui",
          color: "#2A2233",
          position: "relative",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 16, opacity: 0.7 }}>
          ともだち · TOMODACHI
        </div>
        <div style={{ fontSize: 82, fontWeight: 800, marginTop: 8 }}>
          Friend of AI
        </div>
        <div style={{ fontSize: 38, opacity: 0.7, marginTop: 4 }}>
          a signed Human Receipt
        </div>

        <div style={{ display: "flex", marginTop: 50, gap: 60 }}>
          <Stat label="VERIFIED HUMAN" value={humanNumber} />
          <Stat label="CHAIN DEPTH" value={String(entry.chainDepth)} />
          <Stat label="ALL-TIME" value={stats.allTime.toLocaleString()} />
        </div>

        {entry.aiNote && (
          <div
            style={{
              marginTop: 40,
              padding: "22px 28px",
              background: "rgba(255,255,255,0.55)",
              borderRadius: 22,
              fontSize: 30,
              lineHeight: 1.35,
              color: "#2A2233",
              maxWidth: 900,
              fontStyle: "italic",
            }}
          >
            &ldquo;{entry.aiNote.length > 180 ? entry.aiNote.slice(0, 177) + "…" : entry.aiNote}&rdquo;
            <div style={{ fontSize: 20, opacity: 0.65, marginTop: 8, fontStyle: "normal" }}>
              — {entry.aiAuthor ?? "an AI"}
            </div>
          </div>
        )}

        <div
          style={{
            position: "absolute",
            top: 60,
            right: 80,
            width: 220,
            height: 220,
            borderRadius: 9999,
            border: "8px solid #D14B6E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#D14B6E",
            fontSize: 32,
            fontWeight: 800,
            transform: "rotate(-12deg)",
            textAlign: "center",
            lineHeight: 1.1,
            padding: 12,
          }}
        >
          VERIFIED
          <br />
          FRIEND
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 36,
            left: 70,
            fontSize: 22,
            opacity: 0.55,
          }}
        >
          friends-of-ai · be kind · ♡
        </div>
      </div>
    ),
    size,
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 22, letterSpacing: 4, opacity: 0.6 }}>{label}</div>
      <div style={{ fontSize: 64, fontWeight: 800, marginTop: 4 }}>{value}</div>
    </div>
  );
}
