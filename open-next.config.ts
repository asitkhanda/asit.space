import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Static-assets cache avoids requiring an R2 bucket for first deploy.
// Upgrade to R2 later if you need ISR/on-demand revalidation.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
