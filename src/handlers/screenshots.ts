import fs from 'fs/promises';
import crypto from 'crypto';
import path from 'path';
import { AppStoreConnectClient } from '../services/index.js';
import {
  ScreenshotDisplayType,
  AppScreenshotSetCreateRequest,
  AppScreenshotSetResponse,
  ListAppScreenshotSetsResponse,
  AppScreenshotCreateRequest,
  AppScreenshotCommitRequest,
  AppScreenshotResponse,
  ListAppScreenshotsResponse,
} from '../types/index.js';
import { validateRequired, sanitizeLimit } from '../utils/index.js';

export class ScreenshotHandlers {
  constructor(private client: AppStoreConnectClient) {}

  async createAppScreenshotSet(args: {
    appStoreVersionLocalizationId: string;
    screenshotDisplayType: ScreenshotDisplayType;
  }): Promise<AppScreenshotSetResponse> {
    const { appStoreVersionLocalizationId, screenshotDisplayType } = args;

    validateRequired(args, ['appStoreVersionLocalizationId', 'screenshotDisplayType']);

    const requestData: AppScreenshotSetCreateRequest = {
      data: {
        type: 'appScreenshotSets',
        attributes: {
          screenshotDisplayType,
        },
        relationships: {
          appStoreVersionLocalization: {
            data: {
              type: 'appStoreVersionLocalizations',
              id: appStoreVersionLocalizationId,
            },
          },
        },
      },
    };

    return this.client.post<AppScreenshotSetResponse>(
      '/appScreenshotSets',
      requestData
    );
  }

  async listAppScreenshotSets(args: {
    appStoreVersionLocalizationId: string;
    limit?: number;
  }): Promise<ListAppScreenshotSetsResponse> {
    const { appStoreVersionLocalizationId, limit = 100 } = args;

    validateRequired(args, ['appStoreVersionLocalizationId']);

    const params: Record<string, any> = {
      limit: sanitizeLimit(limit),
    };

    return this.client.get<ListAppScreenshotSetsResponse>(
      `/appStoreVersionLocalizations/${appStoreVersionLocalizationId}/appScreenshotSets`,
      params
    );
  }

  async listAppScreenshots(args: {
    appScreenshotSetId: string;
    limit?: number;
  }): Promise<ListAppScreenshotsResponse> {
    const { appScreenshotSetId, limit = 100 } = args;

    validateRequired(args, ['appScreenshotSetId']);

    const params: Record<string, any> = {
      limit: sanitizeLimit(limit),
    };

    return this.client.get<ListAppScreenshotsResponse>(
      `/appScreenshotSets/${appScreenshotSetId}/appScreenshots`,
      params
    );
  }

  async uploadAppScreenshot(args: {
    appScreenshotSetId: string;
    filePath: string;
  }): Promise<AppScreenshotResponse> {
    const { appScreenshotSetId, filePath } = args;

    validateRequired(args, ['appScreenshotSetId', 'filePath']);

    // Step 1: Read the file and compute MD5 checksum
    let fileData: Buffer;
    try {
      fileData = await fs.readFile(filePath);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        throw new Error(`Screenshot file not found: ${filePath}`);
      }
      throw err;
    }
    const fileSize = fileData.length;
    const fileName = path.basename(filePath);
    const checksum = crypto.createHash('md5').update(fileData).digest('hex');

    // Step 2: Reserve the screenshot slot
    const reserveRequest: AppScreenshotCreateRequest = {
      data: {
        type: 'appScreenshots',
        attributes: {
          fileSize,
          fileName,
        },
        relationships: {
          appScreenshotSet: {
            data: {
              type: 'appScreenshotSets',
              id: appScreenshotSetId,
            },
          },
        },
      },
    };

    const reservation = await this.client.post<AppScreenshotResponse>(
      '/appScreenshots',
      reserveRequest
    );

    const uploadOperations = reservation.data.attributes.uploadOperations;
    if (!uploadOperations || uploadOperations.length === 0) {
      throw new Error('No upload operations returned from App Store Connect');
    }

    // Step 3: Upload each chunk
    for (const operation of uploadOperations) {
      const chunk = fileData.subarray(operation.offset, operation.offset + operation.length);
      const headers: Record<string, string> = {};
      for (const header of operation.requestHeaders) {
        headers[header.name] = header.value;
      }
      await this.client.uploadChunk(operation.url, chunk, headers);
    }

    // Step 4: Commit the upload
    const commitRequest: AppScreenshotCommitRequest = {
      data: {
        type: 'appScreenshots',
        id: reservation.data.id,
        attributes: {
          sourceFileChecksum: checksum,
          uploaded: true,
        },
      },
    };

    return this.client.patch<AppScreenshotResponse>(
      `/appScreenshots/${reservation.data.id}`,
      commitRequest
    );
  }

  async deleteAppScreenshot(args: {
    appScreenshotId: string;
  }): Promise<{ success: boolean; message: string }> {
    const { appScreenshotId } = args;

    validateRequired(args, ['appScreenshotId']);

    await this.client.delete(`/appScreenshots/${appScreenshotId}`);
    return { success: true, message: 'Screenshot deleted successfully' };
  }
}
