import type { RequestedData, RequestedFields } from "./common";

export type VerificationType = "IDENTITY_VERIFY";

export type VerificationFlowMode = "DIRECT" | "QR";
export type VerificationIntent = "VERIFY" | "LOGIN";

interface BaseCreateVerificationRequest {
  type: VerificationType;
  requestedData: RequestedData;
  intent?: VerificationIntent;
  message?: string;
}

interface BaseCreateVerificationInput {
  type?: VerificationType;
  requestedFields: RequestedFields;
  intent?: VerificationIntent;
  message?: string;
}

export interface CreateQrVerificationRequest
  extends BaseCreateVerificationRequest {
  flowMode: "QR";
  redirectUrl?: string;
  state?: string;
}

export interface CreateDirectVerificationRequest
  extends BaseCreateVerificationRequest {
  flowMode: "DIRECT";
  targetIdentifier: string;
}

export type CreateVerificationRequest =
  | CreateQrVerificationRequest
  | CreateDirectVerificationRequest;

export interface CreateQrVerificationInput
  extends BaseCreateVerificationInput {
  flowMode?: "QR";
}

export interface CreateVerificationDirectInput
  extends BaseCreateVerificationInput {
  flowMode?: "DIRECT";
  targetIdentifier: string;
}

export type CreateVerificationInput =
  | (BaseCreateVerificationInput & {
      flowMode: "QR";
      targetIdentifier?: never;
      redirectUrl?: string;
      state?: string;
    })
  | {
      type?: VerificationType;
      intent?: VerificationIntent;
      message?: string;
      flowMode: "DIRECT";
      requestedFields: RequestedFields;
      targetIdentifier: string;
    };

export interface CreateVerificationResponse extends Record<string, unknown> {
  id: string;
  intent?: VerificationIntent;
  qrUrl?: string;
  deeplinkUrl?: string;
}

export interface VerificationStatusResponse extends Record<string, unknown> {
  id?: string;
  status?: string;
  type?: VerificationType;
  flowMode?: VerificationFlowMode;
  intent?: VerificationIntent;
  exchangeReady?: boolean;
  resultAvailable?: boolean;
  exchangeToken?: string;
}

export interface VerificationResultResponse extends Record<string, unknown> {
  status: "approved";
  result: {
    identityConfirmed: true;
    subjectId: string;
    assuranceLevel: "high";
    claims?: Partial<Record<string, string>>;
  };
}

export interface VerificationLoginExchangeResponse extends Record<string, unknown> {
  authenticated: true;
  subjectId: string;
  claims?: Partial<Record<string, string>>;
  state?: string | null;
}
