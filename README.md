# OpenKit - javascript

## Prerequisites
### Node.js

#### Windows

On Windows machine, go to [NodeJS download](https://nodejs.org/en/download/)  or use [nvm for Windows](https://github.com/coreybutler/nvm-windows) to be able to easily
switch between nodejs version.
After that, execute on PowerShell with Administration privileges (Run as administrator):
```
npm install -g --production windows-build-tools
```

#### Linux

On Linux machine, install [n](https://github.com/tj/n) tool, which does pretty much the same 
like `nvm` but in a more convenient way.

### Yarn package manager

```
sudo npm install -g yarn
```

## Building the .js library
Run `yarn run build` to build the project. 

### Generated files
All generated files for the library are in `dist`.
* `lib` contains the generated javascript library
* `types` contains the generated definition files for usage with typescript. You still need to include the *.js library.

### Other commands
| Command | Description |
|---------|-------------| 
| `yarn run lint` | Run tslint |
| `yarn run test` | Run tests with coverage |
