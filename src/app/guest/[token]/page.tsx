import Link from "next/link";
import { getInviteByToken } from "@/lib/guests";
import { GuestEntryForm } from "@/components/guest/GuestEntryForm";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function GuestInvitePage({ params }: Props) {
  const { token } = await params;
  const invite = await getInviteByToken(token);
  const remaining =
    invite != null ? Math.max(0, invite.max_uses - invite.use_count) : 0;
  const isOpen = invite != null && remaining > 0;

  return (
    <main className="min-h-dvh bg-[#e8e4dc] px-4 pb-10 pt-24 text-black md:px-8 md:pb-14 md:pt-28">
      <div className="mx-auto mb-8 flex max-w-2xl items-center justify-end">
        <Link href="/postcards" className="text-sm text-black/50 hover:text-black">
          Gallery
        </Link>
      </div>

      {!invite ? (
        <div className="mx-auto max-w-md rounded-[28px] bg-white p-8 text-center shadow-[0_24px_60px_rgba(0,0,0,0.12)]">
          <h1 className="text-2xl font-semibold">Invite not found</h1>
          <p className="mt-2 text-sm text-black/55">
            This QR code isn’t valid. Ask Asit for a fresh postcard.
          </p>
        </div>
      ) : !isOpen ? (
        <div className="mx-auto max-w-md rounded-[28px] bg-white p-8 text-center shadow-[0_24px_60px_rgba(0,0,0,0.12)]">
          <h1 className="text-2xl font-semibold">Batch is full</h1>
          <p className="mt-2 text-sm text-black/55">
            This shared postcard QR already collected its {invite.max_uses}{" "}
            {invite.max_uses === 1 ? "mark" : "marks"}.
          </p>
          <Link
            href="/postcards"
            className="mt-6 inline-flex rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white"
          >
            See the wall
          </Link>
        </div>
      ) : (
        <GuestEntryForm token={invite.token} />
      )}
    </main>
  );
}
