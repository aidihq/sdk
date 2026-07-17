import { describe, expect, it, vi } from "vitest";

import { createAidiClient } from "../src/client";
import { AidiError } from "../src/http/errors";

describe("verifications resource", () => {
  it("creates a QR verification using the expected endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "ver_123", qrUrl: "https://qr" }), {
        status: 200
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    const client = createAidiClient({ apiKey: "secret-key" });

    const response = await client.verifications.create({
      flowMode: "QR",
      requestedFields: ["dni", "cuil", "firstName"]
    });

    expect(response.id).toBe("ver_123");

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("https://api.aidi.com/verification");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      type: "IDENTITY_VERIFY",
      intent: "VERIFY",
      message: undefined,
      flowMode: "QR",
      requestedData: {
        dni: "required",
        cuil: "required",
        firstName: "required"
      }
    });
  });

  it("requests verification status using the resource method", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "ver_123", status: "PENDING" }), {
        status: 200
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    const client = createAidiClient({ apiKey: "secret-key" });
    const response = await client.verifications.getStatus("ver_123");

    expect(response).toMatchObject({
      id: "ver_123",
      status: "PENDING"
    });

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("https://api.aidi.com/verification/ver_123/status");
    expect(init.method).toBe("GET");
  });

  it("creates a DIRECT verification from requestedFields", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "ver_456" }), {
        status: 200
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    const client = createAidiClient({ apiKey: "secret-key" });

    await client.verifications.createDirect({
      targetIdentifier: "user_123",
      requestedFields: ["dni", "cuil"]
    });

    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      type: "IDENTITY_VERIFY",
      intent: "VERIFY",
      message: undefined,
      flowMode: "DIRECT",
      targetIdentifier: "user_123",
      requestedData: {
        dni: "required",
        cuil: "required"
      }
    });
  });

  it("deduplicates requested fields before serializing", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "ver_789" }), {
        status: 200
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    const client = createAidiClient({ apiKey: "secret-key" });

    await client.verifications.createQr({
      requestedFields: ["dni", "dni", "cuil"]
    });

    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      type: "IDENTITY_VERIFY",
      intent: "VERIFY",
      message: undefined,
      flowMode: "QR",
      requestedData: {
        dni: "required",
        cuil: "required"
      }
    });
  });

  it("rejects unsupported requested fields from untyped consumers", () => {
    const client = createAidiClient({ apiKey: "secret-key" });

    expect(() =>
      client.verifications.createQr({
        requestedFields: ["dni", "passport"] as unknown as never
      })
    ).toThrow(AidiError);
  });

  it("allows verify requests without claims", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "ver_999", intent: "VERIFY" }), {
        status: 200
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    const client = createAidiClient({ apiKey: "secret-key" });

    await client.verifications.createQr({
      requestedFields: []
    });

    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      type: "IDENTITY_VERIFY",
      intent: "VERIFY",
      message: undefined,
      flowMode: "QR",
      requestedData: {}
    });
  });

  it("rejects LOGIN intent for direct flows", () => {
    const client = createAidiClient({ apiKey: "secret-key" });

    expect(() =>
      client.verifications.createDirect({
        intent: "LOGIN",
        targetIdentifier: "user_123",
        requestedFields: []
      })
    ).toThrowError("AIDI LOGIN intent only supports QR flow.");
  });

  it("requests verification result and exchanges login", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: "approved", result: { identityConfirmed: true, subjectId: "aidi_usr_123", assuranceLevel: "high" } }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ authenticated: true, subjectId: "aidi_usr_123" }), { status: 200 })
      );

    vi.stubGlobal("fetch", fetchMock);

    const client = createAidiClient({ apiKey: "secret-key" });

    await client.verifications.getResult("ver_123");
    await client.verifications.exchangeLogin("ver_123", "ver_123.hash");

    const [resultUrl] = fetchMock.mock.calls[0] as [URL, RequestInit];
    const [exchangeUrl, exchangeInit] = fetchMock.mock.calls[1] as [URL, RequestInit];
    expect(resultUrl.toString()).toBe("https://api.aidi.com/verification/ver_123/result");
    expect(exchangeUrl.toString()).toBe("https://api.aidi.com/verification/ver_123/login/exchange");
    expect(JSON.parse(String(exchangeInit.body))).toEqual({
      exchangeToken: "ver_123.hash"
    });
  });

  it("rejects non-array requestedFields from untyped consumers", () => {
    const client = createAidiClient({ apiKey: "secret-key" });

    expect(() =>
      client.verifications.create({
        flowMode: "QR",
        requestedFields: "dni" as unknown as never
      })
    ).toThrowError(
      "AIDI requestedFields must be an array."
    );
  });

  it("rejects blank target identifiers for DIRECT flows", () => {
    const client = createAidiClient({ apiKey: "secret-key" });

    expect(() =>
      client.verifications.createDirect({
        targetIdentifier: "   ",
        requestedFields: ["dni"]
      })
    ).toThrowError(
      "AIDI targetIdentifier is required when flowMode is DIRECT."
    );
  });

  it("throws aidi errors for invalid direct inputs", () => {
    const client = createAidiClient({ apiKey: "secret-key" });

    expect(() =>
      client.verifications.createDirect({
        targetIdentifier: "   ",
        requestedFields: ["dni"]
      })
    ).toThrowError(AidiError);
  });
});
