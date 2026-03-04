export type Brand<T, B extends string> = T & { readonly __brand: B };

export type UUID = Brand<string, "uuid">;

export function asUUID(value: string): UUID {
  return value as UUID;
}

export type FitterId = Brand<UUID, "FitterId">;
export type LeadId = Brand<UUID, "LeadId">;
export type ConversationId = Brand<UUID, "ConversationId">;
export type MessageId = Brand<UUID, "MessageId">;
export type AssetId = Brand<UUID, "AssetId">;

export function asFitterId(value: UUID): FitterId {
  return value as FitterId;
}
export function asLeadId(value: UUID): LeadId {
  return value as LeadId;
}
export function asConversationId(value: UUID): ConversationId {
  return value as ConversationId;
}
export function asMessageId(value: UUID): MessageId {
  return value as MessageId;
}
export function asAssetId(value: UUID): AssetId {
  return value as AssetId;
}