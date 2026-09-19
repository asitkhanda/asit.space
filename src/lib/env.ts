import { getCloudflareContext } from "@opennextjs/cloudflare";

type EnvBag = Record<string, unknown>;

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
