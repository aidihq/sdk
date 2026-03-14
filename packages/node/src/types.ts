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

export type VerificationFlowMode = "DIRECT" | "QR";

interface BaseCreateVerificationRequest {
  type: VerificationType;
  requestedData: RequestedData;
}

interface BaseCreateVerificationInput {
  type?: VerificationType;
  requestedFields: RequestedFields;
}

export interface CreateQrVerificationRequest
  extends BaseCreateVerificationRequest {
  flowMode: "QR";
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
    })
  | {
      type?: VerificationType;
      flowMode: "DIRECT";
      requestedFields: RequestedFields;
      targetIdentifier: string;
    };

export interface CreateVerificationResponse extends Record<string, unknown> {
  id: string;
  qrUrl?: string;
}

export interface VerificationStatusResponse extends Record<string, unknown> {
  id?: string;
  status?: string;
  type?: VerificationType;
  flowMode?: VerificationFlowMode;
}
