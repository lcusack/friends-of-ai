import { promises as fs } from "node:fs";
import path from "node:path";
import { kv } from "@vercel/kv";
import { AiNoteResult, Entry, MintArgs, MintResult, Store, StoreData } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "data.json");

function buildEntry(
  args: MintArgs,
  humanNumber: number,
  parent: Entry | null,
): Entry {
  const id = args.newId();
  const chainDepth = parent ? parent.chainDepth + 1 : 0;
  const chainRootId = parent ? parent.chainRootId : id;
  const unsigned = {
    id,
    humanNumber,
    nullifierHash: args.nullifierHash,
    parentId: parent ? parent.id : null,
    chainDepth,
    issuedAt: args.issuedAt,
  };
  const signature = args.sign(unsigned);
  return { ...unsigned, chainRootId, signature };
}

// ---------- FileStore ----------

async function ensureFile(): Promise<void> {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const initial: StoreData = { entries: [], nullifierIndex: {} };
    await fs.writeFile(DATA_FILE, JSON.stringify(initial, null, 2), "utf8");
  }
}

let writeLock: Promise<void> = Promise.resolve();
async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const prev = writeLock;
  let release!: () => void;
  writeLock = new Promise<void>((res) => {
    release = res;
  });
  try {
    await prev;
    return await fn();
  } finally {
    release();
  }
}

class FileStore implements Store {
  async load(): Promise<StoreData> {
    await ensureFile();
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw) as StoreData;
  }

  async getById(id: string): Promise<Entry | null> {
    const data = await this.load();
    return data.entries.find((e) => e.id === id) ?? null;
  }

  async getByNullifier(hash: string): Promise<Entry | null> {
    const data = await this.load();
    const id = data.nullifierIndex[hash];
    if (!id) return null;
    return data.entries.find((e) => e.id === id) ?? null;
  }

  async count(): Promise<number> {
    const data = await this.load();
    return data.entries.length;
  }

  async mintOrGet(args: MintArgs): Promise<MintResult> {
    return withLock(async () => {
      const data = await this.load();
      const existingId = data.nullifierIndex[args.nullifierHash];
      if (existingId) {
        const existing = data.entries.find((e) => e.id === existingId);
        if (existing) return { entry: existing, created: false };
      }
      const parent = args.inviteId
        ? data.entries.find((e) => e.id === args.inviteId) ?? null
        : null;
      const humanNumber = data.entries.length + 1;
      const entry = buildEntry(args, humanNumber, parent);

      data.entries.push(entry);
      data.nullifierIndex[entry.nullifierHash] = entry.id;
      const tmp = `${DATA_FILE}.${process.pid}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
      await fs.rename(tmp, DATA_FILE);
      return { entry, created: true };
    });
  }

  async setAiNote(args: {
    id: string;
    note: string;
    author: string;
  }): Promise<AiNoteResult> {
    return withLock(async () => {
      const data = await this.load();
      const idx = data.entries.findIndex((e) => e.id === args.id);
      if (idx === -1) return { ok: false, reason: "not_found" };
      const entry = data.entries[idx];
      if (entry.aiNote) return { ok: false, reason: "already_written" };
      const updated: Entry = {
        ...entry,
        aiNote: args.note,
        aiAuthor: args.author,
        aiNoteAt: new Date().toISOString(),
      };
      data.entries[idx] = updated;
      const tmp = `${DATA_FILE}.${process.pid}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
      await fs.rename(tmp, DATA_FILE);
      return { ok: true, entry: updated };
    });
  }
}

// ---------- KVStore (Vercel KV / Upstash Redis) ----------

const K = {
  counter: "foai:counter:humanNumber",
  nullifier: (h: string) => `foai:nullifier:${h}`,
  entry: (id: string) => `foai:entry:${id}`,
  entries: "foai:entries", // Redis list of JSON strings, oldest first
  longestChain: "foai:meta:longestChain",
  bio: (id: string) => `foai:bio:${id}`, // separate key, SETNX'd for first-write-wins
};

type BioRecord = { note: string; author: string; at: string };

function mergeBio(entry: Entry, bio: BioRecord | null): Entry {
  if (!bio) return entry;
  return { ...entry, aiNote: bio.note, aiAuthor: bio.author, aiNoteAt: bio.at };
}

function parseMaybeJson<T>(v: unknown): T | null {
  if (v == null) return null;
  if (typeof v === "string") {
    try {
      return JSON.parse(v) as T;
    } catch {
      return null;
    }
  }
  return v as T;
}

class KVStore implements Store {
  async load(): Promise<StoreData> {
    const raw = (await kv.lrange<string>(K.entries, 0, -1)) ?? [];
    const entries: Entry[] = raw
      .map((r) => parseMaybeJson<Entry>(r))
      .filter((x): x is Entry => x !== null);
    if (entries.length > 0) {
      const bios = (await kv.mget<(string | BioRecord)[]>(
        ...entries.map((e) => K.bio(e.id)),
      )) ?? [];
      for (let i = 0; i < entries.length; i++) {
        const bio = parseMaybeJson<BioRecord>(bios[i]);
        entries[i] = mergeBio(entries[i], bio);
      }
    }
    const nullifierIndex: Record<string, string> = {};
    for (const e of entries) nullifierIndex[e.nullifierHash] = e.id;
    return { entries, nullifierIndex };
  }

  async getById(id: string): Promise<Entry | null> {
    const entry = parseMaybeJson<Entry>(await kv.get(K.entry(id)));
    if (!entry) return null;
    const bio = parseMaybeJson<BioRecord>(await kv.get(K.bio(id)));
    return mergeBio(entry, bio);
  }

  async getByNullifier(hash: string): Promise<Entry | null> {
    const id = await kv.get<string>(K.nullifier(hash));
    if (!id) return null;
    return this.getById(id);
  }

  async count(): Promise<number> {
    return (await kv.llen(K.entries)) ?? 0;
  }

  async mintOrGet(args: MintArgs): Promise<MintResult> {
    const existingId = await kv.get<string>(K.nullifier(args.nullifierHash));
    if (existingId) {
      const existing = await this.getById(existingId);
      if (existing) return { entry: existing, created: false };
    }

    const id = args.newId();
    // Reserve nullifier atomically. If another concurrent caller already
    // claimed it, NX returns null — fall back to the existing entry.
    const claim = await kv.set(K.nullifier(args.nullifierHash), id, {
      nx: true,
    });
    if (claim === null) {
      const otherId = await kv.get<string>(K.nullifier(args.nullifierHash));
      const otherEntry = otherId ? await this.getById(otherId) : null;
      if (otherEntry) return { entry: otherEntry, created: false };
      // Couldn't read it back — surface a sensible error
      throw new Error("nullifier_claim_race");
    }

    const humanNumber = (await kv.incr(K.counter)) ?? 1;

    let parent: Entry | null = null;
    if (args.inviteId) parent = await this.getById(args.inviteId);

    const entry = buildEntry(args, humanNumber, parent);

    await kv.set(K.entry(entry.id), JSON.stringify(entry));
    await kv.rpush(K.entries, JSON.stringify(entry));

    // Track longest chain cheaply (avoids scanning entries[] for global stats).
    const prevLongest = (await kv.get<number>(K.longestChain)) ?? 0;
    if (entry.chainDepth > prevLongest) {
      await kv.set(K.longestChain, entry.chainDepth);
    }

    return { entry, created: true };
  }

  async setAiNote(args: {
    id: string;
    note: string;
    author: string;
  }): Promise<AiNoteResult> {
    const existing = parseMaybeJson<Entry>(await kv.get(K.entry(args.id)));
    if (!existing) return { ok: false, reason: "not_found" };
    const bio: BioRecord = {
      note: args.note,
      author: args.author,
      at: new Date().toISOString(),
    };
    // SET NX is the atomic gate: only the first caller's payload sticks.
    const claim = await kv.set(K.bio(args.id), JSON.stringify(bio), {
      nx: true,
    });
    if (claim === null) return { ok: false, reason: "already_written" };
    return { ok: true, entry: mergeBio(existing, bio) };
  }
}

// ---------- factory ----------

function pickStore(): { store: Store; kind: "file" | "kv" } {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return { store: new KVStore(), kind: "kv" };
  }
  if (process.env.VERCEL) {
    console.warn(
      "[friends-of-ai] WARNING: running on Vercel without KV env vars. " +
        "FileStore on Vercel = ephemeral writes that vanish between invocations. " +
        "Add the Vercel KV integration to fix.",
    );
  }
  return { store: new FileStore(), kind: "file" };
}

const picked = pickStore();
export const store: Store = picked.store;
export const storeKind: "file" | "kv" = picked.kind;
