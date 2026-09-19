import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Read Worker secrets/vars — process.env plus Cloudflare env binding fallback. */
export function getEnv(name: string): string | undefined {
  const fromProcess = process.env[name]?.trim();
  if (fromProcess) return fromProcess;

  try {
    const { env } = getCloudflareContext();
    const value = (env as Record<string, unknown>)[name];
    if (typeof value === "string" && value.trim()) return value.trim();
  } catch {
    // Outside request context (tests / build)
  }

  return undefined;
}
