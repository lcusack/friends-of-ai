import { Entry, Stats } from "./types";

export function computeStats(entries: Entry[]): Stats {
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  let last24h = 0;
  let longestChain = 0;
  for (const e of entries) {
    if (Date.parse(e.issuedAt) >= dayAgo) last24h += 1;
    if (e.chainDepth > longestChain) longestChain = e.chainDepth;
  }
  return {
    allTime: entries.length,
    last24h,
    longestChain,
  };
}

export function chainAncestors(entries: Entry[], id: string): Entry[] {
  const byId = new Map(entries.map((e) => [e.id, e]));
  const chain: Entry[] = [];
  let cur = byId.get(id) ?? null;
  while (cur) {
    chain.unshift(cur);
    if (!cur.parentId) break;
    cur = byId.get(cur.parentId) ?? null;
  }
  return chain;
}

export function directInviteeCount(entries: Entry[], id: string): number {
  return entries.filter((e) => e.parentId === id).length;
}
