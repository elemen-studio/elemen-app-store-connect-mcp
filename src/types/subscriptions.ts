// Subscription Group, Subscription, Localization, and Pricing types

export type SubscriptionPeriod =
  | 'ONE_WEEK'
  | 'ONE_MONTH'
  | 'TWO_MONTHS'
  | 'THREE_MONTHS'
  | 'SIX_MONTHS'
  | 'ONE_YEAR';

export interface SubscriptionGroup {
  id: string;
  type: 'subscriptionGroups';
  attributes: {
    referenceName?: string;
  };
}

export interface ListSubscriptionGroupsResponse {
  data: SubscriptionGroup[];
  links?: { self: string; next?: string };
  meta?: { paging: { total: number; limit: number } };
}

export interface SubscriptionGroupResponse {
  data: SubscriptionGroup;
  included?: any[];
}

export interface SubscriptionGroupLocalization {
  id: string;
  type: 'subscriptionGroupLocalizations';
  attributes: {
    name?: string;
    customAppName?: string;
    locale?: string;
    state?: string;
  };
}

export interface ListSubscriptionGroupLocalizationsResponse {
  data: SubscriptionGroupLocalization[];
  links?: { self: string; next?: string };
}

export interface SubscriptionGroupLocalizationResponse {
  data: SubscriptionGroupLocalization;
}

export interface Subscription {
  id: string;
  type: 'subscriptions';
  attributes: {
    name?: string;
    productId?: string;
    familySharable?: boolean;
    state?: string;
    subscriptionPeriod?: SubscriptionPeriod;
    reviewNote?: string;
    groupLevel?: number;
  };
}

export interface ListSubscriptionsResponse {
  data: Subscription[];
  links?: { self: string; next?: string };
  meta?: { paging: { total: number; limit: number } };
}

export interface SubscriptionResponse {
  data: Subscription;
  included?: any[];
}

export interface SubscriptionLocalization {
  id: string;
  type: 'subscriptionLocalizations';
  attributes: {
    name?: string;
    description?: string;
    locale?: string;
    state?: string;
  };
}

export interface ListSubscriptionLocalizationsResponse {
  data: SubscriptionLocalization[];
  links?: { self: string; next?: string };
}

export interface SubscriptionLocalizationResponse {
  data: SubscriptionLocalization;
}

export interface SubscriptionPricePoint {
  id: string;
  type: 'subscriptionPricePoints';
  attributes: {
    customerPrice?: string;
    proceeds?: string;
  };
  relationships?: {
    territory?: { data: { type: 'territories'; id: string } };
  };
}

export interface ListSubscriptionPricePointsResponse {
  data: SubscriptionPricePoint[];
  links?: { self: string; next?: string };
  meta?: { paging: { total: number; limit: number } };
}

export interface SubscriptionPrice {
  id: string;
  type: 'subscriptionPrices';
  attributes: {
    startDate?: string;
    preserveCurrentPrice?: boolean;
  };
  relationships?: {
    subscriptionPricePoint?: { data: { type: 'subscriptionPricePoints'; id: string } };
    territory?: { data: { type: 'territories'; id: string } };
  };
}

export interface ListSubscriptionPricesResponse {
  data: SubscriptionPrice[];
  links?: { self: string; next?: string };
}

export interface SubscriptionPriceResponse {
  data: SubscriptionPrice;
}
