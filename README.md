# OpenKit - javascript

## Prerequisites
### Node.js

#### Windows

On Windows machine, go to [NodeJS download](https://nodejs.org/en/download/)  or use [nvm for Windows](https://github.com/coreybutler/nvm-windows) to be able to easily
switch between nodejs version.
After that, execute on PowerShell with Administration privileges (Run as administrator):
```sh
npm install -g --production windows-build-tools
```

#### Linux

On Linux machine, install [n](https://github.com/tj/n) tool, which does pretty much the same 
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
* `build/lib` the es3 javascript library.
* `build/types` the definition files for usage with typescript.
* `build/coverage` the generated coverage from the tests. 

### Other commands
| Command               | Description               |
|-----------------------|---------------------------| 
| `yarn lint`           | Run tslint                |
| `yarn lint:spec`      | Run tslint                |
| `yarn test`           | Run tests with coverage   |
| `yarn precommit`      | Run linting and tests     |
