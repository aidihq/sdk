import type {
  CreateTargetedVerificationInput,
  CreateUserInitiatedVerificationInput,
  CreateVerificationHttpRequest,
  CreateVerificationInput,
  CreateVerificationResponse,
  RequestedData,
  RequestedFields,
  VerificationAuthenticationExchangeResponse,
  VerificationResultResponse,
  VerificationStatusResponse
} from "../types";

import { AidiError } from "../http/errors";
import type { HttpClient } from "../http/http-client";

export class VerificationsResource {
  constructor(private readonly httpClient: HttpClient) {}

  async create(
    input: CreateVerificationInput
  ): Promise<CreateVerificationResponse> {
    const response = await this.httpClient.request<Record<string, unknown>>(
      "/verification",
      {
        method: "POST",
        body: normalizeCreateVerificationInput(input)
      }
    );

    return response as CreateVerificationResponse;
  }

  createUserInitiated(
    input: Omit<CreateUserInitiatedVerificationInput, "initiation">
  ): Promise<CreateVerificationResponse> {
    return this.create({
      ...input,
      initiation: "USER_INITIATED"
    });
  }

  createTargeted(
    input: CreateTargetedVerificationInput
  ): Promise<CreateVerificationResponse> {
    return this.create({
      ...input,
      initiation: "TARGETED"
    });
  }

  async getStatus(verificationId: string): Promise<VerificationStatusResponse> {
    const response = await this.httpClient.request<Record<string, unknown>>(
      `/verification/${encodeURIComponent(verificationId)}/status`
    );

    return response as VerificationStatusResponse;
  }

  getResult(verificationId: string): Promise<VerificationResultResponse> {
    return this.httpClient.request<VerificationResultResponse>(
      `/verification/${encodeURIComponent(verificationId)}/result`
    );
  }

  exchangeAuthentication(
    verificationId: string,
    exchangeToken: string
  ): Promise<VerificationAuthenticationExchangeResponse> {
    if (!exchangeToken.trim()) {
      throw new AidiError(
        "AIDI exchangeToken is required for authentication exchange."
      );
    }

    return this.httpClient.request<VerificationAuthenticationExchangeResponse>(
      `/verification/${encodeURIComponent(verificationId)}/authentication/exchange`,
      {
        method: "POST",
        body: { exchangeToken }
      }
    );
  }
}

function normalizeCreateVerificationInput(
  input: CreateVerificationInput
): CreateVerificationHttpRequest {
  if (!Array.isArray(input.requestedFields)) {
    throw new AidiError("AIDI requestedFields must be an array.");
  }

  const baseRequest = {
    type: input.type ?? "IDENTITY_VERIFY",
    requestedData: buildRequestedData(input.requestedFields),
    intent: input.intent ?? "VERIFY",
    message: input.message
  };

  if (input.initiation === "TARGETED") {
    if (input.intent === "AUTHENTICATE") {
      throw new AidiError(
        "AIDI AUTHENTICATE intent only supports USER_INITIATED initiation."
      );
    }

    if (
      typeof input.targetIdentifier !== "string" ||
      !input.targetIdentifier.trim()
    ) {
      throw new AidiError(
        "AIDI targetIdentifier is required when initiation is TARGETED."
      );
    }

    return {
      ...baseRequest,
      initiation: "TARGETED",
      targetIdentifier: input.targetIdentifier
    };
  }

  return {
    ...baseRequest,
    initiation: "USER_INITIATED",
    redirectUrl: input.redirectUrl,
    state: input.state
  };
}

function buildRequestedData(requestedFields: RequestedFields): RequestedData {
  const requestedData: RequestedData = {};
  const seenFields = new Set<string>();

  for (const field of requestedFields) {
    if (!isRequestedDataField(field)) {
      throw new AidiError(
        `AIDI requested field "${String(field)}" is not supported.`
      );
    }

    if (seenFields.has(field)) {
      continue;
    }

    seenFields.add(field);
    requestedData[field] = "required";
  }

  return requestedData;
}

function isRequestedDataField(
  field: string
): field is "dni" | "cuil" | "firstName" {
  return field === "dni" || field === "cuil" || field === "firstName";
}
