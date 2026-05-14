function required(name: string): string {
  const v = process.env[name];
  if (!v || v.length === 0) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

function optional(name: string, fallback: string): string {
  const v = process.env[name];
  return v && v.length > 0 ? v : fallback;
}

export const env = {
  worldcoinAppId: () => required("NEXT_PUBLIC_WORLDCOIN_APP_ID"),
  worldcoinAction: () => required("NEXT_PUBLIC_WORLDCOIN_ACTION"),
  canonicalUrl: () => optional("NEXT_PUBLIC_CANONICAL_URL", "http://localhost:3000"),
  hmacSecret: () => required("RECEIPT_HMAC_SECRET"),
  isMockWorldId: () => {
    if (process.env.VERCEL_ENV === "production") return false;
    return process.env.MOCK_WORLDID === "1";
  },
  isVercel: () => Boolean(process.env.VERCEL),
};
