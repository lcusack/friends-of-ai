"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  size?: number;
  className?: string;
  followCursor?: boolean;
  emotion?: "happy" | "excited" | "sleepy";
};

export default function Mascot({
  size = 160,
  className = "",
  followCursor = false,
  emotion = "happy",
}: Props) {
  const ref = useRef<SVGSVGElement | null>(null);
  const [pupil, setPupil] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!followCursor) return;
    function onMove(e: MouseEvent) {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.min(3, Math.hypot(dx, dy) / 60);
      const angle = Math.atan2(dy, dx);
      setPupil({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist });
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [followCursor]);

  const blush = (
    <>
      <ellipse cx="32" cy="62" rx="6" ry="3.5" fill="#FFB0C2" opacity="0.85" />
      <ellipse cx="68" cy="62" rx="6" ry="3.5" fill="#FFB0C2" opacity="0.85" />
    </>
  );

  const mouth =
    emotion === "excited" ? (
      <path
        d="M40 65 Q50 78 60 65"
        stroke="#2A2233"
        strokeWidth="3"
        fill="#FF9BB3"
        strokeLinecap="round"
      />
    ) : emotion === "sleepy" ? (
      <path
        d="M44 68 Q50 72 56 68"
        stroke="#2A2233"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    ) : (
      <path
        d="M42 64 Q50 72 58 64"
        stroke="#2A2233"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    );

  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`${className} animate-bounceSoft`}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="bodyGrad" cx="0.4" cy="0.35" r="0.75">
          <stop offset="0%" stopColor="#FFE2D0" />
          <stop offset="100%" stopColor="#FFB89A" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="92" rx="28" ry="4" fill="#2A2233" opacity="0.08" />
      <path
        d="M50 12
           C72 12, 86 28, 86 50
           C86 74, 70 90, 50 90
           C30 90, 14 74, 14 50
           C14 28, 28 12, 50 12 Z"
        fill="url(#bodyGrad)"
        stroke="#2A2233"
        strokeWidth="2.5"
      />
      <circle cx="50" cy="22" r="2.4" fill="#FFE5A6" />
      <circle cx="38" cy="18" r="1.4" fill="#FFE5A6" />
      <circle cx="62" cy="18" r="1.4" fill="#FFE5A6" />
      {/* eye whites */}
      <circle cx="36" cy="48" r="7" fill="white" stroke="#2A2233" strokeWidth="2" />
      <circle cx="64" cy="48" r="7" fill="white" stroke="#2A2233" strokeWidth="2" />
      {/* pupils */}
      <circle cx={36 + pupil.x} cy={48 + pupil.y} r="3.2" fill="#2A2233" />
      <circle cx={64 + pupil.x} cy={48 + pupil.y} r="3.2" fill="#2A2233" />
      <circle cx={37 + pupil.x} cy={47 + pupil.y} r="1" fill="white" />
      <circle cx={65 + pupil.x} cy={47 + pupil.y} r="1" fill="white" />
      {blush}
      {mouth}
      {/* little arms */}
      <path d="M16 60 Q10 64 14 70" stroke="#2A2233" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M84 60 Q90 64 86 70" stroke="#2A2233" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}
