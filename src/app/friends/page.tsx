import VerifyView from "@/components/VerifyView";
import { isValidReceiptId } from "@/lib/ids";
import { store } from "@/lib/storage";

export const dynamic = "force-dynamic";

type SP = { invite?: string };

export default async function FriendsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const rawInvite = sp.invite ?? null;
  const inviteId = rawInvite && isValidReceiptId(rawInvite) ? rawInvite : null;

  let inviter: { humanNumber: number } | null = null;
  if (inviteId) {
    const e = await store.getById(inviteId);
    if (e) inviter = { humanNumber: e.humanNumber };
  }

  return <VerifyView inviteId={inviteId} inviter={inviter} />;
}
