import { AppStoreConnectClient } from '../services/index.js';
import {
  ListAppsResponse,
  AppInfoResponse,
  AppIncludeOptions,
  ListAppInfosResponse,
  ListAppInfoLocalizationsResponse,
  AppInfoLocalizationResponse,
  AppInfoLocalizationCreateRequest,
  AppInfoLocalizationUpdateRequest,
  AppInfoLocalizationField,
} from '../types/index.js';
import { validateRequired, sanitizeLimit } from '../utils/index.js';

export class AppHandlers {
  constructor(private client: AppStoreConnectClient) {}

  async listApps(args: { 
    limit?: number;
    bundleId?: string;
  } = {}): Promise<ListAppsResponse> {
    const { limit = 100, bundleId } = args;
    
    const params: Record<string, any> = {
      limit: sanitizeLimit(limit)
    };
    
    if (bundleId) {
      params['filter[bundleId]'] = bundleId;
    }
    
    return this.client.get<ListAppsResponse>('/apps', params);
  }

  async getAppInfo(args: { 
    appId: string; 
    include?: AppIncludeOptions[];
  }): Promise<AppInfoResponse> {
    const { appId, include } = args;
    
    validateRequired(args, ['appId']);

    const params: Record<string, any> = {};
    if (include?.length) {
      params.include = include.join(',');
    }

    return this.client.get<AppInfoResponse>(`/apps/${appId}`, params);
  }

  async listAppInfos(args: {
    appId: string;
    limit?: number;
  }): Promise<ListAppInfosResponse> {
    const { appId, limit = 100 } = args;

    validateRequired(args, ['appId']);

    const params: Record<string, any> = {
      limit: sanitizeLimit(limit),
    };

    return this.client.get<ListAppInfosResponse>(
      `/apps/${appId}/appInfos`,
      params
    );
  }

  async listAppInfoLocalizations(args: {
    appInfoId: string;
    limit?: number;
  }): Promise<ListAppInfoLocalizationsResponse> {
    const { appInfoId, limit = 100 } = args;

    validateRequired(args, ['appInfoId']);

    const params: Record<string, any> = {
      limit: sanitizeLimit(limit),
    };

    return this.client.get<ListAppInfoLocalizationsResponse>(
      `/appInfos/${appInfoId}/appInfoLocalizations`,
      params
    );
  }

  async createAppInfoLocalization(args: {
    appInfoId: string;
    locale: string;
    name?: string;
    subtitle?: string;
    privacyPolicyUrl?: string;
    privacyChoicesUrl?: string;
    privacyPolicyText?: string;
  }): Promise<AppInfoLocalizationResponse> {
    const { appInfoId, locale, ...optionalFields } = args;

    validateRequired(args, ['appInfoId', 'locale']);

    const requestData: AppInfoLocalizationCreateRequest = {
      data: {
        type: 'appInfoLocalizations',
        attributes: {
          locale,
          ...(optionalFields.name && { name: optionalFields.name }),
          ...(optionalFields.subtitle && { subtitle: optionalFields.subtitle }),
          ...(optionalFields.privacyPolicyUrl && { privacyPolicyUrl: optionalFields.privacyPolicyUrl }),
          ...(optionalFields.privacyChoicesUrl && { privacyChoicesUrl: optionalFields.privacyChoicesUrl }),
          ...(optionalFields.privacyPolicyText && { privacyPolicyText: optionalFields.privacyPolicyText }),
        },
        relationships: {
          appInfo: {
            data: {
              type: 'appInfos',
              id: appInfoId,
            },
          },
        },
      },
    };

    return this.client.post<AppInfoLocalizationResponse>(
      '/appInfoLocalizations',
      requestData
    );
  }

  async updateAppInfoLocalization(args: {
    appInfoLocalizationId: string;
    field: AppInfoLocalizationField;
    value: string;
  }): Promise<AppInfoLocalizationResponse> {
    const { appInfoLocalizationId, field, value } = args;

    validateRequired(args, ['appInfoLocalizationId', 'field', 'value']);

    const validFields: AppInfoLocalizationField[] = [
      'name', 'subtitle', 'privacyPolicyUrl', 'privacyChoicesUrl', 'privacyPolicyText'
    ];

    if (!validFields.includes(field)) {
      throw new Error(`Invalid field: ${field}. Must be one of: ${validFields.join(', ')}`);
    }

    const requestData: AppInfoLocalizationUpdateRequest = {
      data: {
        type: 'appInfoLocalizations',
        id: appInfoLocalizationId,
        attributes: {
          [field]: value,
        },
      },
    };

    return this.client.patch<AppInfoLocalizationResponse>(
      `/appInfoLocalizations/${appInfoLocalizationId}`,
      requestData
    );
  }

  async findAppByBundleId(bundleId: string): Promise<{ id: string; attributes: { bundleId: string; name: string; sku: string; primaryLocale: string } } | null> {
    const response = await this.listApps({ bundleId, limit: 1 });
    
    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    
    return null;
  }
}