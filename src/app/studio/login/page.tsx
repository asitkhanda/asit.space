import { LoginForm } from "./LoginForm";

export default function StudioLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <StudioLoginInner searchParams={searchParams} />
  );
}

async function StudioLoginInner({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-12">
      <div className="metal-surface w-full max-w-md rounded-[32px] p-8">
        <p className="font-pixel text-[10px] text-ink/50 mb-2">STUDIO</p>
        <h1 className="text-2xl font-semibold text-ink mb-2">asit.space</h1>
        <p className="text-sm text-ink/70 mb-6">
          Private posting. Magic link for you only.
        </p>
        {params.error === "unauthorized" ? (
          <p className="text-sm text-red-700 mb-4">
            That email is not authorized.
          </p>
        ) : null}
        <LoginForm />
      </div>
    </main>
  );
}
