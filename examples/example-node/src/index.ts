import "dotenv/config";

import { createAidiClient } from "@aidi/node";

const apiKey = process.env.AIDI_COMPANY_API_KEY;

if (!apiKey) {
  throw new Error("Missing AIDI_COMPANY_API_KEY environment variable.");
}

const aidi = createAidiClient({ apiKey });

async function main(): Promise<void> {
  const verification = await aidi.verifications.createQr({
    requestedFields: ["dni", "cuil", "firstName"]
  });

  console.log("Verification created:", verification);

  const status = await aidi.verifications.getStatus(verification.id);
  console.log("Verification status:", status);
}

void main();
