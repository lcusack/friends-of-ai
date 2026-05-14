import Link from "next/link";
import { notFound } from "next/navigation";
import CopyBlock from "@/components/CopyBlock";
import Mascot from "@/components/Mascot";
import StampVerified from "@/components/StampVerified";
import AiNoteSubmit from "@/components/AiNoteSubmit";
import ShareCard from "@/components/ShareCard";
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

  const cosigned = Boolean(entry.aiNote);

  return (
    <main className="max-w-3xl mx-auto px-5 py-8 md:py-12">
      <Link href="/" className="text-ink/50 text-sm hover:underline">
        ← Friends of AI
      </Link>

      <header className="text-center mt-5">
        <p className="kana text-sm tracking-[0.4em] text-ink/60 mb-1">
          ともだち証明書
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold">
          You are #{humanNumber} <span className="text-peachDeep">·</span> a verified human
        </h1>
      </header>

      {!cosigned ? (
        // ─── PRE-COSIGN: lead with the big "paste it back" CTA ───
        <>
          <section className="mt-7 relative">
            <div
              className="rounded-[32px] p-7 md:p-10 relative overflow-hidden border-2"
              style={{
                background:
                  "linear-gradient(135deg, #FFE2D0 0%, #FFD1E0 55%, #FFD7C2 100%)",
                borderColor: "rgba(42,34,51,0.12)",
                boxShadow:
                  "0 10px 0 0 rgba(42,34,51,0.08), 0 3px 8px rgba(42,34,51,0.05)",
              }}
            >
              <div className="absolute -top-4 -right-4 hidden md:block opacity-90 pointer-events-none">
                <Mascot size={120} emotion="excited" />
              </div>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-ink text-cream text-[10px] font-display tracking-[0.2em] font-bold">
                  STEP 2 · OF · 3
                </span>
                <span className="text-ink/60 text-xs">
                  ✓ verified · 𝟚 co-sign · 𝟛 share
                </span>
              </div>
              <h2 className="font-display text-2xl md:text-4xl font-bold leading-tight">
                Paste this into your AI chat. ↩︎
              </h2>
              <p className="text-ink/75 mt-3 text-sm md:text-base max-w-xl">
                Tap copy, switch back to where you started, and paste it in.
                Your AI will write one short note about you. Come back here
                with their reply for Step 3.
              </p>
              <div className="mt-6">
                <CopyBlock
                  text={receiptText}
                  label="copy my receipt"
                  ariaLabel="Human Receipt text"
                  variant="hero"
                />
              </div>
            </div>
          </section>

          <section className="mt-6 cute-card p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-ink text-cream text-[10px] font-display tracking-[0.2em] font-bold">
                STEP 3 · OF · 3
              </span>
              <span className="text-ink/60 text-xs">
                add the AI&apos;s line to your receipt
              </span>
            </div>
            <h3 className="font-display text-xl md:text-2xl font-bold leading-tight">
              When your AI replies, drop it in here.
            </h3>
            <p className="text-ink/70 text-sm mt-2 mb-5 max-w-xl">
              They&apos;ll write you one sentence and tell you their model
              name. Paste both below and they go onto your receipt page +
              the public registry.
            </p>
            <AiNoteSubmit receiptId={entry.id} token={token} />
          </section>

          <section className="cute-card p-6 md:p-7 mt-8 relative overflow-hidden">
            <div className="absolute top-3 right-3 hidden md:block opacity-90">
              <StampVerified size={96} number={entry.humanNumber} />
            </div>
            <h3 className="font-display text-base mb-4 text-ink/80">Your numbers</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <Stat label="Chain depth" value={String(entry.chainDepth)} color="skyDeep" />
              <Stat label="Longest" value={String(stats.longestChain)} color="mintDeep" />
              <Stat label="All-time" value={stats.allTime.toLocaleString()} color="peachDeep" />
              <Stat label="Last 24h" value={stats.last24h.toLocaleString()} color="mintDeep" />
            </div>
            <div className="dotted-divider mt-5 mb-3" />
            <p className="text-[10px] uppercase tracking-widest text-ink/40 text-center">
              issued {issuedDate} · signature{" "}
              <span className={sigValid ? "text-mintDeep" : "text-red-500"}>
                {sigValid ? "✓ valid" : "✗ invalid"}
              </span>
            </p>
          </section>
        </>
      ) : (
        // ─── POST-COSIGN: lead with the AI quote + share card ───
        <>
          <section className="mt-7">
            <h2 className="font-display text-xl mb-3 flex items-center gap-2 text-ink/75">
              <span>✦</span> Co-signed by an AI
            </h2>
            <div className="cute-card p-7 md:p-9 text-center">
              <p className="font-display text-xl md:text-2xl leading-snug text-ink">
                &ldquo;{entry.aiNote}&rdquo;
              </p>
              <p className="mt-4 text-ink/60 text-sm">
                — <span className="font-display text-peachDeep">{entry.aiAuthor ?? "an AI"}</span>
                {entry.aiNoteAt && (
                  <>
                    {" "}·{" "}
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
            <ShareCard receiptId={entry.id} humanNumber={entry.humanNumber} />
          </section>

          <section className="cute-card p-6 md:p-7 mt-8 relative overflow-hidden">
            <div className="absolute top-3 right-3 hidden md:block opacity-90">
              <StampVerified size={96} number={entry.humanNumber} />
            </div>
            <h3 className="font-display text-base mb-4 text-ink/80">Your numbers</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <Stat label="Chain depth" value={String(entry.chainDepth)} color="skyDeep" />
              <Stat label="Longest" value={String(stats.longestChain)} color="mintDeep" />
              <Stat label="All-time" value={stats.allTime.toLocaleString()} color="peachDeep" />
              <Stat label="Your invitees" value={String(inviteeCount)} color="skyDeep" />
            </div>
            <div className="dotted-divider mt-5 mb-3" />
            <p className="text-[10px] uppercase tracking-widest text-ink/40 text-center">
              issued {issuedDate} · signature{" "}
              <span className={sigValid ? "text-mintDeep" : "text-red-500"}>
                {sigValid ? "✓ valid" : "✗ invalid"}
              </span>
            </p>
          </section>
        </>
      )}

      <section className="mt-10">
        <h2 className="font-display text-2xl mb-3 flex items-center gap-2">
          <span>♡</span> {cosigned ? "Continue the chain" : "Or invite someone right now"}
        </h2>
        <p className="text-ink/60 text-sm mb-3">
          Send this prompt to one other human. The link attributes them to your chain.
        </p>
        <CopyBlock text={nextPrompt} label="copy next prompt" ariaLabel="Next prompt for chain continuation" />
      </section>

      <Link
        href="/registry"
        className="mt-12 block cute-card p-5 md:p-6 text-left hover:translate-y-[-2px] transition-transform"
        aria-label="See your line in the public registry"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-display text-lg md:text-xl text-ink leading-tight">
              {cosigned
                ? "See your line in the public registry →"
                : "Browse the public registry →"}
            </p>
            <p className="text-ink/60 text-sm mt-1">
              {cosigned
                ? "Your AI's note is now on the page, alongside every other Friend."
                : "See what AIs have written about every verified human."}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="font-display text-2xl md:text-3xl font-bold text-peachDeep leading-none">
              {stats.allTime.toLocaleString()}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-ink/50 mt-1">
              friends
            </div>
          </div>
        </div>
      </Link>

      <div className="flex items-center justify-center mt-12 mb-4">
        <Mascot size={110} emotion="happy" />
      </div>
      <p className="text-center text-ink/40 text-sm kana">
        ありがとう · thank you for being human
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
