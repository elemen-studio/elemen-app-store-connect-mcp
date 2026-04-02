export type ScreenshotDisplayType = 
  | 'APP_IPHONE_65' 
  | 'APP_IPHONE_55' 
  | 'APP_IPHONE_67'
  | 'APP_IPHONE_61'
  | 'APP_IPHONE_58'
  | 'APP_IPAD_PRO_3GEN_129'
  | 'APP_IPAD_PRO_129'
  | 'APP_IPAD_PRO_11'
  | 'APP_IPAD_10_9'
  | 'APP_IPAD_10_5'
  | 'APP_IPAD_9_7'
  | 'WATCH_SERIES_10'
  | 'WATCH_SERIES_7'
  | 'WATCH_SERIES_4'
  | 'WATCH_SERIES_3'
  | 'WATCH_ULTRA';

export interface ScreenshotSet {
  id: string;
  type: string;
  attributes: {
    screenshotDisplayType: ScreenshotDisplayType;
    deviceType: string;
  };
}

export interface ListScreenshotSetsResponse {
  data: ScreenshotSet[];
}

export const SCREENSHOT_DIMENSIONS: Record<ScreenshotDisplayType, { width: number; height: number }> = {
  'APP_IPHONE_65': { width: 1284, height: 2778 },
  'APP_IPHONE_55': { width: 1242, height: 2208 },
  'APP_IPHONE_67': { width: 1290, height: 2796 },
  'APP_IPHONE_61': { width: 1179, height: 2556 },
  'APP_IPHONE_58': { width: 1170, height: 2532 },
  'APP_IPAD_PRO_3GEN_129': { width: 2048, height: 2732 },
  'APP_IPAD_PRO_129': { width: 2048, height: 2732 },
  'APP_IPAD_PRO_11': { width: 1668, height: 2388 },
  'APP_IPAD_10_9': { width: 1640, height: 2360 },
  'APP_IPAD_10_5': { width: 1668, height: 2224 },
  'APP_IPAD_9_7': { width: 1536, height: 2048 },
  'WATCH_SERIES_10': { width: 416, height: 496 },
  'WATCH_SERIES_7': { width: 396, height: 484 },
  'WATCH_SERIES_4': { width: 368, height: 448 },
  'WATCH_SERIES_3': { width: 312, height: 390 },
  'WATCH_ULTRA': { width: 410, height: 502 },
};

// --- Screenshot Set types ---

export interface AppScreenshotSetCreateRequest {
  data: {
    type: 'appScreenshotSets';
    attributes: {
      screenshotDisplayType: ScreenshotDisplayType;
    };
    relationships: {
      appStoreVersionLocalization: {
        data: {
          type: 'appStoreVersionLocalizations';
          id: string;
        };
      };
    };
  };
}

export interface AppScreenshotSet {
  id: string;
  type: 'appScreenshotSets';
  attributes: {
    screenshotDisplayType: ScreenshotDisplayType;
  };
  relationships?: Record<string, any>;
  links?: { self: string };
}

export interface AppScreenshotSetResponse {
  data: AppScreenshotSet;
  links?: { self: string };
}

export interface ListAppScreenshotSetsResponse {
  data: AppScreenshotSet[];
  links?: { self?: string; next?: string };
  meta?: { paging?: { total: number; limit: number } };
}

// --- Screenshot types ---

export interface UploadOperation {
  method: string;
  url: string;
  length: number;
  offset: number;
  requestHeaders: { name: string; value: string }[];
}

export interface AppScreenshot {
  id: string;
  type: 'appScreenshots';
  attributes: {
    fileSize: number;
    fileName: string;
    sourceFileChecksum?: string;
    assetDeliveryState?: {
      state: string;
      errors?: { code: string; description: string }[];
    };
    uploadOperations?: UploadOperation[];
    imageAsset?: {
      templateUrl: string;
      width: number;
      height: number;
    };
  };
  links?: { self: string };
}

export interface AppScreenshotResponse {
  data: AppScreenshot;
  links?: { self: string };
}

export interface ListAppScreenshotsResponse {
  data: AppScreenshot[];
  links?: { self?: string; next?: string };
  meta?: { paging?: { total: number; limit: number } };
}

export interface AppScreenshotCreateRequest {
  data: {
    type: 'appScreenshots';
    attributes: {
      fileSize: number;
      fileName: string;
    };
    relationships: {
      appScreenshotSet: {
        data: {
          type: 'appScreenshotSets';
          id: string;
        };
      };
    };
  };
}

export interface AppScreenshotCommitRequest {
  data: {
    type: 'appScreenshots';
    id: string;
    attributes: {
      sourceFileChecksum: string;
      uploaded: true;
    };
  };
}