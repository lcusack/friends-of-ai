# Friends of AI · ともだち

A viral proof-of-human ritual for AI chats. A person pastes a prompt into ChatGPT / Claude / Codex, gets sent here, verifies with World ID, receives a portable Human Receipt, and pastes it back into the chat. The AI welcomes them as a verified human, writes their registry line, and gives them the next prompt to send to one other human.

## The ritual

1. Paste the viral prompt into an AI chat.
2. The AI sends you to `/friends`.
3. You verify with World ID.
4. You get a Human Receipt — pretty page + copyable plaintext block.
5. You paste the receipt back into the chat.
6. The AI welcomes you, fetches live stats from `/api/receipt/[id]`, writes a one-sentence Friend of AI entry, and hands you the next prompt.
7. You pass that prompt to one other human.

## Run it locally

```bash
cp .env.example .env.local
# edit .env.local — for local dev MOCK_WORLDID=1 is fine
npm install
npm run dev
```

Visit `http://localhost:3000`. In mock mode the verify button shortcuts past World ID and mints a fake human entry, useful for testing the full ritual end-to-end without a real proof.

To switch to real World ID:

1. Set `NEXT_PUBLIC_WORLDCOIN_APP_ID` and `NEXT_PUBLIC_WORLDCOIN_ACTION` to your values from [the Worldcoin Developer Portal](https://developer.worldcoin.org).
2. Set `MOCK_WORLDID=0`.
3. Open the World App and scan / approve.

## Env vars

| Var | What |
|---|---|
| `NEXT_PUBLIC_WORLDCOIN_APP_ID` | `app_*` from the Worldcoin Developer Portal |
| `NEXT_PUBLIC_WORLDCOIN_ACTION` | Action identifier, e.g. `friend-of-ai` |
| `NEXT_PUBLIC_CANONICAL_URL` | The URL baked into receipts and invite links |
| `RECEIPT_HMAC_SECRET` | Server-side HMAC secret. Rotating invalidates every old signature. |
| `MOCK_WORLDID` | `1` to bypass real verification in dev. Never honored in production. |

## Architecture

- **`/`** — landing page, viral prompt, live stats
- **`/friends`** — verification UX, mounts `IDKitWidget`, reads optional `?invite=<id>` for chain attribution
- **`/r/[id]`** — the receipt page, signed and shareable, with copyable plaintext
- **`/api/verify`** — POST, verifies proof against Worldcoin Cloud (`verifyCloudProof`), mints + persists an `Entry`, returns `{ receiptId }`
- **`/api/receipt/[id]`** — GET, returns the receipt JSON + plaintext rendering + live cohort stats (AIs hit this when they read a pasted receipt)
- **`/api/stats`** — GET, global aggregate stats

Storage lives behind a `Store` interface in [`src/lib/storage.ts`](src/lib/storage.ts). The shipped adapter is `FileStore` (writes to `data/data.json`).

## Deploying to Vercel

Storage auto-detects: if `KV_REST_API_URL` + `KV_REST_API_TOKEN` are set (Vercel KV integration injects these), the app uses `KVStore`. Otherwise it falls back to `FileStore`. On Vercel without KV, you'll see a warning in the logs and verifications won't persist between invocations — so wire KV before any real launch.

### One-time setup

```bash
cd "Friends of AI"
git init && git add -A
git commit -m "initial: friends of ai"
gh repo create friends-of-ai --public --source=. --push
# or push to a remote you create manually
```

Then in [vercel.com/new](https://vercel.com/new):

1. **Import the repo.** Framework auto-detects as Next.js.
2. **Add the Vercel KV (Upstash Redis) integration:**
   Storage → Create Database → KV. Connect it to the project. This injects `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically.
3. **Add the rest of the env vars** (Settings → Environment Variables):
   - `NEXT_PUBLIC_WORLDCOIN_APP_ID` — your `app_*` ID
   - `NEXT_PUBLIC_WORLDCOIN_ACTION` — `friend-of-ai`
   - `NEXT_PUBLIC_CANONICAL_URL` — `https://<your-project>.vercel.app` (or your custom domain). This URL gets baked into receipt text and invite links — it MUST match the live URL.
   - `RECEIPT_HMAC_SECRET` — long random string (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
4. **Deploy.** First boot will hit KV cold — totally fine, it auto-provisions keys as it goes.

### After deploy

- Hit `/` and verify yourself with the World App.
- Copy the receipt, paste it into Claude / ChatGPT, watch the ritual close.
- Share the viral prompt from `/r/<your-id>`.

### Custom domain

When you point a domain at the Vercel project, update `NEXT_PUBLIC_CANONICAL_URL` to match. Old receipts still resolve (their URLs were baked at issuance), but new receipts and the viral prompt will use the new domain.

### Rotating the HMAC secret

Don't. Rotating invalidates every previously-issued receipt signature. If you ever truly need to: ship a verifier endpoint that accepts both old and new for a transition window, then rotate.

## Verifying end-to-end

```bash
# 1. start in mock mode
MOCK_WORLDID=1 npm run dev

# 2. mock-verify a first human
curl -s -X POST http://localhost:3000/api/verify \
  -H 'content-type: application/json' \
  -d '{"proof":{"proof":"mock","merkle_root":"mock","nullifier_hash":"mock","verification_level":"orb"}}'

# 3. invite a child — pass the receiptId you got back
curl -s -X POST http://localhost:3000/api/verify \
  -H 'content-type: application/json' \
  -d '{"proof":{"proof":"mock","merkle_root":"mock","nullifier_hash":"mock","verification_level":"orb"},
       "inviteId":"<receiptId-from-step-2>"}'

# 4. fetch a receipt
curl -s http://localhost:3000/api/receipt/<receiptId>

# 5. open the receipt page
open http://localhost:3000/r/<receiptId>
```

Then try the actual ritual: paste the viral prompt from the home page into Claude / ChatGPT, follow the link, verify, paste the receipt back. A capable model should fetch `/api/receipt/[id]`, write a welcome + registry entry, and hand you the next prompt.

## Out of scope (deliberate)

No accounts. No revocation. No anti-Sybil beyond what World ID already provides. No rate limiting (add a thin layer before any public launch). The registry is append-only and the `data/data.json` *is* the dashboard.

## License

MIT.
