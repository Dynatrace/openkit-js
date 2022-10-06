# OpenKit JS Changelog

## [Unreleased](https://github.com/Dynatrace/openkit-js/compare/v1.3.0...HEAD)

### Added

-   Business events capturing API `sendBizEvent`

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

## [Unreleased](https://github.com/Dynatrace/openkit-js/compare/v1.2.0...HEAD)

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
