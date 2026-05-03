import { AppStoreConnectClient } from '../services/index.js';
import {
  ListSubscriptionGroupsResponse,
  SubscriptionGroupResponse,
  ListSubscriptionGroupLocalizationsResponse,
  SubscriptionGroupLocalizationResponse,
  ListSubscriptionsResponse,
  SubscriptionResponse,
  SubscriptionPeriod,
  ListSubscriptionLocalizationsResponse,
  SubscriptionLocalizationResponse,
  ListSubscriptionPricePointsResponse,
  ListSubscriptionPricesResponse,
  SubscriptionPriceResponse,
} from '../types/index.js';
import { validateRequired, sanitizeLimit } from '../utils/index.js';

export class SubscriptionHandlers {
  constructor(private client: AppStoreConnectClient) {}

  // ------- Subscription Groups -------

  async listSubscriptionGroups(args: {
    appId: string;
    limit?: number;
  }): Promise<ListSubscriptionGroupsResponse> {
    validateRequired(args, ['appId']);
    return this.client.get<ListSubscriptionGroupsResponse>(
      `/apps/${args.appId}/subscriptionGroups`,
      { limit: sanitizeLimit(args.limit) }
    );
  }

  async createSubscriptionGroup(args: {
    appId: string;
    referenceName: string;
  }): Promise<SubscriptionGroupResponse> {
    validateRequired(args, ['appId', 'referenceName']);
    return this.client.post<SubscriptionGroupResponse>('/subscriptionGroups', {
      data: {
        type: 'subscriptionGroups',
        attributes: { referenceName: args.referenceName },
        relationships: {
          app: { data: { type: 'apps', id: args.appId } },
        },
      },
    });
  }

  async updateSubscriptionGroup(args: {
    groupId: string;
    referenceName: string;
  }): Promise<SubscriptionGroupResponse> {
    validateRequired(args, ['groupId', 'referenceName']);
    return this.client.patch<SubscriptionGroupResponse>(
      `/subscriptionGroups/${args.groupId}`,
      {
        data: {
          type: 'subscriptionGroups',
          id: args.groupId,
          attributes: { referenceName: args.referenceName },
        },
      }
    );
  }

  async deleteSubscriptionGroup(args: { groupId: string }): Promise<{ success: boolean }> {
    validateRequired(args, ['groupId']);
    await this.client.delete(`/subscriptionGroups/${args.groupId}`);
    return { success: true };
  }

  // ------- Subscription Group Localizations -------

  async listSubscriptionGroupLocalizations(args: {
    groupId: string;
    limit?: number;
  }): Promise<ListSubscriptionGroupLocalizationsResponse> {
    validateRequired(args, ['groupId']);
    return this.client.get<ListSubscriptionGroupLocalizationsResponse>(
      `/subscriptionGroups/${args.groupId}/subscriptionGroupLocalizations`,
      { limit: sanitizeLimit(args.limit) }
    );
  }

  async createSubscriptionGroupLocalization(args: {
    groupId: string;
    locale: string;
    name: string;
    customAppName?: string;
  }): Promise<SubscriptionGroupLocalizationResponse> {
    validateRequired(args, ['groupId', 'locale', 'name']);
    return this.client.post<SubscriptionGroupLocalizationResponse>(
      '/subscriptionGroupLocalizations',
      {
        data: {
          type: 'subscriptionGroupLocalizations',
          attributes: {
            locale: args.locale,
            name: args.name,
            ...(args.customAppName && { customAppName: args.customAppName }),
          },
          relationships: {
            subscriptionGroup: {
              data: { type: 'subscriptionGroups', id: args.groupId },
            },
          },
        },
      }
    );
  }

  async updateSubscriptionGroupLocalization(args: {
    localizationId: string;
    name?: string;
    customAppName?: string;
  }): Promise<SubscriptionGroupLocalizationResponse> {
    validateRequired(args, ['localizationId']);
    return this.client.patch<SubscriptionGroupLocalizationResponse>(
      `/subscriptionGroupLocalizations/${args.localizationId}`,
      {
        data: {
          type: 'subscriptionGroupLocalizations',
          id: args.localizationId,
          attributes: {
            ...(args.name !== undefined && { name: args.name }),
            ...(args.customAppName !== undefined && { customAppName: args.customAppName }),
          },
        },
      }
    );
  }

  async deleteSubscriptionGroupLocalization(args: {
    localizationId: string;
  }): Promise<{ success: boolean }> {
    validateRequired(args, ['localizationId']);
    await this.client.delete(`/subscriptionGroupLocalizations/${args.localizationId}`);
    return { success: true };
  }

  // ------- Subscriptions -------

  async listSubscriptions(args: {
    groupId: string;
    limit?: number;
  }): Promise<ListSubscriptionsResponse> {
    validateRequired(args, ['groupId']);
    return this.client.get<ListSubscriptionsResponse>(
      `/subscriptionGroups/${args.groupId}/subscriptions`,
      { limit: sanitizeLimit(args.limit) }
    );
  }

  async getSubscription(args: { subscriptionId: string }): Promise<SubscriptionResponse> {
    validateRequired(args, ['subscriptionId']);
    return this.client.get<SubscriptionResponse>(`/subscriptions/${args.subscriptionId}`);
  }

  async createSubscription(args: {
    groupId: string;
    productId: string;
    name: string;
    subscriptionPeriod: SubscriptionPeriod;
    groupLevel: number;
    familySharable?: boolean;
    reviewNote?: string;
    availableInAllTerritories?: boolean;
  }): Promise<SubscriptionResponse> {
    validateRequired(args, ['groupId', 'productId', 'name', 'subscriptionPeriod', 'groupLevel']);
    return this.client.post<SubscriptionResponse>('/subscriptions', {
      data: {
        type: 'subscriptions',
        attributes: {
          name: args.name,
          productId: args.productId,
          subscriptionPeriod: args.subscriptionPeriod,
          groupLevel: args.groupLevel,
          ...(args.familySharable !== undefined && { familySharable: args.familySharable }),
          ...(args.reviewNote !== undefined && { reviewNote: args.reviewNote }),
          ...(args.availableInAllTerritories !== undefined && {
            availableInAllTerritories: args.availableInAllTerritories,
          }),
        },
        relationships: {
          group: { data: { type: 'subscriptionGroups', id: args.groupId } },
        },
      },
    });
  }

  async updateSubscription(args: {
    subscriptionId: string;
    name?: string;
    subscriptionPeriod?: SubscriptionPeriod;
    groupLevel?: number;
    familySharable?: boolean;
    reviewNote?: string;
    availableInAllTerritories?: boolean;
  }): Promise<SubscriptionResponse> {
    validateRequired(args, ['subscriptionId']);
    const { subscriptionId, ...rest } = args;
    const attributes: Record<string, any> = {};
    for (const [k, v] of Object.entries(rest)) {
      if (v !== undefined) attributes[k] = v;
    }
    return this.client.patch<SubscriptionResponse>(`/subscriptions/${subscriptionId}`, {
      data: { type: 'subscriptions', id: subscriptionId, attributes },
    });
  }

  async deleteSubscription(args: { subscriptionId: string }): Promise<{ success: boolean }> {
    validateRequired(args, ['subscriptionId']);
    await this.client.delete(`/subscriptions/${args.subscriptionId}`);
    return { success: true };
  }

  // ------- Subscription Localizations -------

  async listSubscriptionLocalizations(args: {
    subscriptionId: string;
    limit?: number;
  }): Promise<ListSubscriptionLocalizationsResponse> {
    validateRequired(args, ['subscriptionId']);
    return this.client.get<ListSubscriptionLocalizationsResponse>(
      `/subscriptions/${args.subscriptionId}/subscriptionLocalizations`,
      { limit: sanitizeLimit(args.limit) }
    );
  }

  async createSubscriptionLocalization(args: {
    subscriptionId: string;
    locale: string;
    name: string;
    description?: string;
  }): Promise<SubscriptionLocalizationResponse> {
    validateRequired(args, ['subscriptionId', 'locale', 'name']);
    return this.client.post<SubscriptionLocalizationResponse>('/subscriptionLocalizations', {
      data: {
        type: 'subscriptionLocalizations',
        attributes: {
          locale: args.locale,
          name: args.name,
          ...(args.description && { description: args.description }),
        },
        relationships: {
          subscription: { data: { type: 'subscriptions', id: args.subscriptionId } },
        },
      },
    });
  }

  async updateSubscriptionLocalization(args: {
    localizationId: string;
    name?: string;
    description?: string;
  }): Promise<SubscriptionLocalizationResponse> {
    validateRequired(args, ['localizationId']);
    return this.client.patch<SubscriptionLocalizationResponse>(
      `/subscriptionLocalizations/${args.localizationId}`,
      {
        data: {
          type: 'subscriptionLocalizations',
          id: args.localizationId,
          attributes: {
            ...(args.name !== undefined && { name: args.name }),
            ...(args.description !== undefined && { description: args.description }),
          },
        },
      }
    );
  }

  async deleteSubscriptionLocalization(args: {
    localizationId: string;
  }): Promise<{ success: boolean }> {
    validateRequired(args, ['localizationId']);
    await this.client.delete(`/subscriptionLocalizations/${args.localizationId}`);
    return { success: true };
  }

  // ------- Subscription Pricing -------

  async listSubscriptionPricePoints(args: {
    subscriptionId: string;
    territory: string;
    limit?: number;
  }): Promise<ListSubscriptionPricePointsResponse> {
    validateRequired(args, ['subscriptionId', 'territory']);
    return this.client.get<ListSubscriptionPricePointsResponse>(
      `/subscriptions/${args.subscriptionId}/pricePoints`,
      {
        'filter[territory]': args.territory,
        limit: sanitizeLimit(args.limit),
      }
    );
  }

  async listSubscriptionPrices(args: {
    subscriptionId: string;
    limit?: number;
  }): Promise<ListSubscriptionPricesResponse> {
    validateRequired(args, ['subscriptionId']);
    return this.client.get<ListSubscriptionPricesResponse>(
      `/subscriptions/${args.subscriptionId}/prices`,
      { limit: sanitizeLimit(args.limit) }
    );
  }

  async createSubscriptionPrice(args: {
    subscriptionId: string;
    pricePointId: string;
    territory: string;
    startDate?: string;
    preserveCurrentPrice?: boolean;
  }): Promise<SubscriptionPriceResponse> {
    validateRequired(args, ['subscriptionId', 'pricePointId', 'territory']);
    return this.client.post<SubscriptionPriceResponse>('/subscriptionPrices', {
      data: {
        type: 'subscriptionPrices',
        attributes: {
          ...(args.startDate && { startDate: args.startDate }),
          ...(args.preserveCurrentPrice !== undefined && {
            preserveCurrentPrice: args.preserveCurrentPrice,
          }),
        },
        relationships: {
          subscription: { data: { type: 'subscriptions', id: args.subscriptionId } },
          subscriptionPricePoint: {
            data: { type: 'subscriptionPricePoints', id: args.pricePointId },
          },
          territory: { data: { type: 'territories', id: args.territory } },
        },
      },
    });
  }

  async deleteSubscriptionPrice(args: { priceId: string }): Promise<{ success: boolean }> {
    validateRequired(args, ['priceId']);
    await this.client.delete(`/subscriptionPrices/${args.priceId}`);
    return { success: true };
  }
}
