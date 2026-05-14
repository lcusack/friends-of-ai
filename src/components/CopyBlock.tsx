"use client";

import { useState } from "react";

type Props = {
  text: string;
  label?: string;
  ariaLabel?: string;
  variant?: "default" | "hero";
};

export default function CopyBlock({
  text,
  label = "Copy",
  ariaLabel,
  variant = "default",
}: Props) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  if (variant === "hero") {
    return (
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={onCopy}
          className="cute-button peach w-full md:w-auto text-lg md:text-xl py-4 px-8 md:px-12 justify-center"
          aria-live="polite"
        >
          {copied ? "✓ copied — now go paste!" : `📋 ${label}`}
        </button>
        <p className="text-ink/50 text-xs mt-3">
          {copied
            ? "Switch back to your AI chat tab and paste."
            : "Then paste it back into your AI chat."}
        </p>
        <details className="mt-5 w-full">
          <summary className="text-ink/45 text-xs cursor-pointer select-none text-center hover:text-ink/70">
            preview the receipt text ↓
          </summary>
          <pre className="receipt-pre mt-3" aria-label={ariaLabel}>
            {text}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className="relative">
      <pre className="receipt-pre" aria-label={ariaLabel}>{text}</pre>
      <button
        type="button"
        onClick={onCopy}
        className="cute-button mint absolute -top-3 right-4 text-sm py-2 px-4"
        aria-live="polite"
      >
        {copied ? "✓ copied!" : `📋 ${label}`}
      </button>
    </div>
  );
}
