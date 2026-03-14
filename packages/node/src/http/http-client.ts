import type { AidiClientConfig } from "../types";

import { BASE_URL, DEFAULT_TIMEOUT_MS } from "../constants";
import { AidiError, AidiHttpError, AidiTimeoutError } from "./errors";
import { buildClientHeaders } from "./headers";

export interface HttpRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: HeadersInit;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export class HttpClient {
  private readonly apiKey: string;

  constructor(config: AidiClientConfig) {
    this.apiKey = config.apiKey;
  }

  async request<T>(path: string, options: HttpRequestOptions = {}): Promise<T> {
    const method = options.method ?? "GET";
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const controller = new AbortController();
    let didTimeout = false;
    const handleTimeout = () => {
      didTimeout = true;
      controller.abort();
    };
    const effectiveTimeoutId = setTimeout(handleTimeout, timeoutMs);

    if (options.signal) {
      if (options.signal.aborted) {
        controller.abort();
      } else {
        options.signal.addEventListener("abort", () => controller.abort(), {
          once: true
        });
      }
    }

    const headers = buildClientHeaders(this.apiKey, options.headers);

    if (options.body !== undefined && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    try {
      const response = await fetch(new URL(path, BASE_URL), {
        method,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal
      });

      const responseBody = await parseResponseBody(response);

      if (!response.ok) {
        throw new AidiHttpError(
          `AIDI request failed with status ${response.status} ${response.statusText}.`,
          {
            status: response.status,
            statusText: response.statusText,
            body: responseBody,
            responseHeaders: response.headers
          }
        );
      }

      return responseBody as T;
    } catch (error) {
      if (didTimeout) {
        throw new AidiTimeoutError(timeoutMs);
      }

      if (error instanceof AidiError) {
        throw error;
      }

      throw new AidiError("AIDI request failed.", { cause: error });
    } finally {
      clearTimeout(effectiveTimeoutId);
    }
  }
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const rawBody = await response.text();

  if (!rawBody) {
    return undefined;
  }

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return rawBody;
  }
}
