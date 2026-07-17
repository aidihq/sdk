import type {
  CreateDirectVerificationRequest,
  CreateQrVerificationInput,
  CreateQrVerificationRequest,
  CreateVerificationDirectInput,
  CreateVerificationInput,
  CreateVerificationResponse,
  RequestedData,
  RequestedFields,
  VerificationLoginExchangeResponse,
  VerificationResultResponse,
  VerificationStatusResponse
} from "../types";

import { AidiError } from "../http/errors";
import type { HttpClient } from "../http/http-client";

export class VerificationsResource {
  constructor(private readonly httpClient: HttpClient) {}

  create(input: CreateVerificationInput): Promise<CreateVerificationResponse> {
    return this.httpClient.request<CreateVerificationResponse>("/verification", {
      method: "POST",
      body: normalizeCreateVerificationInput(input)
    });
  }

  createQr(
    input: Omit<CreateQrVerificationInput, "flowMode">
  ): Promise<CreateVerificationResponse> {
    return this.create({
      ...input,
      flowMode: "QR"
    });
  }

  createDirect(
    input: CreateVerificationDirectInput
  ): Promise<CreateVerificationResponse> {
    return this.create({
      ...input,
      flowMode: "DIRECT"
    });
  }

  getStatus(verificationId: string): Promise<VerificationStatusResponse> {
    return this.httpClient.request<VerificationStatusResponse>(
      `/verification/${encodeURIComponent(verificationId)}/status`
    );
  }

  getResult(verificationId: string): Promise<VerificationResultResponse> {
    return this.httpClient.request<VerificationResultResponse>(
      `/verification/${encodeURIComponent(verificationId)}/result`
    );
  }

  exchangeLogin(
    verificationId: string,
    exchangeToken: string
  ): Promise<VerificationLoginExchangeResponse> {
    if (!exchangeToken.trim()) {
      throw new AidiError("AIDI exchangeToken is required for login exchange.");
    }

    return this.httpClient.request<VerificationLoginExchangeResponse>(
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
): CreateDirectVerificationRequest | CreateQrVerificationRequest {
  if (!Array.isArray(input.requestedFields)) {
    throw new AidiError("AIDI requestedFields must be an array.");
  }

  const baseRequest = {
    type: input.type ?? "IDENTITY_VERIFY",
    requestedData: buildRequestedData(input.requestedFields),
    intent: input.intent ?? "VERIFY",
    message: input.message
  };

  if (input.flowMode === "DIRECT") {
    if (baseRequest.intent === "LOGIN") {
      throw new AidiError("AIDI LOGIN intent only supports QR flow.");
    }

    if (
      typeof input.targetIdentifier !== "string" ||
      !input.targetIdentifier.trim()
    ) {
      throw new AidiError(
        "AIDI targetIdentifier is required when flowMode is DIRECT."
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
