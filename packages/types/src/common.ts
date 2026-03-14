export type RequestedFieldRequirement = "required";

export type RequestedDataField = "dni" | "cuil" | "firstName";

export type RequestedData = Partial<
  Record<RequestedDataField, RequestedFieldRequirement>
>;

export type RequestedFields = RequestedDataField[];
