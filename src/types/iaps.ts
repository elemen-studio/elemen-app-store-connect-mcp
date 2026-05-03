// In-App Purchase v2 types

export type InAppPurchaseType =
  | 'CONSUMABLE'
  | 'NON_CONSUMABLE'
  | 'NON_RENEWING_SUBSCRIPTION';

export interface InAppPurchaseV2 {
  id: string;
  type: 'inAppPurchases';
  attributes: {
    name?: string;
    productId?: string;
    inAppPurchaseType?: InAppPurchaseType;
    state?: string;
    reviewNote?: string;
    familySharable?: boolean;
    contentHosting?: boolean;
    availableInAllTerritories?: boolean;
  };
}

export interface ListInAppPurchasesV2Response {
  data: InAppPurchaseV2[];
  links?: { self: string; next?: string };
  meta?: { paging: { total: number; limit: number } };
}

export interface InAppPurchaseV2Response {
  data: InAppPurchaseV2;
  included?: any[];
}

export interface InAppPurchaseLocalization {
  id: string;
  type: 'inAppPurchaseLocalizations';
  attributes: {
    name?: string;
    description?: string;
    locale?: string;
    state?: string;
  };
}

export interface ListInAppPurchaseLocalizationsResponse {
  data: InAppPurchaseLocalization[];
  links?: { self: string; next?: string };
}

export interface InAppPurchaseLocalizationResponse {
  data: InAppPurchaseLocalization;
}

export interface InAppPurchasePricePoint {
  id: string;
  type: 'inAppPurchasePricePoints';
  attributes: {
    customerPrice?: string;
    proceeds?: string;
  };
  relationships?: {
    territory?: { data: { type: 'territories'; id: string } };
  };
}

export interface ListInAppPurchasePricePointsResponse {
  data: InAppPurchasePricePoint[];
  links?: { self: string; next?: string };
  meta?: { paging: { total: number; limit: number } };
}

export interface InAppPurchasePriceSchedule {
  id: string;
  type: 'inAppPurchasePriceSchedules';
}

export interface InAppPurchasePriceScheduleResponse {
  data: InAppPurchasePriceSchedule;
  included?: any[];
}

// Inline price entry used when creating a price schedule.
// Each entry is an `inAppPurchasePrices` resource referenced from the schedule's
// `manualPrices` relationship and provided as an included resource.
export interface InAppPurchasePriceInput {
  pricePointId: string;
  territory: string;
  startDate?: string;
  endDate?: string;
}
