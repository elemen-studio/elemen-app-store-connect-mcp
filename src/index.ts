#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError
} from "@modelcontextprotocol/sdk/types.js";
import axios from 'axios';

import { AppStoreConnectConfig } from './types/index.js';
import { AppStoreConnectClient } from './services/index.js';
import {
  AppHandlers,
  BetaHandlers,
  BundleHandlers,
  DeviceHandlers,
  UserHandlers,
  AnalyticsHandlers,
  XcodeHandlers,
  LocalizationHandlers,
  ScreenshotHandlers,
  SubscriptionHandlers,
  IapHandlers
} from './handlers/index.js';

// Load environment variables
const config: AppStoreConnectConfig = {
  keyId: process.env.APP_STORE_CONNECT_KEY_ID!,
  issuerId: process.env.APP_STORE_CONNECT_ISSUER_ID!,
  privateKeyPath: process.env.APP_STORE_CONNECT_P8_PATH!,
  vendorNumber: process.env.APP_STORE_CONNECT_VENDOR_NUMBER, // Optional for sales/finance reports
};

class AppStoreConnectServer {
  private server: Server;
  private client: AppStoreConnectClient;
  private appHandlers: AppHandlers;
  private betaHandlers: BetaHandlers;
  private bundleHandlers: BundleHandlers;
  private deviceHandlers: DeviceHandlers;
  private userHandlers: UserHandlers;
  private analyticsHandlers: AnalyticsHandlers;
  private xcodeHandlers: XcodeHandlers;
  private localizationHandlers: LocalizationHandlers;
  private screenshotHandlers: ScreenshotHandlers;
  private subscriptionHandlers: SubscriptionHandlers;
  private iapHandlers: IapHandlers;

  constructor() {
    this.server = new Server({
      name: "appstore-connect-server",
      version: "1.0.0"
    }, {
      capabilities: {
        tools: {}
      }
    });

    this.client = new AppStoreConnectClient(config);
    this.appHandlers = new AppHandlers(this.client);
    this.betaHandlers = new BetaHandlers(this.client);
    this.bundleHandlers = new BundleHandlers(this.client);
    this.deviceHandlers = new DeviceHandlers(this.client);
    this.userHandlers = new UserHandlers(this.client);
    this.analyticsHandlers = new AnalyticsHandlers(this.client, config);
    this.xcodeHandlers = new XcodeHandlers();
    this.localizationHandlers = new LocalizationHandlers(this.client);
    this.screenshotHandlers = new ScreenshotHandlers(this.client);
    this.subscriptionHandlers = new SubscriptionHandlers(this.client);
    this.iapHandlers = new IapHandlers(this.client);

    this.setupHandlers();
  }

  private buildToolsList() {
    const baseTools = [
        // App Management Tools
        {
          name: "list_apps",
          description: "Get a list of all apps in App Store Connect",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Maximum number of apps to return (default: 100)",
                minimum: 1,
                maximum: 200
              }
            }
          }
        },
        {
          name: "get_app_info",
          description: "Get detailed information about a specific app",
          inputSchema: {
            type: "object", 
            properties: {
              appId: {
                type: "string",
                description: "The ID of the app to get information for"
              },
              include: {
                type: "array",
                items: {
                  type: "string",
                  enum: [
                    "appClips", "appInfos", "appStoreVersions", "availableTerritories",
                    "betaAppReviewDetail", "betaGroups", "betaLicenseAgreement", "builds",
                    "endUserLicenseAgreement", "gameCenterEnabledVersions", "inAppPurchases",
                    "preOrder", "prices", "reviewSubmissions"
                  ]
                },
                description: "Optional relationships to include in the response"
              }
            },
            required: ["appId"]
          }
        },

        // App Info & Localization Tools
        {
          name: "list_app_infos",
          description: "List all app infos for an app. Returns app info IDs needed for managing app-level localizations (title, subtitle).",
          inputSchema: {
            type: "object",
            properties: {
              appId: {
                type: "string",
                description: "The ID of the app"
              },
              limit: {
                type: "number",
                description: "Maximum number of results to return (default: 100)",
                minimum: 1,
                maximum: 200
              }
            },
            required: ["appId"]
          }
        },
        {
          name: "list_app_info_localizations",
          description: "List all localizations for an app info. Returns localization IDs and current title/subtitle for each locale.",
          inputSchema: {
            type: "object",
            properties: {
              appInfoId: {
                type: "string",
                description: "The ID of the app info (get this from list_app_infos)"
              },
              limit: {
                type: "number",
                description: "Maximum number of results to return (default: 100)",
                minimum: 1,
                maximum: 200
              }
            },
            required: ["appInfoId"]
          }
        },
        {
          name: "create_app_info_localization",
          description: "Create a new app info localization for a locale (e.g., add French title and subtitle)",
          inputSchema: {
            type: "object",
            properties: {
              appInfoId: {
                type: "string",
                description: "The ID of the app info (get this from list_app_infos)"
              },
              locale: {
                type: "string",
                description: "The locale code (e.g., 'fr-FR', 'ja', 'de-DE')"
              },
              name: {
                type: "string",
                description: "The app title for this locale"
              },
              subtitle: {
                type: "string",
                description: "The app subtitle for this locale"
              },
              privacyPolicyUrl: {
                type: "string",
                description: "Privacy policy URL for this locale"
              },
              privacyChoicesUrl: {
                type: "string",
                description: "Privacy choices URL for this locale"
              },
              privacyPolicyText: {
                type: "string",
                description: "Privacy policy text for this locale"
              }
            },
            required: ["appInfoId", "locale"]
          }
        },
        {
          name: "update_app_info_localization",
          description: "Update a field in an app info localization (e.g., change title or subtitle for a locale)",
          inputSchema: {
            type: "object",
            properties: {
              appInfoLocalizationId: {
                type: "string",
                description: "The ID of the app info localization to update"
              },
              field: {
                type: "string",
                enum: ["name", "subtitle", "privacyPolicyUrl", "privacyChoicesUrl", "privacyPolicyText"],
                description: "The field to update"
              },
              value: {
                type: "string",
                description: "The new value for the field"
              }
            },
            required: ["appInfoLocalizationId", "field", "value"]
          }
        },

        // Beta Testing Tools
        {
          name: "list_beta_groups",
          description: "Get a list of all beta groups (internal and external)",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Maximum number of groups to return (default: 100)",
                minimum: 1,
                maximum: 200
              }
            }
          }
        },
        {
          name: "list_group_testers",
          description: "Get a list of all testers in a specific beta group",
          inputSchema: {
            type: "object",
            properties: {
              groupId: {
                type: "string",
                description: "The ID of the beta group"
              },
              limit: {
                type: "number",
                description: "Maximum number of testers to return (default: 100)",
                minimum: 1,
                maximum: 200
              }
            },
            required: ["groupId"]
          }
        },
        {
          name: "add_tester_to_group",
          description: "Add a new tester to a beta group",
          inputSchema: {
            type: "object",
            properties: {
              groupId: {
                type: "string",
                description: "The ID of the beta group"
              },
              email: {
                type: "string",
                description: "Email address of the tester"
              },
              firstName: {
                type: "string",
                description: "First name of the tester"
              },
              lastName: {
                type: "string",
                description: "Last name of the tester"
              }
            },
            required: ["groupId", "email", "firstName", "lastName"]
          }
        },
        {
          name: "remove_tester_from_group",
          description: "Remove a tester from a beta group",
          inputSchema: {
            type: "object",
            properties: {
              groupId: {
                type: "string",
                description: "The ID of the beta group"
              },
              testerId: {
                type: "string",
                description: "The ID of the beta tester"
              }
            },
            required: ["groupId", "testerId"]
          }
        },
        {
          name: "list_beta_feedback_screenshots",
          description: "List all beta feedback screenshot submissions for an app. This includes feedback with screenshots, device information, and tester comments. You can identify the app using either appId or bundleId.",
          inputSchema: {
            type: "object",
            properties: {
              appId: {
                type: "string",
                description: "The ID of the app to get feedback for (e.g., '6747745091')"
              },
              bundleId: {
                type: "string",
                description: "The bundle ID of the app (e.g., 'com.example.app'). Can be used instead of appId."
              },
              buildId: {
                type: "string",
                description: "Filter by specific build ID (optional)"
              },
              devicePlatform: {
                type: "string",
                enum: ["IOS", "MAC_OS", "TV_OS", "VISION_OS"],
                description: "Filter by device platform (optional)"
              },
              appPlatform: {
                type: "string",
                enum: ["IOS", "MAC_OS", "TV_OS", "VISION_OS"],
                description: "Filter by app platform (optional)"
              },
              deviceModel: {
                type: "string",
                description: "Filter by device model (e.g., 'iPhone15_2') (optional)"
              },
              osVersion: {
                type: "string",
                description: "Filter by OS version (e.g., '18.4.1') (optional)"
              },
              testerId: {
                type: "string",
                description: "Filter by specific tester ID (optional)"
              },
              limit: {
                type: "number",
                description: "Maximum number of feedback items to return (default: 50, max: 200)",
                minimum: 1,
                maximum: 200
              },
              sort: {
                type: "string",
                enum: ["createdDate", "-createdDate"],
                description: "Sort order for results (default: -createdDate for newest first)"
              },
              includeBuilds: {
                type: "boolean",
                description: "Include build information in response (optional)",
                default: false
              },
              includeTesters: {
                type: "boolean",
                description: "Include tester information in response (optional)",
                default: false
              }
            },
            required: []
          }
        },
        {
          name: "get_beta_feedback_screenshot",
          description: "Get detailed information about a specific beta feedback screenshot submission. By default, downloads and returns the screenshot image.",
          inputSchema: {
            type: "object",
            properties: {
              feedbackId: {
                type: "string",
                description: "The ID of the beta feedback screenshot submission"
              },
              includeBuilds: {
                type: "boolean",
                description: "Include build information in response (optional)",
                default: false
              },
              includeTesters: {
                type: "boolean",
                description: "Include tester information in response (optional)",
                default: false
              },
              downloadScreenshot: {
                type: "boolean",
                description: "Download and return the screenshot as an image (default: true)",
                default: true
              }
            },
            required: ["feedbackId"]
          }
        },
        
        // App Store Version Localization Tools
        {
          name: "create_app_store_version",
          description: "Create a new app store version for an app",
          inputSchema: {
            type: "object",
            properties: {
              appId: {
                type: "string",
                description: "The ID of the app"
              },
              platform: {
                type: "string",
                description: "The platform for this version",
                enum: ["IOS", "MAC_OS", "TV_OS", "VISION_OS"]
              },
              versionString: {
                type: "string",
                description: "Version string in format X.Y or X.Y.Z (e.g., '1.0' or '1.0.0')"
              },
              copyright: {
                type: "string",
                description: "Copyright text for this version (optional)"
              },
              releaseType: {
                type: "string",
                description: "How the app should be released",
                enum: ["MANUAL", "AFTER_APPROVAL", "SCHEDULED"]
              },
              earliestReleaseDate: {
                type: "string",
                description: "Earliest release date in ISO 8601 format (required when releaseType is SCHEDULED)"
              },
              buildId: {
                type: "string",
                description: "ID of the build to associate with this version (optional)"
              }
            },
            required: ["appId", "platform", "versionString"]
          }
        },
        {
          name: "list_app_store_versions",
          description: "Get all app store versions for a specific app",
          inputSchema: {
            type: "object",
            properties: {
              appId: {
                type: "string",
                description: "The ID of the app"
              },
              limit: {
                type: "number",
                description: "Maximum number of versions to return (default: 100)",
                minimum: 1,
                maximum: 200
              },
              filter: {
                type: "object",
                properties: {
                  platform: {
                    type: "string",
                    description: "Filter by platform (IOS, MAC_OS, TV_OS)",
                    enum: ["IOS", "MAC_OS", "TV_OS"]
                  },
                  versionString: {
                    type: "string",
                    description: "Filter by version string (e.g., '1.0.0')"
                  },
                  appStoreState: {
                    type: "string",
                    description: "Filter by app store state",
                    enum: [
                      "DEVELOPER_REMOVED_FROM_SALE",
                      "DEVELOPER_REJECTED", 
                      "IN_REVIEW",
                      "INVALID_BINARY",
                      "METADATA_REJECTED",
                      "PENDING_APPLE_RELEASE",
                      "PENDING_CONTRACT",
                      "PENDING_DEVELOPER_RELEASE",
                      "PREPARE_FOR_SUBMISSION",
                      "PREORDER_READY_FOR_SALE",
                      "PROCESSING_FOR_APP_STORE",
                      "READY_FOR_SALE",
                      "REJECTED",
                      "REMOVED_FROM_SALE",
                      "WAITING_FOR_EXPORT_COMPLIANCE",
                      "WAITING_FOR_REVIEW",
                      "REPLACED_WITH_NEW_VERSION"
                    ]
                  }
                },
                description: "Optional filters for app store versions"
              }
            },
            required: ["appId"]
          }
        },
        {
          name: "list_app_store_version_localizations",
          description: "Get all localizations for a specific app store version",
          inputSchema: {
            type: "object",
            properties: {
              appStoreVersionId: {
                type: "string",
                description: "The ID of the app store version"
              },
              limit: {
                type: "number",
                description: "Maximum number of localizations to return (default: 100)",
                minimum: 1,
                maximum: 200
              }
            },
            required: ["appStoreVersionId"]
          }
        },
        {
          name: "create_app_store_version_localization",
          description: "Create a new localization for an app store version (e.g., add French, Japanese, etc.)",
          inputSchema: {
            type: "object",
            properties: {
              appStoreVersionId: {
                type: "string",
                description: "The ID of the app store version"
              },
              locale: {
                type: "string",
                description: "The locale code (e.g., 'en-US', 'fr-FR', 'ja', 'de-DE', 'es-ES')"
              },
              description: {
                type: "string",
                description: "App description for this locale"
              },
              keywords: {
                type: "string",
                description: "Search keywords for this locale (comma-separated)"
              },
              marketingUrl: {
                type: "string",
                description: "Marketing URL for this locale"
              },
              promotionalText: {
                type: "string",
                description: "Promotional text for this locale"
              },
              supportUrl: {
                type: "string",
                description: "Support URL for this locale"
              },
              whatsNew: {
                type: "string",
                description: "What's new text for this locale"
              }
            },
            required: ["appStoreVersionId", "locale"]
          }
        },
        {
          name: "get_app_store_version_localization",
          description: "Get detailed information about a specific app store version localization",
          inputSchema: {
            type: "object",
            properties: {
              localizationId: {
                type: "string",
                description: "The ID of the app store version localization"
              }
            },
            required: ["localizationId"]
          }
        },
        {
          name: "update_app_store_version_localization",
          description: "Update a specific field in an app store version localization",
          inputSchema: {
            type: "object",
            properties: {
              localizationId: {
                type: "string",
                description: "The ID of the app store version localization to update"
              },
              field: {
                type: "string",
                enum: ["description", "keywords", "marketingUrl", "promotionalText", "supportUrl", "whatsNew"],
                description: "The field to update"
              },
              value: {
                type: "string",
                description: "The new value for the field"
              }
            },
            required: ["localizationId", "field", "value"]
          }
        },

        // Bundle ID Tools
        {
          name: "create_bundle_id",
          description: "Register a new bundle ID for app development",
          inputSchema: {
            type: "object",
            properties: {
              identifier: {
                type: "string",
                description: "The bundle ID string (e.g., 'com.example.app')"
              },
              name: {
                type: "string",
                description: "A name for the bundle ID"
              },
              platform: {
                type: "string",
                enum: ["IOS", "MAC_OS", "UNIVERSAL"],
                description: "The platform for this bundle ID"
              },
              seedId: {
                type: "string",
                description: "Your team's seed ID (optional)"
              }
            },
            required: ["identifier", "name", "platform"]
          }
        },
        {
          name: "list_bundle_ids",
          description: "Find and list bundle IDs that are registered to your team",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Maximum number of bundle IDs to return (default: 100, max: 200)",
                minimum: 1,
                maximum: 200
              },
              sort: {
                type: "string",
                description: "Sort order for the results",
                enum: [
                  "name", "-name", "platform", "-platform", 
                  "identifier", "-identifier", "seedId", "-seedId", "id", "-id"
                ]
              },
              filter: {
                type: "object",
                properties: {
                  identifier: { type: "string", description: "Filter by bundle identifier" },
                  name: { type: "string", description: "Filter by name" },
                  platform: { 
                    type: "string", 
                    description: "Filter by platform",
                    enum: ["IOS", "MAC_OS", "UNIVERSAL"]
                  },
                  seedId: { type: "string", description: "Filter by seed ID" }
                }
              },
              include: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["profiles", "bundleIdCapabilities", "app"]
                },
                description: "Related resources to include in the response"
              }
            }
          }
        },
        {
          name: "get_bundle_id_info",
          description: "Get detailed information about a specific bundle ID",
          inputSchema: {
            type: "object",
            properties: {
              bundleIdId: {
                type: "string",
                description: "The ID of the bundle ID to get information for"
              },
              include: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["profiles", "bundleIdCapabilities", "app"]
                },
                description: "Optional relationships to include in the response"
              },
              fields: {
                type: "object",
                properties: {
                  bundleIds: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: ["name", "platform", "identifier", "seedId"]
                    },
                    description: "Fields to include for the bundle ID"
                  }
                },
                description: "Specific fields to include in the response"
              }
            },
            required: ["bundleIdId"]
          }
        },
        {
          name: "enable_bundle_capability",
          description: "Enable a capability for a bundle ID",
          inputSchema: {
            type: "object",
            properties: {
              bundleIdId: {
                type: "string",
                description: "The ID of the bundle ID"
              },
              capabilityType: {
                type: "string",
                description: "The type of capability to enable",
                enum: [
                  "ICLOUD", "IN_APP_PURCHASE", "GAME_CENTER", "PUSH_NOTIFICATIONS", "WALLET",
                  "INTER_APP_AUDIO", "MAPS", "ASSOCIATED_DOMAINS", "PERSONAL_VPN", "APP_GROUPS",
                  "HEALTHKIT", "HOMEKIT", "WIRELESS_ACCESSORY_CONFIGURATION", "APPLE_PAY",
                  "DATA_PROTECTION", "SIRIKIT", "NETWORK_EXTENSIONS", "MULTIPATH", "HOT_SPOT",
                  "NFC_TAG_READING", "CLASSKIT", "AUTOFILL_CREDENTIAL_PROVIDER", "ACCESS_WIFI_INFORMATION",
                  "NETWORK_CUSTOM_PROTOCOL", "COREMEDIA_HLS_LOW_LATENCY", "SYSTEM_EXTENSION_INSTALL",
                  "USER_MANAGEMENT", "APPLE_ID_AUTH"
                ]
              },
              settings: {
                type: "array",
                description: "Optional capability settings",
                items: {
                  type: "object",
                  properties: {
                    key: { type: "string", description: "The setting key" },
                    options: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          key: { type: "string" },
                          enabled: { type: "boolean" }
                        }
                      }
                    }
                  }
                }
              }
            },
            required: ["bundleIdId", "capabilityType"]
          }
        },
        {
          name: "disable_bundle_capability",
          description: "Disable a capability for a bundle ID",
          inputSchema: {
            type: "object",
            properties: {
              capabilityId: {
                type: "string",
                description: "The ID of the capability to disable"
              }
            },
            required: ["capabilityId"]
          }
        },

        // Device Management Tools
        {
          name: "list_devices",
          description: "Get a list of all devices registered to your team",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Maximum number of devices to return (default: 100, max: 200)",
                minimum: 1,
                maximum: 200
              },
              sort: {
                type: "string",
                description: "Sort order for the results",
                enum: [
                  "name", "-name", "platform", "-platform", "status", "-status",
                  "udid", "-udid", "deviceClass", "-deviceClass", "model", "-model",
                  "addedDate", "-addedDate"
                ]
              },
              filter: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Filter by device name" },
                  platform: { 
                    type: "string", 
                    description: "Filter by platform",
                    enum: ["IOS", "MAC_OS"]
                  },
                  status: { 
                    type: "string", 
                    description: "Filter by status",
                    enum: ["ENABLED", "DISABLED"]
                  },
                  udid: { type: "string", description: "Filter by device UDID" },
                  deviceClass: { 
                    type: "string", 
                    description: "Filter by device class",
                    enum: ["APPLE_WATCH", "IPAD", "IPHONE", "IPOD", "APPLE_TV", "MAC"]
                  }
                }
              },
              fields: {
                type: "object",
                properties: {
                  devices: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: ["name", "platform", "udid", "deviceClass", "status", "model", "addedDate"]
                    },
                    description: "Fields to include for each device"
                  }
                }
              }
            }
          }
        },

        // User Management Tools
        {
          name: "list_users",
          description: "Get a list of all users registered on your App Store Connect team",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Maximum number of users to return (default: 100, max: 200)",
                minimum: 1,
                maximum: 200
              },
              sort: {
                type: "string",
                description: "Sort order for the results",
                enum: ["username", "-username", "firstName", "-firstName", "lastName", "-lastName", "roles", "-roles"]
              },
              filter: {
                type: "object",
                properties: {
                  username: { type: "string", description: "Filter by username" },
                  roles: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: [
                        "ADMIN", "FINANCE", "TECHNICAL", "SALES", "MARKETING", "DEVELOPER",
                        "ACCOUNT_HOLDER", "READ_ONLY", "APP_MANAGER", "ACCESS_TO_REPORTS", "CUSTOMER_SUPPORT"
                      ]
                    },
                    description: "Filter by user roles"
                  },
                  visibleApps: {
                    type: "array",
                    items: { type: "string" },
                    description: "Filter by apps the user can see (app IDs)"
                  }
                }
              },
              include: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["visibleApps"]
                },
                description: "Related resources to include in the response"
              }
            }
          }
        },

        // Analytics & Reports Tools
        {
          name: "create_analytics_report_request",
          description: "Create a new analytics report request for an app",
          inputSchema: {
            type: "object",
            properties: {
              appId: {
                type: "string",
                description: "The ID of the app to generate analytics reports for"
              },
              accessType: {
                type: "string",
                enum: ["ONGOING", "ONE_TIME_SNAPSHOT"],
                description: "Access type for the analytics report (ONGOING for daily data, ONE_TIME_SNAPSHOT for historical data)",
                default: "ONE_TIME_SNAPSHOT"
              }
            },
            required: ["appId"]
          }
        },
        {
          name: "list_analytics_reports",
          description: "Get available analytics reports for a specific report request",
          inputSchema: {
            type: "object",
            properties: {
              reportRequestId: {
                type: "string",
                description: "The ID of the analytics report request"
              },
              limit: {
                type: "number",
                description: "Maximum number of reports to return (default: 100)",
                minimum: 1,
                maximum: 200
              },
              filter: {
                type: "object",
                properties: {
                  category: {
                    type: "string",
                    enum: ["APP_STORE_ENGAGEMENT", "APP_STORE_COMMERCE", "APP_USAGE", "FRAMEWORKS_USAGE", "PERFORMANCE"],
                    description: "Filter by report category"
                  }
                }
              }
            },
            required: ["reportRequestId"]
          }
        },
        {
          name: "list_analytics_report_segments",
          description: "Get segments for a specific analytics report (contains download URLs)",
          inputSchema: {
            type: "object",
            properties: {
              reportId: {
                type: "string",
                description: "The ID of the analytics report"
              },
              limit: {
                type: "number",
                description: "Maximum number of segments to return (default: 100)",
                minimum: 1,
                maximum: 200
              }
            },
            required: ["reportId"]
          }
        },
        {
          name: "download_analytics_report_segment",
          description: "Download data from an analytics report segment URL",
          inputSchema: {
            type: "object",
            properties: {
              segmentUrl: {
                type: "string",
                description: "The URL of the analytics report segment to download"
              }
            },
            required: ["segmentUrl"]
          }
        },

        // Screenshot Management Tools
        {
          name: "create_app_screenshot_set",
          description: "Create a screenshot set for a specific localization and display type",
          inputSchema: {
            type: "object",
            properties: {
              appStoreVersionLocalizationId: {
                type: "string",
                description: "The ID of the app store version localization"
              },
              screenshotDisplayType: {
                type: "string",
                description: "The display type for the screenshot set",
                enum: [
                  "APP_IPHONE_67",
                  "APP_IPHONE_65",
                  "APP_IPHONE_61",
                  "APP_IPHONE_58",
                  "APP_IPHONE_55",
                  "APP_IPAD_PRO_3GEN_129",
                  "APP_IPAD_PRO_129",
                  "APP_IPAD_PRO_11",
                  "APP_IPAD_10_9",
                  "APP_IPAD_10_5",
                  "APP_IPAD_9_7",
                  "WATCH_SERIES_10",
                  "WATCH_SERIES_7",
                  "WATCH_SERIES_4",
                  "WATCH_SERIES_3",
                  "WATCH_ULTRA"
                ]
              }
            },
            required: ["appStoreVersionLocalizationId", "screenshotDisplayType"]
          }
        },
        {
          name: "list_app_screenshot_sets",
          description: "List all screenshot sets for a specific app store version localization",
          inputSchema: {
            type: "object",
            properties: {
              appStoreVersionLocalizationId: {
                type: "string",
                description: "The ID of the app store version localization"
              },
              limit: {
                type: "number",
                description: "Maximum number of screenshot sets to return (default: 100)",
                minimum: 1,
                maximum: 200
              }
            },
            required: ["appStoreVersionLocalizationId"]
          }
        },
        {
          name: "list_app_screenshots",
          description: "List all screenshots in a screenshot set",
          inputSchema: {
            type: "object",
            properties: {
              appScreenshotSetId: {
                type: "string",
                description: "The ID of the screenshot set"
              },
              limit: {
                type: "number",
                description: "Maximum number of screenshots to return (default: 100)",
                minimum: 1,
                maximum: 200
              }
            },
            required: ["appScreenshotSetId"]
          }
        },
        {
          name: "upload_app_screenshot",
          description: "Upload a screenshot image file to a screenshot set. Reads the file from the local filesystem, uploads it using Apple's chunked upload protocol, and commits it.",
          inputSchema: {
            type: "object",
            properties: {
              appScreenshotSetId: {
                type: "string",
                description: "The ID of the screenshot set to upload to"
              },
              filePath: {
                type: "string",
                description: "Absolute path to the screenshot image file on the local filesystem (e.g., /Users/you/screenshots/iphone_1.png)"
              }
            },
            required: ["appScreenshotSetId", "filePath"]
          }
        },
        {
          name: "delete_app_screenshot",
          description: "Delete a specific screenshot from App Store Connect",
          inputSchema: {
            type: "object",
            properties: {
              appScreenshotId: {
                type: "string",
                description: "The ID of the screenshot to delete"
              }
            },
            required: ["appScreenshotId"]
          }
        },

        // Subscription Group Tools
        {
          name: "list_subscription_groups",
          description: "List all subscription groups for an app. Every auto-renewable subscription belongs to a group.",
          inputSchema: {
            type: "object",
            properties: {
              appId: { type: "string", description: "The app ID" },
              limit: { type: "number", description: "Maximum number of results", default: 100 }
            },
            required: ["appId"]
          }
        },
        {
          name: "create_subscription_group",
          description: "Create a new subscription group for an app. The referenceName is internal-only; user-visible names are set via group localizations.",
          inputSchema: {
            type: "object",
            properties: {
              appId: { type: "string", description: "The app ID" },
              referenceName: { type: "string", description: "Internal reference name for the group" }
            },
            required: ["appId", "referenceName"]
          }
        },
        {
          name: "update_subscription_group",
          description: "Update a subscription group's reference name",
          inputSchema: {
            type: "object",
            properties: {
              groupId: { type: "string" },
              referenceName: { type: "string" }
            },
            required: ["groupId", "referenceName"]
          }
        },
        {
          name: "delete_subscription_group",
          description: "Delete a subscription group. Only allowed if no approved subscriptions remain in the group.",
          inputSchema: {
            type: "object",
            properties: { groupId: { type: "string" } },
            required: ["groupId"]
          }
        },

        // Subscription Group Localization Tools
        {
          name: "list_subscription_group_localizations",
          description: "List localizations for a subscription group (the user-visible group name shown on the manage-subscriptions screen)",
          inputSchema: {
            type: "object",
            properties: {
              groupId: { type: "string" },
              limit: { type: "number", default: 100 }
            },
            required: ["groupId"]
          }
        },
        {
          name: "create_subscription_group_localization",
          description: "Create a localization for a subscription group",
          inputSchema: {
            type: "object",
            properties: {
              groupId: { type: "string" },
              locale: { type: "string", description: "Locale code (e.g., 'en-US')" },
              name: { type: "string", description: "User-visible group name" },
              customAppName: { type: "string", description: "Optional custom app name override for this locale" }
            },
            required: ["groupId", "locale", "name"]
          }
        },
        {
          name: "update_subscription_group_localization",
          description: "Update a subscription group localization",
          inputSchema: {
            type: "object",
            properties: {
              localizationId: { type: "string" },
              name: { type: "string" },
              customAppName: { type: "string" }
            },
            required: ["localizationId"]
          }
        },
        {
          name: "delete_subscription_group_localization",
          description: "Delete a subscription group localization",
          inputSchema: {
            type: "object",
            properties: { localizationId: { type: "string" } },
            required: ["localizationId"]
          }
        },

        // Subscription Tools
        {
          name: "list_subscriptions",
          description: "List all auto-renewable subscriptions in a group",
          inputSchema: {
            type: "object",
            properties: {
              groupId: { type: "string" },
              limit: { type: "number", default: 100 }
            },
            required: ["groupId"]
          }
        },
        {
          name: "get_subscription",
          description: "Get details of a single subscription",
          inputSchema: {
            type: "object",
            properties: { subscriptionId: { type: "string" } },
            required: ["subscriptionId"]
          }
        },
        {
          name: "create_subscription",
          description: "Create an auto-renewable subscription. NOTE: productId is immutable after creation. groupLevel controls upgrade/downgrade ordering within the group (1 = highest tier).",
          inputSchema: {
            type: "object",
            properties: {
              groupId: { type: "string" },
              productId: { type: "string", description: "Globally unique product ID (immutable)" },
              name: { type: "string", description: "Internal reference name" },
              subscriptionPeriod: {
                type: "string",
                enum: ["ONE_WEEK", "ONE_MONTH", "TWO_MONTHS", "THREE_MONTHS", "SIX_MONTHS", "ONE_YEAR"]
              },
              groupLevel: { type: "number", description: "Family rank within the group (1 = highest)" },
              familySharable: { type: "boolean" },
              reviewNote: { type: "string" },
              availableInAllTerritories: { type: "boolean" }
            },
            required: ["groupId", "productId", "name", "subscriptionPeriod", "groupLevel"]
          }
        },
        {
          name: "update_subscription",
          description: "Update a subscription. productId cannot be changed.",
          inputSchema: {
            type: "object",
            properties: {
              subscriptionId: { type: "string" },
              name: { type: "string" },
              subscriptionPeriod: {
                type: "string",
                enum: ["ONE_WEEK", "ONE_MONTH", "TWO_MONTHS", "THREE_MONTHS", "SIX_MONTHS", "ONE_YEAR"]
              },
              groupLevel: { type: "number" },
              familySharable: { type: "boolean" },
              reviewNote: { type: "string" },
              availableInAllTerritories: { type: "boolean" }
            },
            required: ["subscriptionId"]
          }
        },
        {
          name: "delete_subscription",
          description: "Delete a subscription (only allowed if it has never been approved)",
          inputSchema: {
            type: "object",
            properties: { subscriptionId: { type: "string" } },
            required: ["subscriptionId"]
          }
        },

        // Subscription Localization Tools
        {
          name: "list_subscription_localizations",
          description: "List localizations for a subscription (display name + description per locale)",
          inputSchema: {
            type: "object",
            properties: {
              subscriptionId: { type: "string" },
              limit: { type: "number", default: 100 }
            },
            required: ["subscriptionId"]
          }
        },
        {
          name: "create_subscription_localization",
          description: "Create a subscription localization. name max 30 chars, description max 45 chars.",
          inputSchema: {
            type: "object",
            properties: {
              subscriptionId: { type: "string" },
              locale: { type: "string" },
              name: { type: "string" },
              description: { type: "string" }
            },
            required: ["subscriptionId", "locale", "name"]
          }
        },
        {
          name: "update_subscription_localization",
          description: "Update a subscription localization",
          inputSchema: {
            type: "object",
            properties: {
              localizationId: { type: "string" },
              name: { type: "string" },
              description: { type: "string" }
            },
            required: ["localizationId"]
          }
        },
        {
          name: "delete_subscription_localization",
          description: "Delete a subscription localization",
          inputSchema: {
            type: "object",
            properties: { localizationId: { type: "string" } },
            required: ["localizationId"]
          }
        },

        // Subscription Pricing Tools
        {
          name: "list_subscription_price_points",
          description: "List available price points for a subscription in a territory. Apple uses a fixed catalog of price points per territory; you must reference one of these IDs when creating a subscriptionPrice. Filter by customerPrice in the response to find your target.",
          inputSchema: {
            type: "object",
            properties: {
              subscriptionId: { type: "string" },
              territory: { type: "string", description: "Three-letter territory code (e.g., 'USA')" },
              limit: { type: "number", default: 100 }
            },
            required: ["subscriptionId", "territory"]
          }
        },
        {
          name: "list_subscription_prices",
          description: "List the current set prices (one per priced territory) for a subscription",
          inputSchema: {
            type: "object",
            properties: {
              subscriptionId: { type: "string" },
              limit: { type: "number", default: 100 }
            },
            required: ["subscriptionId"]
          }
        },
        {
          name: "create_subscription_price",
          description: "Set a price for a subscription in one territory by referencing a price point from the catalog. Call list_subscription_price_points first to find the pricePointId.",
          inputSchema: {
            type: "object",
            properties: {
              subscriptionId: { type: "string" },
              pricePointId: { type: "string", description: "ID from list_subscription_price_points" },
              territory: { type: "string", description: "Three-letter territory code (e.g., 'USA')" },
              startDate: { type: "string", description: "ISO 8601 start date. Omit for immediate." },
              preserveCurrentPrice: { type: "boolean", description: "If true, existing subscribers keep their current price" }
            },
            required: ["subscriptionId", "pricePointId", "territory"]
          }
        },
        {
          name: "delete_subscription_price",
          description: "Remove a scheduled or active subscription price",
          inputSchema: {
            type: "object",
            properties: { priceId: { type: "string" } },
            required: ["priceId"]
          }
        },

        // In-App Purchase (v2) Tools
        {
          name: "list_in_app_purchases",
          description: "List one-time in-app purchases for an app (consumables, non-consumables, non-renewing subscriptions). Uses the v2 endpoint.",
          inputSchema: {
            type: "object",
            properties: {
              appId: { type: "string" },
              limit: { type: "number", default: 100 }
            },
            required: ["appId"]
          }
        },
        {
          name: "get_in_app_purchase",
          description: "Get details of a single in-app purchase",
          inputSchema: {
            type: "object",
            properties: { iapId: { type: "string" } },
            required: ["iapId"]
          }
        },
        {
          name: "create_in_app_purchase",
          description: "Create a one-time in-app purchase. NOTE: productId is immutable after creation.",
          inputSchema: {
            type: "object",
            properties: {
              appId: { type: "string" },
              productId: { type: "string" },
              name: { type: "string", description: "Internal reference name" },
              inAppPurchaseType: {
                type: "string",
                enum: ["CONSUMABLE", "NON_CONSUMABLE", "NON_RENEWING_SUBSCRIPTION"]
              },
              familySharable: { type: "boolean" },
              reviewNote: { type: "string" },
              availableInAllTerritories: { type: "boolean" }
            },
            required: ["appId", "productId", "name", "inAppPurchaseType"]
          }
        },
        {
          name: "update_in_app_purchase",
          description: "Update an in-app purchase. productId and inAppPurchaseType cannot be changed.",
          inputSchema: {
            type: "object",
            properties: {
              iapId: { type: "string" },
              name: { type: "string" },
              reviewNote: { type: "string" },
              familySharable: { type: "boolean" },
              availableInAllTerritories: { type: "boolean" }
            },
            required: ["iapId"]
          }
        },
        {
          name: "delete_in_app_purchase",
          description: "Delete an in-app purchase (only allowed if it has never been approved)",
          inputSchema: {
            type: "object",
            properties: { iapId: { type: "string" } },
            required: ["iapId"]
          }
        },
        {
          name: "list_iap_localizations",
          description: "List localizations for an in-app purchase",
          inputSchema: {
            type: "object",
            properties: {
              iapId: { type: "string" },
              limit: { type: "number", default: 100 }
            },
            required: ["iapId"]
          }
        },
        {
          name: "create_iap_localization",
          description: "Create an IAP localization. name max 30 chars, description max 45 chars.",
          inputSchema: {
            type: "object",
            properties: {
              iapId: { type: "string" },
              locale: { type: "string" },
              name: { type: "string" },
              description: { type: "string" }
            },
            required: ["iapId", "locale", "name"]
          }
        },
        {
          name: "update_iap_localization",
          description: "Update an IAP localization",
          inputSchema: {
            type: "object",
            properties: {
              localizationId: { type: "string" },
              name: { type: "string" },
              description: { type: "string" }
            },
            required: ["localizationId"]
          }
        },
        {
          name: "delete_iap_localization",
          description: "Delete an IAP localization",
          inputSchema: {
            type: "object",
            properties: { localizationId: { type: "string" } },
            required: ["localizationId"]
          }
        },
        {
          name: "list_iap_price_points",
          description: "List available price points for an IAP in a territory. Catalog-based — reference these IDs when setting the schedule.",
          inputSchema: {
            type: "object",
            properties: {
              iapId: { type: "string" },
              territory: { type: "string", description: "Three-letter territory code (e.g., 'USA')" },
              limit: { type: "number", default: 100 }
            },
            required: ["iapId", "territory"]
          }
        },
        {
          name: "get_iap_price_schedule",
          description: "Get the current price schedule for an IAP",
          inputSchema: {
            type: "object",
            properties: { iapId: { type: "string" } },
            required: ["iapId"]
          }
        },
        {
          name: "set_iap_price_schedule",
          description: "Replace the entire price schedule for an IAP. The baseTerritory is the reference territory Apple uses to derive prices in territories you didn't explicitly price. Call list_iap_price_points per territory first to obtain pricePointIds.",
          inputSchema: {
            type: "object",
            properties: {
              iapId: { type: "string" },
              baseTerritory: { type: "string", description: "Three-letter territory code used as the base (e.g., 'USA')" },
              prices: {
                type: "array",
                description: "Array of price entries — one per territory you want to set explicitly",
                items: {
                  type: "object",
                  properties: {
                    pricePointId: { type: "string" },
                    territory: { type: "string" },
                    startDate: { type: "string", description: "ISO 8601, optional" },
                    endDate: { type: "string", description: "ISO 8601, optional" }
                  },
                  required: ["pricePointId", "territory"]
                }
              }
            },
            required: ["iapId", "baseTerritory", "prices"]
          }
        },

        // Xcode Development Tools
        {
          name: "list_schemes",
          description: "List all available schemes in an Xcode project or workspace",
          inputSchema: {
            type: "object",
            properties: {
              projectPath: {
                type: "string",
                description: "Path to the Xcode project (.xcodeproj) or workspace (.xcworkspace)"
              }
            },
            required: ["projectPath"]
          }
        }
    ];

    // Sales and Finance Report tools - only available if vendor number is configured
    const paymentReportTools = [
      {
        name: "download_sales_report",
        description: "Download sales and trends reports",
        inputSchema: {
          type: "object",
          properties: {
            vendorNumber: {
              type: "string",
              description: "Your vendor number from App Store Connect (optional if set as environment variable)",
              default: config.vendorNumber
            },
            reportType: {
              type: "string",
              enum: ["SALES"],
              description: "Type of report to download",
              default: "SALES"
            },
            reportSubType: {
              type: "string",
              enum: ["SUMMARY", "DETAILED"],
              description: "Sub-type of the report",
              default: "SUMMARY"
            },
            frequency: {
              type: "string",
              enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"],
              description: "Frequency of the report",
              default: "MONTHLY"
            },
            reportDate: {
              type: "string",
              description: "Report date in YYYY-MM format (e.g., '2024-01')"
            }
          },
          required: ["reportDate"]
        }
      },
      {
        name: "download_finance_report",
        description: "Download finance reports for a specific region",
        inputSchema: {
          type: "object",
          properties: {
            vendorNumber: {
              type: "string",
              description: "Your vendor number from App Store Connect (optional if set as environment variable)",
              default: config.vendorNumber
            },
            reportDate: {
              type: "string",
              description: "Report date in YYYY-MM format (e.g., '2024-01')"
            },
            regionCode: {
              type: "string",
              description: "Region code (e.g., 'Z1' for worldwide, 'WW' for Europe)"
            }
          },
          required: ["reportDate", "regionCode"]
        }
      }
    ];

    // Only include payment report tools if vendor number is configured
    if (config.vendorNumber) {
      return [...baseTools, ...paymentReportTools];
    }

    return baseTools;
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.buildToolsList()
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const args = request.params.arguments || {};
        
        // Helper to format responses
        const formatResponse = (data: any) => {
          return {
            content: [{
              type: "text",
              text: JSON.stringify(data, null, 2)
            }]
          };
        };
        
        switch (request.params.name) {
          // App Management
          case "list_apps":
            const appsData = await this.appHandlers.listApps(args as any);
            return formatResponse(appsData);
          
          case "get_app_info":
            const appInfo = await this.appHandlers.getAppInfo(args as any);
            return formatResponse(appInfo);

          // App Info Localizations
          case "list_app_infos":
            return formatResponse(await this.appHandlers.listAppInfos(args as any));

          case "list_app_info_localizations":
            return formatResponse(await this.appHandlers.listAppInfoLocalizations(args as any));

          case "create_app_info_localization":
            return formatResponse(await this.appHandlers.createAppInfoLocalization(args as any));

          case "update_app_info_localization":
            return formatResponse(await this.appHandlers.updateAppInfoLocalization(args as any));

          // Beta Testing
          case "list_beta_groups":
            return formatResponse(await this.betaHandlers.listBetaGroups(args as any));

          case "list_group_testers":
            return formatResponse(await this.betaHandlers.listGroupTesters(args as any));

          case "add_tester_to_group":
            return formatResponse(await this.betaHandlers.addTesterToGroup(args as any));

          case "remove_tester_from_group":
            return formatResponse(await this.betaHandlers.removeTesterFromGroup(args as any));
          
          case "list_beta_feedback_screenshots":
            const feedbackData = await this.betaHandlers.listBetaFeedbackScreenshots(args as any);
            return formatResponse(feedbackData);
          
          case "get_beta_feedback_screenshot":
            const result = await this.betaHandlers.getBetaFeedbackScreenshot(args as any);
            // If the result already contains content (image), return it directly
            if (result.content) {
              return result;
            }
            // Otherwise format as text
            return formatResponse(result);

          // App Store Version Localizations
          case "create_app_store_version":
            return formatResponse(await this.localizationHandlers.createAppStoreVersion(args as any));

          case "list_app_store_versions":
            return formatResponse(await this.localizationHandlers.listAppStoreVersions(args as any));

          case "list_app_store_version_localizations":
            return formatResponse(await this.localizationHandlers.listAppStoreVersionLocalizations(args as any));

          case "create_app_store_version_localization":
            return formatResponse(await this.localizationHandlers.createAppStoreVersionLocalization(args as any));

          case "get_app_store_version_localization":
            return formatResponse(await this.localizationHandlers.getAppStoreVersionLocalization(args as any));

          case "update_app_store_version_localization":
            return formatResponse(await this.localizationHandlers.updateAppStoreVersionLocalization(args as any));

          // Screenshot Management
          case "create_app_screenshot_set":
            return formatResponse(await this.screenshotHandlers.createAppScreenshotSet(args as any));

          case "list_app_screenshot_sets":
            return formatResponse(await this.screenshotHandlers.listAppScreenshotSets(args as any));

          case "list_app_screenshots":
            return formatResponse(await this.screenshotHandlers.listAppScreenshots(args as any));

          case "upload_app_screenshot":
            return formatResponse(await this.screenshotHandlers.uploadAppScreenshot(args as any));

          case "delete_app_screenshot":
            return formatResponse(await this.screenshotHandlers.deleteAppScreenshot(args as any));

          // Bundle IDs
          case "create_bundle_id":
            return formatResponse(await this.bundleHandlers.createBundleId(args as any));

          case "list_bundle_ids":
            return formatResponse(await this.bundleHandlers.listBundleIds(args as any));

          case "get_bundle_id_info":
            return formatResponse(await this.bundleHandlers.getBundleIdInfo(args as any));

          case "enable_bundle_capability":
            return formatResponse(await this.bundleHandlers.enableBundleCapability(args as any));

          case "disable_bundle_capability":
            return formatResponse(await this.bundleHandlers.disableBundleCapability(args as any));

          // Devices
          case "list_devices":
            return formatResponse(await this.deviceHandlers.listDevices(args as any));

          // Users
          case "list_users":
            return formatResponse(await this.userHandlers.listUsers(args as any));

          // Analytics & Reports
          case "create_analytics_report_request":
            return formatResponse(await this.analyticsHandlers.createAnalyticsReportRequest(args as any));

          case "list_analytics_reports":
            return formatResponse(await this.analyticsHandlers.listAnalyticsReports(args as any));

          case "list_analytics_report_segments":
            return formatResponse(await this.analyticsHandlers.listAnalyticsReportSegments(args as any));

          case "download_analytics_report_segment":
            return formatResponse(await this.analyticsHandlers.downloadAnalyticsReportSegment(args as any));

          case "download_sales_report":
            if (!config.vendorNumber) {
              throw new McpError(
                ErrorCode.MethodNotFound,
                "Sales reports are not available. Please set APP_STORE_CONNECT_VENDOR_NUMBER environment variable."
              );
            }
            return formatResponse(await this.analyticsHandlers.downloadSalesReport(args as any));

          case "download_finance_report":
            if (!config.vendorNumber) {
              throw new McpError(
                ErrorCode.MethodNotFound,
                "Finance reports are not available. Please set APP_STORE_CONNECT_VENDOR_NUMBER environment variable."
              );
            }
            return formatResponse(await this.analyticsHandlers.downloadFinanceReport(args as any));

          // Subscription Groups
          case "list_subscription_groups":
            return formatResponse(await this.subscriptionHandlers.listSubscriptionGroups(args as any));
          case "create_subscription_group":
            return formatResponse(await this.subscriptionHandlers.createSubscriptionGroup(args as any));
          case "update_subscription_group":
            return formatResponse(await this.subscriptionHandlers.updateSubscriptionGroup(args as any));
          case "delete_subscription_group":
            return formatResponse(await this.subscriptionHandlers.deleteSubscriptionGroup(args as any));

          // Subscription Group Localizations
          case "list_subscription_group_localizations":
            return formatResponse(await this.subscriptionHandlers.listSubscriptionGroupLocalizations(args as any));
          case "create_subscription_group_localization":
            return formatResponse(await this.subscriptionHandlers.createSubscriptionGroupLocalization(args as any));
          case "update_subscription_group_localization":
            return formatResponse(await this.subscriptionHandlers.updateSubscriptionGroupLocalization(args as any));
          case "delete_subscription_group_localization":
            return formatResponse(await this.subscriptionHandlers.deleteSubscriptionGroupLocalization(args as any));

          // Subscriptions
          case "list_subscriptions":
            return formatResponse(await this.subscriptionHandlers.listSubscriptions(args as any));
          case "get_subscription":
            return formatResponse(await this.subscriptionHandlers.getSubscription(args as any));
          case "create_subscription":
            return formatResponse(await this.subscriptionHandlers.createSubscription(args as any));
          case "update_subscription":
            return formatResponse(await this.subscriptionHandlers.updateSubscription(args as any));
          case "delete_subscription":
            return formatResponse(await this.subscriptionHandlers.deleteSubscription(args as any));

          // Subscription Localizations
          case "list_subscription_localizations":
            return formatResponse(await this.subscriptionHandlers.listSubscriptionLocalizations(args as any));
          case "create_subscription_localization":
            return formatResponse(await this.subscriptionHandlers.createSubscriptionLocalization(args as any));
          case "update_subscription_localization":
            return formatResponse(await this.subscriptionHandlers.updateSubscriptionLocalization(args as any));
          case "delete_subscription_localization":
            return formatResponse(await this.subscriptionHandlers.deleteSubscriptionLocalization(args as any));

          // Subscription Pricing
          case "list_subscription_price_points":
            return formatResponse(await this.subscriptionHandlers.listSubscriptionPricePoints(args as any));
          case "list_subscription_prices":
            return formatResponse(await this.subscriptionHandlers.listSubscriptionPrices(args as any));
          case "create_subscription_price":
            return formatResponse(await this.subscriptionHandlers.createSubscriptionPrice(args as any));
          case "delete_subscription_price":
            return formatResponse(await this.subscriptionHandlers.deleteSubscriptionPrice(args as any));

          // In-App Purchases
          case "list_in_app_purchases":
            return formatResponse(await this.iapHandlers.listInAppPurchases(args as any));
          case "get_in_app_purchase":
            return formatResponse(await this.iapHandlers.getInAppPurchase(args as any));
          case "create_in_app_purchase":
            return formatResponse(await this.iapHandlers.createInAppPurchase(args as any));
          case "update_in_app_purchase":
            return formatResponse(await this.iapHandlers.updateInAppPurchase(args as any));
          case "delete_in_app_purchase":
            return formatResponse(await this.iapHandlers.deleteInAppPurchase(args as any));

          // IAP Localizations
          case "list_iap_localizations":
            return formatResponse(await this.iapHandlers.listIapLocalizations(args as any));
          case "create_iap_localization":
            return formatResponse(await this.iapHandlers.createIapLocalization(args as any));
          case "update_iap_localization":
            return formatResponse(await this.iapHandlers.updateIapLocalization(args as any));
          case "delete_iap_localization":
            return formatResponse(await this.iapHandlers.deleteIapLocalization(args as any));

          // IAP Pricing
          case "list_iap_price_points":
            return formatResponse(await this.iapHandlers.listIapPricePoints(args as any));
          case "get_iap_price_schedule":
            return formatResponse(await this.iapHandlers.getIapPriceSchedule(args as any));
          case "set_iap_price_schedule":
            return formatResponse(await this.iapHandlers.setIapPriceSchedule(args as any));

          // Xcode Development Tools
          case "list_schemes":
            return formatResponse(await this.xcodeHandlers.listSchemes(args as any));

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${request.params.name}`
            );
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw new McpError(
            ErrorCode.InternalError,
            `App Store Connect API error: ${error.response?.data?.errors?.[0]?.detail ?? error.message}`
          );
        }
        throw error;
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("App Store Connect MCP server running on stdio");
  }
}

// Start the server
const server = new AppStoreConnectServer();
server.run().catch(console.error);