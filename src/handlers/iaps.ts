import { AppStoreConnectClient } from '../services/index.js';
import {
  ListInAppPurchasesV2Response,
  InAppPurchaseV2Response,
  InAppPurchaseType,
  ListInAppPurchaseLocalizationsResponse,
  InAppPurchaseLocalizationResponse,
  ListInAppPurchasePricePointsResponse,
  InAppPurchasePriceScheduleResponse,
  InAppPurchasePriceInput,
} from '../types/index.js';
import { validateRequired, sanitizeLimit } from '../utils/index.js';

// inAppPurchasesV2 endpoints live under /v2/. The shared client's axios instance
// has baseURL .../v1, so we pass an absolute URL for v2 endpoints — axios skips
// baseURL when given an absolute URL.
const V2_BASE = 'https://api.appstoreconnect.apple.com/v2';

export class IapHandlers {
  constructor(private client: AppStoreConnectClient) {}

  // ------- In-App Purchases (v2) -------

  async listInAppPurchases(args: {
    appId: string;
    limit?: number;
  }): Promise<ListInAppPurchasesV2Response> {
    validateRequired(args, ['appId']);
    return this.client.get<ListInAppPurchasesV2Response>(
      `/apps/${args.appId}/inAppPurchasesV2`,
      { limit: sanitizeLimit(args.limit) }
    );
  }

  async getInAppPurchase(args: { iapId: string }): Promise<InAppPurchaseV2Response> {
    validateRequired(args, ['iapId']);
    return this.client.get<InAppPurchaseV2Response>(`${V2_BASE}/inAppPurchases/${args.iapId}`);
  }

  async createInAppPurchase(args: {
    appId: string;
    productId: string;
    name: string;
    inAppPurchaseType: InAppPurchaseType;
    familySharable?: boolean;
    reviewNote?: string;
    availableInAllTerritories?: boolean;
  }): Promise<InAppPurchaseV2Response> {
    validateRequired(args, ['appId', 'productId', 'name', 'inAppPurchaseType']);
    return this.client.post<InAppPurchaseV2Response>(`${V2_BASE}/inAppPurchases`, {
      data: {
        type: 'inAppPurchases',
        attributes: {
          name: args.name,
          productId: args.productId,
          inAppPurchaseType: args.inAppPurchaseType,
          ...(args.familySharable !== undefined && { familySharable: args.familySharable }),
          ...(args.reviewNote !== undefined && { reviewNote: args.reviewNote }),
          ...(args.availableInAllTerritories !== undefined && {
            availableInAllTerritories: args.availableInAllTerritories,
          }),
        },
        relationships: {
          app: { data: { type: 'apps', id: args.appId } },
        },
      },
    });
  }

  async updateInAppPurchase(args: {
    iapId: string;
    name?: string;
    reviewNote?: string;
    familySharable?: boolean;
    availableInAllTerritories?: boolean;
  }): Promise<InAppPurchaseV2Response> {
    validateRequired(args, ['iapId']);
    const { iapId, ...rest } = args;
    const attributes: Record<string, any> = {};
    for (const [k, v] of Object.entries(rest)) {
      if (v !== undefined) attributes[k] = v;
    }
    return this.client.patch<InAppPurchaseV2Response>(`${V2_BASE}/inAppPurchases/${iapId}`, {
      data: { type: 'inAppPurchases', id: iapId, attributes },
    });
  }

  async deleteInAppPurchase(args: { iapId: string }): Promise<{ success: boolean }> {
    validateRequired(args, ['iapId']);
    await this.client.delete(`${V2_BASE}/inAppPurchases/${args.iapId}`);
    return { success: true };
  }

  // ------- IAP Localizations -------

  async listIapLocalizations(args: {
    iapId: string;
    limit?: number;
  }): Promise<ListInAppPurchaseLocalizationsResponse> {
    validateRequired(args, ['iapId']);
    return this.client.get<ListInAppPurchaseLocalizationsResponse>(
      `${V2_BASE}/inAppPurchases/${args.iapId}/inAppPurchaseLocalizations`,
      { limit: sanitizeLimit(args.limit) }
    );
  }

  async createIapLocalization(args: {
    iapId: string;
    locale: string;
    name: string;
    description?: string;
  }): Promise<InAppPurchaseLocalizationResponse> {
    validateRequired(args, ['iapId', 'locale', 'name']);
    return this.client.post<InAppPurchaseLocalizationResponse>('/inAppPurchaseLocalizations', {
      data: {
        type: 'inAppPurchaseLocalizations',
        attributes: {
          locale: args.locale,
          name: args.name,
          ...(args.description && { description: args.description }),
        },
        relationships: {
          inAppPurchaseV2: { data: { type: 'inAppPurchases', id: args.iapId } },
        },
      },
    });
  }

  async updateIapLocalization(args: {
    localizationId: string;
    name?: string;
    description?: string;
  }): Promise<InAppPurchaseLocalizationResponse> {
    validateRequired(args, ['localizationId']);
    return this.client.patch<InAppPurchaseLocalizationResponse>(
      `/inAppPurchaseLocalizations/${args.localizationId}`,
      {
        data: {
          type: 'inAppPurchaseLocalizations',
          id: args.localizationId,
          attributes: {
            ...(args.name !== undefined && { name: args.name }),
            ...(args.description !== undefined && { description: args.description }),
          },
        },
      }
    );
  }

  async deleteIapLocalization(args: {
    localizationId: string;
  }): Promise<{ success: boolean }> {
    validateRequired(args, ['localizationId']);
    await this.client.delete(`/inAppPurchaseLocalizations/${args.localizationId}`);
    return { success: true };
  }

  // ------- IAP Pricing -------

  async listIapPricePoints(args: {
    iapId: string;
    territory: string;
    limit?: number;
  }): Promise<ListInAppPurchasePricePointsResponse> {
    validateRequired(args, ['iapId', 'territory']);
    return this.client.get<ListInAppPurchasePricePointsResponse>(
      `${V2_BASE}/inAppPurchases/${args.iapId}/pricePoints`,
      {
        'filter[territory]': args.territory,
        limit: sanitizeLimit(args.limit),
      }
    );
  }

  async getIapPriceSchedule(args: {
    iapId: string;
  }): Promise<InAppPurchasePriceScheduleResponse> {
    validateRequired(args, ['iapId']);
    return this.client.get<InAppPurchasePriceScheduleResponse>(
      `${V2_BASE}/inAppPurchases/${args.iapId}/iapPriceSchedule`
    );
  }

  // Replaces the entire price schedule for an IAP. The schedule contains
  // `manualPrices` as an array of inline `inAppPurchasePrices` resources
  // (provided via the JSON:API `included` array), each pointing at a price point
  // and territory. `baseTerritory` is the reference territory Apple uses to
  // derive prices in territories you didn't explicitly price.
  async setIapPriceSchedule(args: {
    iapId: string;
    baseTerritory: string;
    prices: InAppPurchasePriceInput[];
  }): Promise<InAppPurchasePriceScheduleResponse> {
    validateRequired(args, ['iapId', 'baseTerritory', 'prices']);
    if (!Array.isArray(args.prices) || args.prices.length === 0) {
      throw new Error('prices must be a non-empty array');
    }

    const priceRefs = args.prices.map((_, i) => ({
      type: 'inAppPurchasePrices',
      id: `new-price-${i}`,
    }));

    const included = args.prices.map((p, i) => ({
      type: 'inAppPurchasePrices',
      id: `new-price-${i}`,
      attributes: {
        ...(p.startDate && { startDate: p.startDate }),
        ...(p.endDate && { endDate: p.endDate }),
      },
      relationships: {
        inAppPurchasePricePoint: {
          data: { type: 'inAppPurchasePricePoints', id: p.pricePointId },
        },
        territory: { data: { type: 'territories', id: p.territory } },
      },
    }));

    return this.client.post<InAppPurchasePriceScheduleResponse>('/inAppPurchasePriceSchedules', {
      data: {
        type: 'inAppPurchasePriceSchedules',
        relationships: {
          inAppPurchase: { data: { type: 'inAppPurchases', id: args.iapId } },
          baseTerritory: { data: { type: 'territories', id: args.baseTerritory } },
          manualPrices: { data: priceRefs },
        },
      },
      included,
    });
  }
}
