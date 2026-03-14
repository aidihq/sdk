export class AidiError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "AidiError";

    if (options?.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

export class AidiHttpError extends AidiError {
  readonly status: number;
  readonly statusText: string;
  readonly body: unknown;
  readonly responseHeaders: Headers;

  constructor(message: string, options: {
    status: number;
    statusText: string;
    body: unknown;
    responseHeaders: Headers;
  }) {
    super(message);
    this.name = "AidiHttpError";
    this.status = options.status;
    this.statusText = options.statusText;
    this.body = options.body;
    this.responseHeaders = options.responseHeaders;
  }
}

export class AidiTimeoutError extends AidiError {
  readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`AIDI request timed out after ${timeoutMs}ms.`);
    this.name = "AidiTimeoutError";
    this.timeoutMs = timeoutMs;
  }
}
