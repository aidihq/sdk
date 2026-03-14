import type { AidiClientConfig } from "./types";

import { AidiError } from "./http/errors";
import { HttpClient } from "./http/http-client";
import { VerificationsResource } from "./resources/verifications";

export interface AidiClient {
  verifications: VerificationsResource;
}

export function createAidiClient(config: AidiClientConfig): AidiClient {
  if (typeof config.apiKey !== "string" || !config.apiKey.trim()) {
    throw new AidiError("AIDI apiKey is required.");
  }

  const httpClient = new HttpClient(config);

  return {
    verifications: new VerificationsResource(httpClient)
  };
}
