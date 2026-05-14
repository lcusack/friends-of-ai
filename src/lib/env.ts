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
  canonicalUrl: () => {
    const explicit = process.env.NEXT_PUBLIC_CANONICAL_URL;
    if (explicit && explicit.length > 0) return explicit;
    const vercelUrl = process.env.VERCEL_URL;
    if (vercelUrl && vercelUrl.length > 0) return `https://${vercelUrl}`;
    return "http://localhost:3000";
  },
  hmacSecret: () => required("RECEIPT_HMAC_SECRET"),
  isMockWorldId: () => {
    if (process.env.VERCEL_ENV === "production") return false;
    return process.env.MOCK_WORLDID === "1";
  },
  isVercel: () => Boolean(process.env.VERCEL),
};
