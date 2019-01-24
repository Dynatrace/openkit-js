# Dynatrace OpenKit - JavaScript Reference Implementation

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## What is the OpenKit?

The OpenKit provides an easy and lightweight way to get insights into applications with Dynatrace/AppMon by instrumenting the source code of those applications.

It is best suited for applications running separated from their backend and communicating via HTTP, like rich-client-applications, embedded devices, terminals, and so on.

The big advantages of the OpenKit are that it's designed to
* be as easy-to-use as possible
* be as dependency-free as possible (no third party libraries or Dynatrace/AppMon Agent needed)
* be easily portable to other languages and platforms

This repository contains the reference implementation in pure TypeScript. Other implementations are listed as follows:
* .NET: https://github.com/Dynatrace/openkit-dotnet/
* Java: https://github.com/Dynatrace/openkit-java/
* C/C++: https://github.com/Dynatrace/openkit-native/

## What you can do with the OpenKit-JavaScript
* Create Sessions and User Actions
* Use it together with Dynatrace

## What you cannot do with the OpenKit
* Create server-side PurePaths (this functionality is provided by [OneAgent SDKs](https://github.com/Dynatrace/OneAgent-SDK))
* Create metrics (use the [Custom network devices & metrics API](https://www.dynatrace.com/support/help/dynatrace-api/timeseries/what-does-the-custom-network-devices-and-metrics-api-provide/) to report metrics)

## Design Principles
* API should be as simple and easy-to-understand as possible
* Incorrect usage of the OpenKit should still lead to valid results, if possible
* Design reentrant APIs and document them

## Prerequisites
### Node.js

#### Windows

On Windows machine, go to [Node.js download](https://nodejs.org/en/download/) or use [nvm for Windows](https://github.com/coreybutler/nvm-windows) to be able to easily
switch between Node.js versions.
After that, execute on PowerShell with Administration privileges (Run as administrator):
```sh
npm install -g --production windows-build-tools
```

#### Linux

On Linux machine, you can install [n](https://github.com/tj/n) tool, which does pretty much the same 
like `nvm` but in a more convenient way.

### Yarn package manager

```sh
sudo npm install -g yarn
```

## Install dependencies
```sh
yarn install
```

## Building the .js library
```sh
yarn build:prod # Build project in production mode
yarn build      # Build project in development mode
```

### Generated files
* `build/lib` the es3 JavaScript library.
* `build/types` the definition files for usage with TypeScript.
* `build/coverage` the generated coverage from the tests. 

### Other commands
| Command               | Description               |
|-----------------------|---------------------------| 
| `yarn lint`           | Run tslint                |
| `yarn lint:spec`      | Run tslint                |
| `yarn test`           | Run tests with coverage   |
| `yarn precommit`      | Run linting and tests     |
