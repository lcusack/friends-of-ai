"use client";

import { useEffect, useState } from "react";

type Piece = {
  id: number;
  left: number;
  delay: number;
  rotate: number;
  color: string;
  shape: "circle" | "square" | "star";
};

const COLORS = ["#FFB89A", "#9FE3B8", "#A6D2FF", "#FFE5A6", "#FFD1E0"];

export default function Confetti({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (!active) return;
    const next: Piece[] = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      rotate: Math.random() * 360,
      color: COLORS[i % COLORS.length],
      shape: (["circle", "square", "star"] as const)[i % 3],
    }));
    setPieces(next);
    const t = setTimeout(() => setPieces([]), 3200);
    return () => clearTimeout(t);
  }, [active]);

  if (pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: "absolute",
            top: "-20px",
            left: `${p.left}%`,
            width: p.shape === "star" ? "14px" : "10px",
            height: p.shape === "star" ? "14px" : "10px",
            background: p.shape === "circle" ? p.color : "transparent",
            borderRadius: p.shape === "circle" ? "50%" : "2px",
            backgroundColor: p.shape !== "star" ? p.color : "transparent",
            transform: `rotate(${p.rotate}deg)`,
            animation: `fall 2.6s ${p.delay}s ease-in forwards`,
            color: p.color,
            fontSize: "16px",
            lineHeight: "1",
          }}
        >
          {p.shape === "star" ? "✦" : ""}
        </span>
      ))}
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
