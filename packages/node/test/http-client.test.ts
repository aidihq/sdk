import { afterEach, describe, expect, it, vi } from "vitest";

import { HttpClient } from "../src/http/http-client";
import { AidiTimeoutError } from "../src/http/errors";

describe("HttpClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("serializes JSON requests and parses JSON responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "ver_123", qrUrl: "https://qr" }), {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    const client = new HttpClient({ apiKey: "secret-key" });
    const response = await client.request<{ id: string; qrUrl: string }>(
      "/verification",
      {
        method: "POST",
        body: {
          type: "IDENTITY_VERIFY",
          flowMode: "QR",
          requestedData: {
            dni: "required"
          }
        }
      }
    );

    expect(response).toEqual({ id: "ver_123", qrUrl: "https://qr" });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("https://api.aidi.com/verification");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({
      type: "IDENTITY_VERIFY",
      flowMode: "QR",
      requestedData: {
        dni: "required"
      }
    }));

    const headers = new Headers(init.headers);
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(headers.get("x-company-token")).toBe("secret-key");
  });

  it("throws a typed http error for non-ok responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "invalid request" }), {
          status: 422,
          statusText: "Unprocessable Entity",
          headers: {
            "Content-Type": "application/json"
          }
        })
      )
    );

    const client = new HttpClient({ apiKey: "secret-key" });

    await expect(client.request("/verification")).rejects.toMatchObject({
      name: "AidiHttpError",
      status: 422,
      statusText: "Unprocessable Entity",
      body: {
        error: "invalid request"
      }
    });
  });

  it("throws a timeout error when fetch is aborted", async () => {
    vi.useFakeTimers();

    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_input: URL, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => {
              reject(new DOMException("The operation was aborted.", "AbortError"));
            });
          })
      )
    );

    const client = new HttpClient({ apiKey: "secret-key" });
    const requestPromise = client.request("/verification", { timeoutMs: 50 });
    const assertion = expect(requestPromise).rejects.toBeInstanceOf(
      AidiTimeoutError
    );

    await vi.advanceTimersByTimeAsync(60);

    await assertion;
    vi.useRealTimers();
  });
});
