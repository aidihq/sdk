import type {
  CreateTargetedVerificationInput,
  CreateUserInitiatedVerificationInput,
  CreateVerificationHttpRequest,
  CreateVerificationInput,
  CreateVerificationResponse,
  RequestedData,
  RequestedFields,
  VerificationAuthenticationExchangeResponse,
  VerificationInitiation,
  VerificationIntent,
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

    return normalizeVerificationResponse(response);
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

    return normalizeVerificationResponse(response);
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
      `/verification/${encodeURIComponent(verificationId)}/login/exchange`,
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
    intent: toHttpIntent(input.intent ?? "VERIFY"),
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
      flowMode: "DIRECT",
      targetIdentifier: input.targetIdentifier
    };
  }

  return {
    ...baseRequest,
    flowMode: "QR",
    redirectUrl: input.redirectUrl,
    state: input.state
  };
}

function toHttpIntent(intent: VerificationIntent) {
  return intent === "AUTHENTICATE" ? "LOGIN" : "VERIFY";
}

function fromHttpIntent(intent: unknown): VerificationIntent | undefined {
  if (intent === "LOGIN") {
    return "AUTHENTICATE";
  }
  if (intent === "VERIFY") {
    return "VERIFY";
  }
  return undefined;
}

function fromHttpFlowMode(flowMode: unknown): VerificationInitiation | undefined {
  if (flowMode === "DIRECT") {
    return "TARGETED";
  }
  if (flowMode === "QR") {
    return "USER_INITIATED";
  }
  return undefined;
}

function normalizeVerificationResponse<T extends Record<string, unknown>>(
  response: T
): T & {
  intent?: VerificationIntent;
  initiation?: VerificationInitiation;
} {
  const intent = fromHttpIntent(response.intent);
  const initiation = fromHttpFlowMode(response.flowMode);

  return {
    ...response,
    ...(intent ? { intent } : {}),
    ...(initiation ? { initiation } : {})
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
