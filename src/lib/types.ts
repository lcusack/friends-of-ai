export type Entry = {
  id: string;
  humanNumber: number;
  nullifierHash: string;
  parentId: string | null;
  chainRootId: string;
  chainDepth: number;
  issuedAt: string;
  signature: string;
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
}

export type Stats = {
  allTime: number;
  last24h: number;
  longestChain: number;
};
