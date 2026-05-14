import { NextResponse } from "next/server";
import { store } from "@/lib/storage";
import { computeStats } from "@/lib/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const data = await store.load();
  const stats = computeStats(data.entries);
  return NextResponse.json({
    allTimeFriendsOfAI: stats.allTime,
    humansLast24h: stats.last24h,
    longestChainEver: stats.longestChain,
  });
}
