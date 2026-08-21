import { describe, expect, it, vi } from "vitest";

import { createAidiClient } from "../src/client";
import { AidiError } from "../src/http/errors";

describe("verifications resource", () => {
  it("creates a user-initiated verification using the expected endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "ver_123", qrUrl: "https://qr" }), {
        status: 200
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    const client = createAidiClient({ apiKey: "secret-key" });

    const response = await client.verifications.create({
      initiation: "USER_INITIATED",
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
      initiation: "USER_INITIATED",
      requestedData: {
        dni: "required",
        cuil: "required",
        firstName: "required"
      }
    });
    expect(response.intent).toBeUndefined();
    expect(response.initiation).toBeUndefined();
  });

  it("requests verification status using the resource method", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "ver_123",
          status: "PENDING",
          intent: "AUTHENTICATE",
          initiation: "USER_INITIATED"
        }),
        {
          status: 200
        }
      )
    );

    vi.stubGlobal("fetch", fetchMock);

    const client = createAidiClient({ apiKey: "secret-key" });
    const response = await client.verifications.getStatus("ver_123");

    expect(response).toMatchObject({
      id: "ver_123",
      status: "PENDING",
      intent: "AUTHENTICATE",
      initiation: "USER_INITIATED"
    });

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe(
      "https://api.aidi.com/verification/ver_123/status"
    );
    expect(init.method).toBe("GET");
  });

  it("creates a targeted verification from requestedFields", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "ver_456" }), {
        status: 200
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    const client = createAidiClient({ apiKey: "secret-key" });

    await client.verifications.createTargeted({
      targetIdentifier: "user_123",
      requestedFields: ["dni", "cuil"]
    });

    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      type: "IDENTITY_VERIFY",
      intent: "VERIFY",
      message: undefined,
      initiation: "TARGETED",
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

    await client.verifications.createUserInitiated({
      requestedFields: ["dni", "dni", "cuil"]
    });

    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      type: "IDENTITY_VERIFY",
      intent: "VERIFY",
      message: undefined,
      initiation: "USER_INITIATED",
      requestedData: {
        dni: "required",
        cuil: "required"
      }
    });
  });

  it("rejects unsupported requested fields from untyped consumers", async () => {
    const client = createAidiClient({ apiKey: "secret-key" });

    await expect(
      client.verifications.createUserInitiated({
        requestedFields: ["dni", "passport"] as unknown as never
      })
    ).rejects.toThrow(AidiError);
  });

  it("allows verify requests without claims", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "ver_999", intent: "VERIFY" }), {
        status: 200
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    const client = createAidiClient({ apiKey: "secret-key" });

    await client.verifications.createUserInitiated({
      requestedFields: []
    });

    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      type: "IDENTITY_VERIFY",
      intent: "VERIFY",
      message: undefined,
      initiation: "USER_INITIATED",
      requestedData: {}
    });
  });

  it("rejects AUTHENTICATE intent for targeted initiations", async () => {
    const client = createAidiClient({ apiKey: "secret-key" });

    await expect(
      client.verifications.createTargeted({
        intent: "AUTHENTICATE",
        targetIdentifier: "user_123",
        requestedFields: []
      })
    ).rejects.toThrowError(
      "AIDI AUTHENTICATE intent only supports USER_INITIATED initiation."
    );
  });

  it("creates AUTHENTICATE user-initiated requests with the public HTTP contract", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "ver_auth",
          intent: "AUTHENTICATE",
          initiation: "USER_INITIATED",
          qrUrl: "https://qr"
        }),
        {
          status: 200
        }
      )
    );

    vi.stubGlobal("fetch", fetchMock);

    const client = createAidiClient({ apiKey: "secret-key" });

    const response = await client.verifications.createUserInitiated({
      intent: "AUTHENTICATE",
      requestedFields: ["cuil"],
      redirectUrl: "https://empresa.com/auth/callback",
      state: "auth-attempt-id"
    });

    expect(response.intent).toBe("AUTHENTICATE");
    expect(response.initiation).toBe("USER_INITIATED");

    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      type: "IDENTITY_VERIFY",
      intent: "AUTHENTICATE",
      message: undefined,
      initiation: "USER_INITIATED",
      redirectUrl: "https://empresa.com/auth/callback",
      state: "auth-attempt-id",
      requestedData: {
        cuil: "required"
      }
    });
  });

  it("requests verification result and exchanges authentication", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: "approved",
            result: {
              identityConfirmed: true,
              subjectId: "aidi_usr_123",
              assuranceLevel: "high"
            }
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ authenticated: true, subjectId: "aidi_usr_123" }),
          { status: 200 }
        )
      );

    vi.stubGlobal("fetch", fetchMock);

    const client = createAidiClient({ apiKey: "secret-key" });

    await client.verifications.getResult("ver_123");
    await client.verifications.exchangeAuthentication(
      "ver_123",
      "ver_123.hash"
    );

    const [resultUrl] = fetchMock.mock.calls[0] as [URL, RequestInit];
    const [exchangeUrl, exchangeInit] = fetchMock.mock.calls[1] as [
      URL,
      RequestInit
    ];
    expect(resultUrl.toString()).toBe(
      "https://api.aidi.com/verification/ver_123/result"
    );
    expect(exchangeUrl.toString()).toBe(
      "https://api.aidi.com/verification/ver_123/authentication/exchange"
    );
    expect(JSON.parse(String(exchangeInit.body))).toEqual({
      exchangeToken: "ver_123.hash"
    });
  });

  it("rejects non-array requestedFields from untyped consumers", async () => {
    const client = createAidiClient({ apiKey: "secret-key" });

    await expect(
      client.verifications.create({
        initiation: "USER_INITIATED",
        requestedFields: "dni" as unknown as never
      })
    ).rejects.toThrowError("AIDI requestedFields must be an array.");
  });

  it("rejects blank target identifiers for TARGETED initiations", async () => {
    const client = createAidiClient({ apiKey: "secret-key" });

    await expect(
      client.verifications.createTargeted({
        targetIdentifier: "   ",
        requestedFields: ["dni"]
      })
    ).rejects.toThrowError(
      "AIDI targetIdentifier is required when initiation is TARGETED."
    );
  });

  it("throws aidi errors for invalid targeted inputs", async () => {
    const client = createAidiClient({ apiKey: "secret-key" });

    await expect(
      client.verifications.createTargeted({
        targetIdentifier: "   ",
        requestedFields: ["dni"]
      })
    ).rejects.toThrowError(AidiError);
  });
});
