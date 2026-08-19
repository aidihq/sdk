export interface AidiClientConfig {
  apiKey: string;
}

export type RequestedFieldRequirement = "required";

export type RequestedDataField = "dni" | "cuil" | "firstName";

export type RequestedData = Partial<
  Record<RequestedDataField, RequestedFieldRequirement>
>;

export type RequestedFields = RequestedDataField[];

export type VerificationType = "IDENTITY_VERIFY";

export type VerificationIntent = "VERIFY" | "AUTHENTICATE";
export type VerificationInitiation = "TARGETED" | "USER_INITIATED";

export type HttpVerificationIntent = "VERIFY" | "LOGIN";
export type HttpVerificationFlowMode = "DIRECT" | "QR";

interface BaseCreateVerificationInput {
  type?: VerificationType;
  requestedFields: RequestedFields;
  intent?: VerificationIntent;
  message?: string;
}

export interface CreateUserInitiatedVerificationInput
  extends BaseCreateVerificationInput {
  initiation?: "USER_INITIATED";
  targetIdentifier?: never;
  redirectUrl?: string;
  state?: string;
}

export interface CreateTargetedVerificationInput
  extends BaseCreateVerificationInput {
  initiation?: "TARGETED";
  targetIdentifier: string;
  redirectUrl?: never;
  state?: never;
}

export type CreateVerificationInput =
  | (BaseCreateVerificationInput & {
      initiation: "USER_INITIATED";
      targetIdentifier?: never;
      redirectUrl?: string;
      state?: string;
    })
  | {
      type?: VerificationType;
      intent?: VerificationIntent;
      message?: string;
      initiation: "TARGETED";
      requestedFields: RequestedFields;
      targetIdentifier: string;
    };

export interface CreateVerificationHttpRequest {
  type: VerificationType;
  requestedData: RequestedData;
  intent: HttpVerificationIntent;
  message?: string;
  flowMode: HttpVerificationFlowMode;
  targetIdentifier?: string;
  redirectUrl?: string;
  state?: string;
}

export interface CreateVerificationResponse extends Record<string, unknown> {
  id: string;
  intent?: VerificationIntent;
  initiation?: VerificationInitiation;
  qrUrl?: string;
  deeplinkUrl?: string;
}

export interface VerificationStatusResponse extends Record<string, unknown> {
  id?: string;
  status?: string;
  type?: VerificationType;
  initiation?: VerificationInitiation;
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

export interface VerificationAuthenticationExchangeResponse
  extends Record<string, unknown> {
  authenticated: true;
  subjectId: string;
  claims?: Partial<Record<string, string>>;
  state?: string | null;
  redirectUrl?: string | null;
}
