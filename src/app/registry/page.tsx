import Link from "next/link";
import Mascot from "@/components/Mascot";
import { store } from "@/lib/storage";
import { computeStats } from "@/lib/stats";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PAGE_SIZE = 50;

type Params = { p?: string };

export default async function RegistryPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.p ?? "1", 10) || 1);

  const data = await store.load();
  const stats = computeStats(data.entries);

  const sorted = [...data.entries].sort((a, b) => b.humanNumber - a.humanNumber);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const rows = sorted.slice(start, start + PAGE_SIZE);

  return (
    <main className="max-w-3xl mx-auto px-5 py-12 md:py-16">
      <Link href="/" className="text-ink/50 text-sm hover:underline">
        ← Friends of AI
      </Link>

      <header className="text-center mt-6 mb-10">
        <p className="kana text-sm tracking-[0.4em] text-ink/60 mb-1">
          ともだち · REGISTRY
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-bold">
          The Registry
        </h1>
        <p className="text-ink/60 mt-2">
          Every verified human, in order. Public by design.
        </p>
      </header>

      <section className="cute-card p-6 md:p-8 mb-10 grid grid-cols-3 gap-4 text-center">
        <Stat label="all-time friends" value={stats.allTime.toLocaleString()} color="peachDeep" />
        <Stat label="last 24h" value={stats.last24h.toLocaleString()} color="mintDeep" />
        <Stat label="longest chain" value={String(stats.longestChain)} color="skyDeep" />
      </section>

      {total === 0 ? (
        <div className="cute-card p-10 text-center">
          <div className="flex justify-center mb-4">
            <Mascot size={120} emotion="sleepy" />
          </div>
          <p className="font-display text-xl">No friends yet…</p>
          <p className="text-ink/60 text-sm mt-2">Be the first ✦</p>
          <Link href="/" className="cute-button peach text-sm mt-6 inline-flex">
            verify with World ID →
          </Link>
        </div>
      ) : (
        <div className="cute-card p-2">
          <ul>
            {rows.map((e) => {
              const num = e.humanNumber.toString().padStart(6, "0");
              const date = new Date(e.issuedAt).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              });
              const colorClass =
                e.chainDepth === 0
                  ? "bg-cream"
                  : e.chainDepth === 1
                  ? "bg-peach/40"
                  : e.chainDepth === 2
                  ? "bg-sky/40"
                  : "bg-mint/40";
              return (
                <li key={e.id} className="border-b border-ink/5 last:border-0">
                  <Link
                    href={`/r/${e.id}`}
                    className={`flex items-center justify-between gap-3 p-4 rounded-2xl hover:${colorClass} transition`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-display text-lg text-peachDeep min-w-[80px]">
                        #{num}
                      </span>
                      {e.chainDepth > 0 && (
                        <span className="text-xs text-ink/50 font-mono">
                          ↳ {e.chainDepth} deep
                        </span>
                      )}
                    </div>
                    <span className="text-ink/50 text-xs tabular-nums hidden md:inline">
                      {date}
                    </span>
                    <span className="text-ink/30 text-xs font-mono">
                      {e.id}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-2 text-sm">
          {page > 1 && (
            <Link
              href={`/registry?p=${page - 1}`}
              className="cute-button mint text-sm py-2 px-4"
            >
              ← newer
            </Link>
          )}
          <span className="text-ink/60 px-3">
            page {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/registry?p=${page + 1}`}
              className="cute-button sky text-sm py-2 px-4"
            >
              older →
            </Link>
          )}
        </nav>
      )}

      <p className="text-center text-ink/40 text-xs mt-12 kana">
        ありがとう · this list updates live
      </p>
    </main>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "peachDeep" | "mintDeep" | "skyDeep";
}) {
  const cls =
    color === "peachDeep"
      ? "text-peachDeep"
      : color === "mintDeep"
      ? "text-mintDeep"
      : "text-skyDeep";
  return (
    <div>
      <div className={`font-display text-3xl md:text-4xl font-bold ${cls}`}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-widest text-ink/55 mt-1">
        {label}
      </div>
    </div>
  );
}
