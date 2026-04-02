# App Store Connect MCP Server

A Model Context Protocol (MCP) server for interacting with the App Store Connect API. This server provides tools for managing apps, beta testers, bundle IDs, devices, app metadata, screenshots, and capabilities in App Store Connect.

## Authentication

### Required Configuration
1. Generate an App Store Connect API Key from [App Store Connect](https://appstoreconnect.apple.com/access/integrations/api)
2. Download the .p8 private key file
3. Note your Key ID and Issuer ID
4. Set the required environment variables in your configuration:
   - `APP_STORE_CONNECT_KEY_ID`: Your API Key ID
   - `APP_STORE_CONNECT_ISSUER_ID`: Your Issuer ID  
   - `APP_STORE_CONNECT_P8_PATH`: Path to your .p8 private key file

### Optional Configuration for Sales & Finance Reports
To enable sales and finance reporting tools, you'll also need:
- `APP_STORE_CONNECT_VENDOR_NUMBER`: Your vendor number from App Store Connect

**Note**: Sales and finance report tools (`download_sales_report`, `download_finance_report`) will only be available if the vendor number is configured. You can find your vendor number in App Store Connect under "Sales and Trends" or "Payments and Financial Reports".

## Complete Tool Reference

### App Management Tools

#### `list_apps`
Get a list of all apps in App Store Connect.

**Parameters:**
- `limit` (optional): Maximum number of apps to return (default: 100, max: 200)
- `bundleId` (optional): Filter by bundle identifier

**Example:**
```
"List all my apps"
"Show me apps with bundle ID com.example.myapp"
"Get the first 50 apps"
```

#### `get_app_info`
Get detailed information about a specific app.

**Parameters:**
- `appId` (required): The ID of the app
- `include` (optional): Related resources to include (e.g., appClips, appInfos, appStoreVersions, betaGroups, builds)

**Example:**
```
"Get info for app ID 123456789"
"Show me app 123456789 with beta groups and builds"
"Get detailed information about my app including app store versions"
```

### Beta Testing Tools

#### `list_beta_groups`
List all beta testing groups (internal and external).

**Parameters:**
- `limit` (optional): Maximum number of groups to return (default: 100, max: 200)
- `appId` (optional): Filter by app ID

**Example:**
```
"Show all beta groups"
"List beta groups for app 123456789"
"Get the first 20 beta groups"
```

#### `list_group_testers`
List testers in a specific beta group.

**Parameters:**
- `groupId` (required): The ID of the beta group
- `limit` (optional): Maximum number of testers to return (default: 100, max: 200)

**Example:**
```
"List all testers in group ABC123"
"Show me the first 50 testers in beta group ABC123"
```

#### `add_tester_to_group`
Add a new tester to a beta group.

**Parameters:**
- `groupId` (required): The ID of the beta group
- `email` (required): Email address of the tester
- `firstName` (optional): Tester's first name
- `lastName` (optional): Tester's last name

**Example:**
```
"Add john@example.com to beta group ABC123"
"Add John Smith (john@example.com) to group ABC123"
```

#### `remove_tester_from_group`
Remove a tester from a beta group.

**Parameters:**
- `groupId` (required): The ID of the beta group
- `testerId` (required): The ID of the tester

**Example:**
```
"Remove tester XYZ789 from group ABC123"
"Delete tester XYZ789 from beta group ABC123"
```

#### `list_beta_feedback_screenshots`
List beta feedback screenshot submissions.

**Parameters:**
- `appId` (optional): Filter by app ID
- `bundleId` (optional): Filter by bundle identifier
- `buildId` (optional): Filter by build ID
- `limit` (optional): Maximum results (default: 100)
- `includeBuilds` (optional): Include build information
- `includeTesters` (optional): Include tester information

**Example:**
```
"Show beta feedback screenshots for app 123456789"
"List feedback screenshots for bundle ID com.example.app"
"Get feedback with tester info for build XYZ"
```

#### `get_beta_feedback_screenshot`
Get detailed information about a specific beta feedback screenshot.

**Parameters:**
- `feedbackId` (required): The ID of the feedback
- `includeBuilds` (optional): Include build information
- `includeTesters` (optional): Include tester information
- `downloadScreenshot` (optional): Download the screenshot image (default: true)

**Example:**
```
"Get feedback screenshot FEEDBACK123"
"Show me feedback FEEDBACK123 with tester details"
"Download screenshot from feedback FEEDBACK123"
```

### App Store Version Localization Tools

#### `create_app_store_version`
Create a new app store version for an app.

**Parameters:**
- `appId` (required): The ID of the app
- `platform` (required): The platform (IOS, MAC_OS, TV_OS, VISION_OS)
- `versionString` (required): Version string in format X.Y or X.Y.Z (e.g., '1.0' or '1.0.0')
- `copyright` (optional): Copyright text for this version
- `releaseType` (optional): How the app should be released (MANUAL, AFTER_APPROVAL, SCHEDULED)
- `earliestReleaseDate` (optional): ISO 8601 date string (required when releaseType is SCHEDULED)
- `buildId` (optional): ID of the build to associate with this version

**Example:**
```
"Create iOS version 2.0.0 for app 123456789"
"Create macOS version 1.5.0 for app 123456789 with manual release"
"Create scheduled iOS version 2.1.0 for app 123456789 releasing on 2024-02-01"
"Create version 1.2.0 for app 123456789 with build BUILD456 and copyright '2024 My Company'"
```

#### `list_app_store_versions`
Get all app store versions for a specific app.

**Parameters:**
- `appId` (required): The ID of the app
- `limit` (optional): Maximum number of versions to return (default: 100, max: 200)
- `filter` (optional): Filter options
  - `platform`: Filter by platform (IOS, MAC_OS, TV_OS)
  - `versionString`: Filter by version string (e.g., '1.0.0')
  - `appStoreState`: Filter by state (e.g., READY_FOR_SALE, PREPARE_FOR_SUBMISSION)

**Example:**
```
"List all versions for app 123456789"
"Show iOS versions for app 123456789"
"Find version 2.0.0 for app 123456789"
"List versions in review for app 123456789"
```

#### `list_app_store_version_localizations`
Get all localizations for a specific app store version.

**Parameters:**
- `appStoreVersionId` (required): The ID of the app store version
- `limit` (optional): Maximum number of localizations (default: 100, max: 200)

**Example:**
```
"List all localizations for app version VERSION123"
"Show me language versions for app store version VERSION123"
```

#### `get_app_store_version_localization`
Get detailed information about a specific localization.

**Parameters:**
- `localizationId` (required): The ID of the localization

**Example:**
```
"Get localization details for LOCALE123"
"Show me the French localization LOCALE123"
```

#### `update_app_store_version_localization`
Update a specific field in an app store version localization.

**Parameters:**
- `localizationId` (required): The ID of the localization
- `field` (required): Field to update (description, keywords, marketingUrl, promotionalText, supportUrl, whatsNew)
- `value` (required): New value for the field

**Example:**
```
"Update description for localization LOCALE123 to 'Amazing new app description'"
"Change keywords for LOCALE123 to 'productivity, tasks, organize'"
"Update what's new text for LOCALE123 to 'Bug fixes and performance improvements'"
```

#### `create_app_store_version_localization`
Create a new localization for an app store version (e.g., add French, Japanese, etc.).

**Parameters:**
- `appStoreVersionId` (required): The ID of the app store version
- `locale` (required): The locale code (e.g., 'en-US', 'fr-FR', 'ja', 'de-DE', 'es-ES')
- `description` (optional): App description for this locale
- `keywords` (optional): Search keywords for this locale (comma-separated)
- `marketingUrl` (optional): Marketing URL for this locale
- `promotionalText` (optional): Promotional text for this locale
- `supportUrl` (optional): Support URL for this locale
- `whatsNew` (optional): What's new text for this locale

**Example:**
```
"Create French localization for version VERSION123"
"Add Japanese locale for version VERSION123 with description and keywords"
```

### App Info Localization Tools

#### `list_app_infos`
List all app infos for an app. Returns app info IDs needed for managing app-level localizations (title, subtitle).

**Parameters:**
- `appId` (required): The ID of the app
- `limit` (optional): Maximum number of results to return (default: 100, max: 200)

**Example:**
```
"List app infos for app 123456789"
"Get app info IDs for app 123456789"
```

#### `list_app_info_localizations`
List all localizations for an app info. Returns localization IDs and current title/subtitle for each locale.

**Parameters:**
- `appInfoId` (required): The ID of the app info (get this from list_app_infos)
- `limit` (optional): Maximum number of results to return (default: 100, max: 200)

**Example:**
```
"List all localizations for app info APPINFO123"
"Show title and subtitle for each locale of app info APPINFO123"
```

#### `create_app_info_localization`
Create a new app info localization for a locale (e.g., add French title and subtitle).

**Parameters:**
- `appInfoId` (required): The ID of the app info (get this from list_app_infos)
- `locale` (required): The locale code (e.g., 'fr-FR', 'ja', 'de-DE')
- `name` (optional): The app title for this locale
- `subtitle` (optional): The app subtitle for this locale
- `privacyPolicyUrl` (optional): Privacy policy URL for this locale
- `privacyChoicesUrl` (optional): Privacy choices URL for this locale
- `privacyPolicyText` (optional): Privacy policy text for this locale

**Example:**
```
"Create French localization for app info APPINFO123 with title 'Mon App'"
"Add Japanese locale for app info APPINFO123 with title and subtitle"
```

#### `update_app_info_localization`
Update a field in an app info localization (e.g., change title or subtitle for a locale).

**Parameters:**
- `appInfoLocalizationId` (required): The ID of the app info localization to update
- `field` (required): The field to update (name, subtitle, privacyPolicyUrl, privacyChoicesUrl, privacyPolicyText)
- `value` (required): The new value for the field

**Example:**
```
"Update title for localization LOCALE123 to 'My Awesome App'"
"Change subtitle for LOCALE123 to 'The best app ever'"
"Update privacy policy URL for LOCALE123"
```

### Screenshot Management Tools

#### `create_app_screenshot_set`
Create a screenshot set for a specific localization and display type.

**Parameters:**
- `appStoreVersionLocalizationId` (required): The ID of the app store version localization
- `screenshotDisplayType` (required): The display type (e.g., APP_IPHONE_67, APP_IPHONE_65, APP_IPAD_PRO_3GEN_129, WATCH_SERIES_10, WATCH_ULTRA, etc.)

**Example:**
```
"Create iPhone 6.7 inch screenshot set for localization LOCALE123"
"Create iPad Pro screenshot set for LOCALE123"
"Create Apple Watch Ultra screenshot set for LOCALE123"
```

#### `list_app_screenshot_sets`
List all screenshot sets for a specific app store version localization.

**Parameters:**
- `appStoreVersionLocalizationId` (required): The ID of the app store version localization
- `limit` (optional): Maximum number of screenshot sets to return (default: 100, max: 200)

**Example:**
```
"List screenshot sets for localization LOCALE123"
"Show all display types with screenshots for LOCALE123"
```

#### `list_app_screenshots`
List all screenshots in a screenshot set.

**Parameters:**
- `appScreenshotSetId` (required): The ID of the screenshot set
- `limit` (optional): Maximum number of screenshots to return (default: 100, max: 200)

**Example:**
```
"List screenshots in set SET123"
"Show all screenshots for screenshot set SET123"
```

#### `upload_app_screenshot`
Upload a screenshot image file to a screenshot set. Reads the file from the local filesystem and uploads it using Apple's chunked upload protocol.

**Parameters:**
- `appScreenshotSetId` (required): The ID of the screenshot set to upload to
- `filePath` (required): Absolute path to the screenshot image file (e.g., /Users/you/screenshots/iphone_1.png)

**Example:**
```
"Upload /Users/me/screenshots/home.png to screenshot set SET123"
"Add screenshot from /tmp/screenshot.png to set SET123"
```

#### `delete_app_screenshot`
Delete a specific screenshot from App Store Connect.

**Parameters:**
- `appScreenshotId` (required): The ID of the screenshot to delete

**Example:**
```
"Delete screenshot SCREENSHOT123"
"Remove screenshot SCREENSHOT123 from App Store Connect"
```

### Bundle ID Management Tools

#### `create_bundle_id`
Register a new bundle ID for app development.

**Parameters:**
- `identifier` (required): The bundle ID string (e.g., 'com.example.app')
- `name` (required): A name for the bundle ID
- `platform` (required): Platform (IOS, MAC_OS, or UNIVERSAL)
- `seedId` (optional): Your team's seed ID

**Example:**
```
"Create bundle ID com.mycompany.newapp for iOS named 'My New App'"
"Register universal bundle ID com.example.app called 'Example App'"
```

#### `list_bundle_ids`
Find and list bundle IDs registered to your team.

**Parameters:**
- `limit` (optional): Maximum results (default: 100, max: 200)
- `sort` (optional): Sort order (name, -name, platform, -platform, identifier, -identifier)
- `filter` (optional): Filter by identifier, name, platform, or seedId
- `include` (optional): Include related resources (profiles, bundleIdCapabilities, app)

**Example:**
```
"List all bundle IDs"
"Show iOS bundle IDs sorted by name"
"Find bundle IDs containing 'example'"
```

#### `get_bundle_id_info`
Get detailed information about a specific bundle ID.

**Parameters:**
- `bundleIdId` (required): The ID of the bundle ID
- `include` (optional): Related resources to include
- `fields` (optional): Specific fields to include

**Example:**
```
"Get info for bundle ID BUNDLE123"
"Show bundle ID BUNDLE123 with capabilities"
```

#### `enable_bundle_capability`
Enable a capability for a bundle ID.

**Parameters:**
- `bundleIdId` (required): The ID of the bundle ID
- `capabilityType` (required): Type of capability (e.g., PUSH_NOTIFICATIONS, ICLOUD, GAME_CENTER)
- `settings` (optional): Capability-specific settings

**Example:**
```
"Enable push notifications for bundle ID BUNDLE123"
"Add iCloud capability to bundle BUNDLE123"
"Enable Game Center for bundle ID BUNDLE123"
```

#### `disable_bundle_capability`
Disable a capability for a bundle ID.

**Parameters:**
- `capabilityId` (required): The ID of the capability to disable

**Example:**
```
"Disable capability CAP123"
"Remove capability CAP123 from bundle ID"
```

### Device Management Tools

#### `list_devices`
Get a list of all devices registered to your team.

**Parameters:**
- `limit` (optional): Maximum results (default: 100, max: 200)
- `sort` (optional): Sort order (name, platform, status, udid, deviceClass, model, addedDate)
- `filter` (optional): Filter by name, platform, status, udid, or deviceClass
- `fields` (optional): Specific fields to include

**Example:**
```
"List all devices"
"Show enabled iOS devices"
"Find devices with name containing 'John'"
"List iPhones sorted by date added"
```

### User Management Tools

#### `list_users`
Get a list of all users on your App Store Connect team.

**Parameters:**
- `limit` (optional): Maximum results (default: 100, max: 200)
- `sort` (optional): Sort order (username, firstName, lastName, roles)
- `filter` (optional): Filter by username or roles
- `fields` (optional): Specific fields to include
- `include` (optional): Include visibleApps relationship

**Example:**
```
"List all team members"
"Show users with admin role"
"Find developers sorted by last name"
"List users with their visible apps"
```

### Analytics & Reports Tools

#### `create_analytics_report_request`
Create a new analytics report request for an app.

**Parameters:**
- `appId` (required): The app ID
- `accessType` (required): Type of analytics (ONGOING or ONE_TIME_SNAPSHOT)
- `frequency` (optional): Report frequency for ongoing reports (DAILY, WEEKLY, MONTHLY)
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)

**Example:**
```
"Create daily analytics report for app 123456789"
"Generate one-time snapshot report for app 123456789 from 2024-01-01 to 2024-01-31"
```

#### `list_analytics_reports`
Get available analytics reports for a request.

**Parameters:**
- `reportRequestId` (required): The report request ID
- `limit` (optional): Maximum results (default: 100, max: 200)
- `filter` (optional): Filter by category, name, or date

**Example:**
```
"List reports for request REQ123"
"Show app usage reports for request REQ123"
```

#### `list_analytics_report_segments`
Get segments for a specific analytics report.

**Parameters:**
- `reportId` (required): The analytics report ID
- `limit` (optional): Maximum results (default: 100, max: 200)

**Example:**
```
"List segments for report REPORT123"
"Get download URLs for report REPORT123"
```

#### `download_analytics_report_segment`
Download data from an analytics report segment.

**Parameters:**
- `url` (required): The segment download URL

**Example:**
```
"Download data from https://api.appstoreconnect.apple.com/..."
```

### Sales & Finance Reports Tools (Requires Vendor Number)

#### `download_sales_report`
Download sales and trends reports.

**Parameters:**
- `frequency` (required): Report frequency (DAILY, WEEKLY, MONTHLY, YEARLY)
- `reportDate` (required): Date in appropriate format
- `reportType` (required): Type of report (SALES, SUBSCRIPTION, SUBSCRIPTION_EVENT, SUBSCRIBER, NEWSSTAND, PREORDER)
- `reportSubType` (required): SUMMARY or DETAILED
- `vendorNumber` (optional): Override default vendor number
- `version` (optional): Report version (default: 1_0)

**Example:**
```
"Download daily sales summary for 2024-01-15"
"Get monthly subscription detailed report for 2024-01"
"Download yearly sales summary for 2023"
```

#### `download_finance_report`
Download finance reports for a specific region.

**Parameters:**
- `reportDate` (required): Report date (YYYY-MM)
- `regionCode` (required): Region code (e.g., 'Z1' for worldwide)
- `vendorNumber` (optional): Override default vendor number

**Example:**
```
"Download finance report for January 2024 worldwide"
"Get finance report for 2024-01 region Z1"
```

### Xcode Development Tools

#### `list_schemes`
List all available schemes in an Xcode project or workspace.

**Parameters:**
- `projectPath` (required): Path to .xcodeproj or .xcworkspace file

**Example:**
```
"List schemes in /Users/john/MyApp/MyApp.xcodeproj"
"Show available schemes for MyApp.xcworkspace"
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Related Links
- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [App Store Connect API Documentation](https://developer.apple.com/documentation/appstoreconnectapi)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
