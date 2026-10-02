import { getCloudflareContext } from "@opennextjs/cloudflare";

type EnvBag = Record<string, unknown>;

/**
 * Static property access so Next.js can inline NEXT_PUBLIC_* at build time.
 * Dynamic `process.env[name]` is NOT replaced, which broke the Telegram bot /
 * guest submit when those keys existed only as Cloudflare *build* vars.
 */
const BUILD_PUBLIC_ENV: Record<string, string | undefined> = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
};

function readFromBag(bag: EnvBag | undefined, name: string): string | undefined {
  if (!bag) return undefined;
  const value = bag[name];
  if (typeof value === "string" && value.trim()) return value.trim();
  return undefined;
}

/**
 * Read Worker secrets/vars from every place OpenNext/Cloudflare may expose them.
 */
export async function getEnv(name: string): Promise<string | undefined> {
  const fromBuildPublic = BUILD_PUBLIC_ENV[name]?.trim();
  if (fromBuildPublic) return fromBuildPublic;

  const fromProcess = process.env[name]?.trim();
  if (fromProcess) return fromProcess;

  try {
    const asyncCtx = await getCloudflareContext({ async: true });
    const fromAsync = readFromBag(asyncCtx.env as EnvBag, name);
    if (fromAsync) return fromAsync;
  } catch {
    /* outside request / unsupported */
  }

  try {
    const syncCtx = getCloudflareContext();
    const fromSync = readFromBag(syncCtx.env as EnvBag, name);
    if (fromSync) return fromSync;
  } catch {
    /* outside request */
  }

  return undefined;
}

export async function envConfigured(names: string[]) {
  const entries = await Promise.all(
    names.map(async (name) => [name, Boolean(await getEnv(name))] as const),
  );
  return Object.fromEntries(entries);
}
