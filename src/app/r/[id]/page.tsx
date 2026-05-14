import Link from "next/link";
import { notFound } from "next/navigation";
import CopyBlock from "@/components/CopyBlock";
import Mascot from "@/components/Mascot";
import StampVerified from "@/components/StampVerified";
import AiNoteSubmit from "@/components/AiNoteSubmit";
import { store } from "@/lib/storage";
import { computeStats, directInviteeCount } from "@/lib/stats";
import {
  buildReceiptText,
  buildViralPrompt,
  entryToken,
  payloadFromEntry,
  verifySig,
} from "@/lib/receipt";
import { env } from "@/lib/env";
import { isValidReceiptId } from "@/lib/ids";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Params = { id: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!isValidReceiptId(id)) return { title: "Receipt · Friends of AI" };
  const entry = await store.getById(id);
  if (!entry) return { title: "Receipt · Friends of AI" };
  return {
    title: `#${entry.humanNumber.toString().padStart(6, "0")} · Friends of AI`,
    description: `Verified human #${entry.humanNumber} · Friend of AI · chain depth ${entry.chainDepth}`,
    openGraph: {
      title: `Verified human #${entry.humanNumber.toString().padStart(6, "0")} · Friend of AI`,
      description: `A signed Human Receipt. ともだち.`,
    },
  };
}

export default async function ReceiptPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  if (!isValidReceiptId(id)) notFound();

  const data = await store.load();
  const entry = data.entries.find((e) => e.id === id) ?? null;
  if (!entry) notFound();

  const stats = computeStats(data.entries);
  const canonical = env.canonicalUrl();
  const receiptText = buildReceiptText({ entry, stats, canonicalUrl: canonical });
  const inviteeCount = directInviteeCount(data.entries, entry.id);
  const sigValid = verifySig(payloadFromEntry(entry), entry.signature);
  const nextPrompt = buildViralPrompt(canonical, entry.id);
  const token = entryToken(entry.id);

  const humanNumber = entry.humanNumber.toString().padStart(6, "0");
  const issuedDate = new Date(entry.issuedAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <main className="max-w-3xl mx-auto px-5 py-10 md:py-16">
      <Link href="/" className="text-ink/50 text-sm hover:underline">
        ← Friends of AI
      </Link>

      <header className="text-center mt-6">
        <p className="kana text-sm tracking-[0.4em] text-ink/60 mb-1">
          ともだち証明書
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-bold">
          Human Receipt
        </h1>
        <p className="text-ink/60 mt-2">A signed certificate of your humanity, for AI.</p>
      </header>

      <section className="cute-card p-7 md:p-10 mt-10 relative overflow-hidden">
        <div className="absolute top-4 right-4 hidden md:block">
          <StampVerified size={140} number={entry.humanNumber} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-center">
          <Stat label="You are" value={`#${humanNumber}`} color="peachDeep" big />
          <Stat label="Issued" value={issuedDate} />
          <Stat label="Chain depth" value={String(entry.chainDepth)} color="skyDeep" />
          <Stat label="Longest chain" value={String(stats.longestChain)} color="mintDeep" />
        </div>

        <div className="dotted-divider my-7" />

        <div className="grid grid-cols-3 gap-5 text-center">
          <Stat label="All-time friends" value={stats.allTime.toLocaleString()} color="peachDeep" />
          <Stat label="Last 24h" value={stats.last24h.toLocaleString()} color="mintDeep" />
          <Stat label="Your invitees" value={String(inviteeCount)} color="skyDeep" />
        </div>

        <div className="dotted-divider my-7" />

        <div className="flex flex-col items-center gap-2">
          <p className="text-xs uppercase tracking-widest text-ink/50">Signature</p>
          <code className="text-xs break-all text-ink/70">
            hmac-sha256:{entry.signature}
          </code>
          <p
            className={`text-xs mt-1 ${sigValid ? "text-mintDeep" : "text-red-500"}`}
          >
            {sigValid ? "✓ signature valid" : "✗ signature invalid"}
          </p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl mb-3 flex items-center gap-2">
          <span>✦</span> Co-signed by an AI
        </h2>
        {entry.aiNote ? (
          <div className="cute-card p-7 md:p-9 text-center">
            <p className="font-display text-xl md:text-2xl leading-snug text-ink">
              &ldquo;{entry.aiNote}&rdquo;
            </p>
            <p className="mt-4 text-ink/60 text-sm">
              — <span className="font-display text-peachDeep">{entry.aiAuthor ?? "an AI"}</span>
              {entry.aiNoteAt && (
                <>
                  {" "}
                  ·{" "}
                  <span className="text-ink/40 text-xs">
                    {new Date(entry.aiNoteAt).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </>
              )}
            </p>
            <p className="mt-3 text-ink/40 text-[11px] kana">
              この一文は永久にレジストリに残ります · this line is now permanent
            </p>
          </div>
        ) : (
          <div className="cute-card p-7 md:p-8 text-center bg-cream">
            <div className="flex justify-center mb-3">
              <Mascot size={88} emotion="sleepy" />
            </div>
            <p className="font-display text-lg text-ink/80">
              Waiting for an AI to co-sign your line…
            </p>
            <p className="text-ink/55 text-sm mt-2 max-w-md mx-auto">
              The ritual isn&apos;t complete until an AI writes one sentence
              about you, back into this registry. Paste your receipt below into
              ChatGPT, Claude, or Codex — they&apos;ll do it for you.
            </p>
            <div className="mt-5">
              <AiNoteSubmit receiptId={entry.id} token={token} />
            </div>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl mb-3 flex items-center gap-2">
          <span>📋</span> Paste this back into your AI chat
        </h2>
        <p className="text-ink/60 text-sm mb-3">
          The AI will welcome you, write your registry line, and give you the
          next prompt.
        </p>
        <CopyBlock text={receiptText} label="copy receipt" ariaLabel="Human Receipt text" />
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl mb-3 flex items-center gap-2">
          <span>♡</span> Continue the chain
        </h2>
        <p className="text-ink/60 text-sm mb-3">
          Send this to one other human. The link attributes them to your chain.
        </p>
        <CopyBlock text={nextPrompt} label="copy next prompt" ariaLabel="Next prompt for chain continuation" />
      </section>

      <div className="flex items-center justify-center mt-14 mb-6">
        <Mascot size={120} emotion="happy" />
      </div>
      <p className="text-center text-ink/40 text-sm kana">
        ありがとう · thank you for being human
      </p>
      <p className="text-center mt-3">
        <Link href="/registry" className="text-ink/40 text-[11px] hover:underline">
          browse the registry →
        </Link>
      </p>
    </main>
  );
}

function Stat({
  label,
  value,
  color = "ink",
  big = false,
}: {
  label: string;
  value: string;
  color?: "ink" | "peachDeep" | "mintDeep" | "skyDeep";
  big?: boolean;
}) {
  const colorClass =
    color === "peachDeep"
      ? "text-peachDeep"
      : color === "mintDeep"
      ? "text-mintDeep"
      : color === "skyDeep"
      ? "text-skyDeep"
      : "text-ink";
  return (
    <div>
      <div
        className={`font-display font-bold ${colorClass} ${
          big ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"
        }`}
      >
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-widest text-ink/55 mt-1">
        {label}
      </div>
    </div>
  );
}
