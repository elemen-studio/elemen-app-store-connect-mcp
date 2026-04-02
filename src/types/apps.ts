export interface App {
  id: string;
  type: string;
  attributes: {
    name: string;
    bundleId: string;
    sku: string;
    primaryLocale: string;
  };
}

export interface ListAppsResponse {
  data: App[];
}

export interface AppInfoResponse {
  data: App;
  included?: any[];
}

// --- App Info types ---

export interface AppInfo {
  id: string;
  type: 'appInfos';
  attributes: {
    appStoreAgeRating?: string;
    appStoreState?: string;
    brazilAgeRating?: string;
    kidsAgeBand?: string | null;
  };
  relationships?: Record<string, any>;
  links?: { self: string };
}

export interface ListAppInfosResponse {
  data: AppInfo[];
  links?: { self?: string; next?: string };
  meta?: { paging?: { total: number; limit: number } };
}

// --- App Info Localization types ---

export interface AppInfoLocalization {
  id: string;
  type: 'appInfoLocalizations';
  attributes: {
    locale: string;
    name?: string;
    subtitle?: string;
    privacyPolicyUrl?: string;
    privacyChoicesUrl?: string;
    privacyPolicyText?: string;
  };
  links?: { self: string };
}

export interface AppInfoLocalizationResponse {
  data: AppInfoLocalization;
  links?: { self: string };
}

export interface ListAppInfoLocalizationsResponse {
  data: AppInfoLocalization[];
  links?: { self?: string; next?: string };
  meta?: { paging?: { total: number; limit: number } };
}

export interface AppInfoLocalizationCreateRequest {
  data: {
    type: 'appInfoLocalizations';
    attributes: {
      locale: string;
      name?: string;
      subtitle?: string;
      privacyPolicyUrl?: string;
      privacyChoicesUrl?: string;
      privacyPolicyText?: string;
    };
    relationships: {
      appInfo: {
        data: {
          type: 'appInfos';
          id: string;
        };
      };
    };
  };
}

export interface AppInfoLocalizationUpdateRequest {
  data: {
    type: 'appInfoLocalizations';
    id: string;
    attributes: {
      name?: string;
      subtitle?: string;
      privacyPolicyUrl?: string;
      privacyChoicesUrl?: string;
      privacyPolicyText?: string;
    };
  };
}

export type AppInfoLocalizationField =
  | 'name'
  | 'subtitle'
  | 'privacyPolicyUrl'
  | 'privacyChoicesUrl'
  | 'privacyPolicyText';

export type AppIncludeOptions =
  | "appClips"
  | "appInfos"
  | "appStoreVersions"
  | "availableTerritories"
  | "betaAppReviewDetail"
  | "betaGroups"
  | "betaLicenseAgreement"
  | "builds"
  | "endUserLicenseAgreement"
  | "gameCenterEnabledVersions"
  | "inAppPurchases"
  | "preOrder"
  | "prices"
  | "reviewSubmissions";