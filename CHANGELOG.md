# OpenKit JS Changelog

## [Unreleased](https://github.com/Dynatrace/openkit-js/compare/v3.0.0...HEAD)

## 3.0.0 [Release date: 2024-05-27]

### Changed

-   `OpenKitBuilder(beaconURL: string, applicationId: string, deviceId: number | string)` changed to `OpenKitBuilder(beaconURL: string, applicationId: string, deviceId: number)`, meaning it is no longer possible to use a deviceId of type string. The deviceId must be a decimal number in the range of Number.MIN_SAFE_INTEGER to Number.MAX_SAFE_INTEGER. If the number is outside of this range, not decimal or invalid, it will be hashed.

## 2.3.0 [Release date: 2023-03-13]

### Added

-   Traffic Control will be read and used when sending data

### Improved

-   When a session already contained data but was not fully initialized, data will be cleared when capturing off is received

## 2.2.0 [Release date: 2023-10-30]

### Changed

-   `Session.sendBizEvent` will always send an event regardless of the `DataCollectionLevel`

### Security

-   Update vulnerable axios dependency (See https://security.snyk.io/vuln/SNYK-JS-AXIOS-6032459)

## 2.1.0 [Release date: 2023-06-05]

[GitHub Releases](https://github.com/Dynatrace/openkit-js/releases/tag/v2.1.0)

### Changed

-   Non-finite numeric values are serialized as JSON null in reported events, and a special field is added for supportability.

## 2.0.0 [Release date: 2022-11-09]

[GitHub Releases](https://github.com/Dynatrace/openkit-js/releases/tag/v2.0.0)

### Added

-   Business events capturing API `sendBizEvent`
-   `Session.reportNetworkTechnology(technology?: string)`
-   `Session.reportCarrier(carrier?: string)`
-   `Session.reportConnectionType(connectionType?: ConnectionType)`

### Changed

-   Maximum length of reported error/crash stacktrace has been limited to 128k.
-   Maximum length of reported error/crash reason has been limited to 1000.
-   `Action.reportError` has no longer a message, as it is unhandled in Dynatrace.
-   `Session.reportError` has no longer a message, as it is unhandled in Dynatrace.

### Removed

-   `OpenKitBuilder.withApplicationName` because the name is configured in Dynatrace Web UI.

## 1.3.0 [Release date: 2021-12-10]

[GitHub Releases](https://github.com/Dynatrace/openkit-js/releases/tag/v1.3.0)

### Added

-   User-Agent header to http requests

### Improved

-   waitForInit with timeout fixed

## 1.2.0 [Release date: 2021-01-26]

[GitHub Releases](https://github.com/Dynatrace/openkit-js/releases/tag/v1.2.0)

### Added

-   Callback to openkit.shutdown procedure

## 1.1.0 [Release date: 2021-01-11]

[GitHub Releases](https://github.com/Dynatrace/openkit-js/releases/tag/v1.1.0)

### Added

-   Technology type support for errors and crashes

### Improved

-   Changed maximum length of stacktrace to 128kb

### Security

-   Update vulnerable packages

### Changed

-   Fixed build paths
-   Removed unused dev dependency

## 1.0.0 [Release date: 2019-07-08]

[GitHub Releases](https://github.com/Dynatrace/openkit-js/releases/tag/v1.0.0)

### Initial public release
