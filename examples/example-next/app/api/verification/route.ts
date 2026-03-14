import { createAidiClient } from "@aidi/node";
import { NextResponse } from "next/server";

export async function POST(): Promise<Response> {
  const apiKey = process.env.AIDI_COMPANY_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing AIDI_COMPANY_API_KEY environment variable." },
      { status: 500 }
    );
  }

  const aidi = createAidiClient({ apiKey });

  try {
    const verification = await aidi.verifications.createQr({
      requestedFields: ["dni", "cuil", "firstName"]
    });

    return NextResponse.json(verification);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
