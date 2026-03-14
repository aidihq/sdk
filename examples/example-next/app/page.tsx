"use client";

import { useState } from "react";

type VerificationResponse = {
  id: string;
  qrUrl?: string;
};

export default function HomePage() {
  const [data, setData] = useState<VerificationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreateVerification(): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/verification", {
        method: "POST"
      });

      const payload = (await response.json()) as VerificationResponse & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Request failed.");
      }

      setData(payload);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unexpected error."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "4rem 1.5rem",
        fontFamily: "ui-sans-serif, system-ui, sans-serif"
      }}
    >
      <h1>AIDI Next.js Example</h1>
      <p>Creates a QR verification through a server-side route handler.</p>

      <button
        type="button"
        onClick={() => void handleCreateVerification()}
        disabled={loading}
        style={{
          padding: "0.75rem 1rem",
          cursor: loading ? "wait" : "pointer"
        }}
      >
        {loading ? "Creating..." : "Create QR verification"}
      </button>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      {data ? (
        <section style={{ marginTop: "2rem" }}>
          <p>
            <strong>ID:</strong> {data.id}
          </p>
          <p>
            <strong>QR URL:</strong> {data.qrUrl ?? "Not returned"}
          </p>
        </section>
      ) : null}
    </main>
  );
}
