export type PersonInput = {
  name: string;
  twitter_handle: string | null;
  linkedin_url: string | null;
};

/**
 * One person per line:
 *   Name
 *   Name | @twitter
 *   Name | @twitter | https://linkedin.com/in/...
 * Pipe-separated fields; twitter/linkedin optional.
 */
export function parsePeopleLines(text: string): PersonInput[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|").map((p) => p.trim());
      const name = parts[0] ?? "";
      let twitter: string | null = null;
      let linkedin: string | null = null;

      for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        if (!part) continue;
        if (/^https?:\/\//i.test(part) || /linkedin\.com/i.test(part)) {
          linkedin = part;
        } else if (part.startsWith("@") || !twitter) {
          twitter = part.replace(/^@/, "");
        }
      }

      return {
        name,
        twitter_handle: twitter || null,
        linkedin_url: linkedin || null,
      };
    })
    .filter((p) => p.name.length > 0);
}
