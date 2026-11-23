import { describeLinkedInTokenFailure, inspectLinkedInAccessToken } from "@/lib/linkedin-token";

async function main(): Promise<void> {
  const inspection = await inspectLinkedInAccessToken(process.env.LINKEDIN_ACCESS_TOKEN);
  if (inspection.warning) {
    console.warn(inspection.warning);
  }
  if (inspection.ok) {
    console.log("LinkedIn access token is usable.");
    return;
  }

  console.error(describeLinkedInTokenFailure(inspection.reason ?? "invalid"));
  process.exit(inspection.reason === "missing" ? 2 : 1);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "LinkedIn token check failed";
  console.error(message.replace(/Bearer\s+\S+/gi, "Bearer [redacted]"));
  process.exit(1);
});
