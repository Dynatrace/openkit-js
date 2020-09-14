# OpenKit - JavaScript Development

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
yarn build                  # Build browser and node.js library
yarn build:node             # Build the node.js library
yarn build:browser          # Build the browser library
yarn build:browser:dev      # Build the browser library in dev mode
yarn build:browser:dev -w   # Build and watch the browser library in dev mode
```

## Building the documentation

```sh
yarn docs           # Build the docs in html format
yarn docs:markdown  # Build the docs in markdown format
```

### Generated files

-   `dist/browser` the library for the browser in a `bundle.js`
-   `dist/node` the library for Node.JS
-   `dist/types` the definition files for usage with TypeScript.
-   `build/coverage` the coverage information of the tests
-   `docs` the generated tsdocs in markdown or html

### Other commands

| Command          | Description             |
| ---------------- | ----------------------- |
| `yarn lint`      | Run tslint              |
| `yarn lint:spec` | Run tslint              |
| `yarn test`      | Run tests with coverage |
