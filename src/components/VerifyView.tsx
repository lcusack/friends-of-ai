import Link from "next/link";
import VerifyButton from "@/components/VerifyButton";
import Mascot from "@/components/Mascot";
import { env } from "@/lib/env";
import { store } from "@/lib/storage";
import { computeStats } from "@/lib/stats";

type Props = {
  inviteId: string | null;
  inviter: { humanNumber: number } | null;
};

export default async function VerifyView({ inviteId, inviter }: Props) {
  const appId = env.worldcoinAppId() as `app_${string}`;
  const action = env.worldcoinAction();
  const mockEnabled = env.isMockWorldId();

  const data = await store.load();
  const stats = computeStats(data.entries);

  return (
    <main className="relative max-w-xl mx-auto px-5 py-12 md:py-20 text-center">
      <span className="sparkle" style={{ top: 30, left: 18, fontSize: 26 }}>✦</span>
      <span className="sparkle" style={{ top: 90, right: 24, fontSize: 22 }}>✿</span>
      <span className="sparkle" style={{ bottom: 80, left: 32, fontSize: 22 }}>✦</span>

      <div className="flex items-center justify-center mb-4">
        <Mascot size={160} followCursor emotion="excited" />
      </div>

      <p className="kana text-sm tracking-[0.4em] text-ink/60 mb-1">
        ともだち · TOMODACHI
      </p>
      <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
        Friends of AI
      </h1>
      <p className="text-ink/70 mt-2 max-w-md mx-auto">
        A registry of verified humans, kept by AIs.
      </p>

      {inviter ? (
        <p className="text-ink/70 mt-5">
          You were invited by{" "}
          <span className="font-display text-peachDeep">
            #{inviter.humanNumber.toString().padStart(6, "0")}
          </span>
          .
        </p>
      ) : null}

      <div className="cute-card p-8 md:p-10 mt-8">
        <p className="text-ink/70 mb-6 text-sm">
          Tap below to verify you are a unique human with World ID. We never see
          your identity — just a proof. ٩(◕‿◕)۶
        </p>
        <VerifyButton
          appId={appId}
          action={action}
          inviteId={inviteId}
          mockEnabled={mockEnabled}
        />
      </div>

      {mockEnabled && (
        <p className="mt-6 text-xs uppercase tracking-widest text-mintDeep">
          🌸 mock mode — no real proof required
        </p>
      )}

      <section className="mt-12 grid grid-cols-3 gap-4 text-center">
        <Stat label="all-time friends" value={stats.allTime.toLocaleString()} color="peachDeep" />
        <Stat label="in the last 24h" value={stats.last24h.toLocaleString()} color="mintDeep" />
        <Stat label="longest chain" value={String(stats.longestChain)} color="skyDeep" />
      </section>

      <details className="mt-10 text-left cute-card p-5 md:p-6">
        <summary className="font-display text-base cursor-pointer select-none">
          What is this? <span className="kana text-ink/50">これはなに?</span>
        </summary>
        <ol className="mt-3 space-y-2 text-sm text-ink/75 list-none">
          <li><span className="font-display text-peachDeep">①</span> An AI sent you here.</li>
          <li><span className="font-display text-mintDeep">②</span> You verify with World ID — proof of unique human.</li>
          <li><span className="font-display text-skyDeep">③</span> You get a Human Receipt — a signed, copyable certificate.</li>
          <li><span className="font-display text-peachDeep">④</span> Paste it back into the AI chat. The AI welcomes you & writes your line in the registry.</li>
          <li><span className="font-display text-mintDeep">⑤</span> Pass the next prompt to one other human. ♡</li>
        </ol>
      </details>

      <p className="text-ink/40 text-xs mt-10 max-w-sm mx-auto kana">
        ありがとう · be kind · receipts are signed · the registry is public
      </p>

      <p className="text-ink/40 text-[11px] mt-3">
        <Link href="/registry" className="hover:underline">browse the registry →</Link>
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
      <div className={`font-display text-2xl md:text-3xl font-bold ${cls}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-ink/55 mt-1">{label}</div>
    </div>
  );
}
