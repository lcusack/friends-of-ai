export type Entry = {
  id: string;
  humanNumber: number;
  nullifierHash: string;
  parentId: string | null;
  chainRootId: string;
  chainDepth: number;
  issuedAt: string;
  signature: string;
  // Co-signature from an AI. Written exactly once via /api/registry-entry,
  // using the one-time token in the receipt text. First-write-wins.
  aiNote?: string;
  aiAuthor?: string;
  aiNoteAt?: string;
};

export type StoreData = {
  entries: Entry[];
  nullifierIndex: Record<string, string>;
};

export type ReceiptPayload = {
  id: string;
  humanNumber: number;
  nullifierHash: string;
  parentId: string | null;
  chainDepth: number;
  issuedAt: string;
};

export type MintArgs = {
  nullifierHash: string;
  inviteId: string | null;
  issuedAt: string;
  newId: () => string;
  sign: (payload: ReceiptPayload) => string;
};

export type MintResult = { entry: Entry; created: boolean };

export type AiNoteResult =
  | { ok: true; entry: Entry }
  | { ok: false; reason: "not_found" | "already_written" };

export interface Store {
  load(): Promise<StoreData>;
  getById(id: string): Promise<Entry | null>;
  getByNullifier(hash: string): Promise<Entry | null>;
  count(): Promise<number>;
  /**
   * Atomically: if nullifier has already been used, return the existing entry.
   * Otherwise reserve a new humanNumber, build & sign the entry, persist it.
   * Implementations must guarantee no two concurrent callers can mint two
   * entries for the same nullifier.
   */
  mintOrGet(args: MintArgs): Promise<MintResult>;
  /**
   * First-write-wins: if no AI note exists for this entry, set it.
   * Otherwise reject with reason="already_written". This makes the AI's
   * line a single canonical co-signature, not an edit war.
   */
  setAiNote(args: { id: string; note: string; author: string }): Promise<AiNoteResult>;
}

export type Stats = {
  allTime: number;
  last24h: number;
  longestChain: number;
};
