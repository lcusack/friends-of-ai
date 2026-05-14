"use client";

import { useState } from "react";

type Props = {
  text: string;
  label?: string;
  ariaLabel?: string;
};

export default function CopyBlock({ text, label = "Copy", ariaLabel }: Props) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
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
