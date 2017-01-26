CHANGELOG
=========

## dev

Summary...

* __New features:__
  - ...

* __Added methods on API:__
  - `generateTempFileName(prefix, suffix):` Generate a temporary file name
    - `@prefix:` Prefix to compose name
    - `@suffix:` Suffix to compose name
    - `@return:` A temporary file name
  - `downloadAsync(url, path, options):` Download a asynchronous web file. To replace `download` method.
    - `@url:` Url for download
    - `@path:` Path to save file
    - `@options:` Options object
    - `@return:` A `Promise` to a `WriteStream` saved (and closed) file.

* __Changed methods on API:__
  - ...

* __Bug fixes and improvements:__
  - ...

## v0.13.0

* __Added methods on API:__
  - `copyFile(src, dest):` Copy file;
  - `copyDirectory(src, dest):` Copy all content folder.

## v0.12.0

* __New features:__
  - **tar.gz files** is now extracted using _Unix tar_ command by `extractFile()`.

## v0.11.0

* __Added methods on API:__
  - `getConfiguration(key, defaultValue):` Get the configuration value;
  - `setConfiguration(key, value):` Set the configuration value;
  - `removeConfiguration(key):` Remove the configuration value.

## v0.10.5

Only redoc and minor fixes.

## v0.10.4

* __New features:__
  - **MarcOS** is now supported.

## v0.10.3

* __Changed methods on API:__
  - `directoryIsEmpty(path, excludes):` Added `excludes` param.

## v0.10.2

* __Bug fixes and improvements:__
  - Fixed error in `makeRegistryLockFilePath(scope)`.

## v0.10.1

* __Bug fixes and improvements:__
  - Fixed error in `getRegistryLock(scope, force, options)`, on call
    makeRegistryLockFilePath.

## v0.10.0

* __Added methods on API:__
  - `makeRegistryLockFilePath(scope):` Make a registry lock file path.

## v0.9.0

* __Changed methods on API:__
  - `getRegistryLock(scope, force, options):` Added `options` param.

## v0.8.1

* __Bug fixes and improvements:__
  - Fixed error in `Setup#run(devTool, options)`, on create e5r directory.

## v0.8.0

* __Changed methods on API:__
  - `getRegistryLock(scope, force):` Added `force` option.

* __Bug fixes and improvements:__
  - Fixed error on `downloadSync(url, path, options)` for `-quiet` option usage.

## v0.7.0

NodeJS updated to 6.2.2 version

* __Bug fixes and improvements:__
  - Fixed error on `downloadSync(url, path, options)` for `-quiet` option usage.

## v0.6.4

* __Bug fixes and improvements:__
  - Fixed error on `downloadSync(url, path, options)`.

## v0.6.3

* __Bug fixes and improvements:__
  - Fixed error on `prompt(message)`.

## v0.6.2

* __Bug fixes and improvements:__
  - Fixed error on `prompt(message)`.

## v0.6.1

* __Bug fixes and improvements:__
  - Fixed error on `prompt(message)`.

## v0.6.0

* __Added methods on API:__
  - `prompt(message):` Show prompt message and get a user string.

## v0.5.0

* __Changed methods on API:__
  - `downloadSync(url, path, options):` Download a web file with process blocked
  - `download(url, path, options):` Download a web file

* __Bug fixes and improvements:__
  - Change `wget` command to accept `-quiet` and `--timeout [t]` options

## v0.4.1

* __Bug fixes and improvements:__
  - Fixed error on run process tool.

## v0.4.0

* __Added methods on API:__
  - `generateTempDir():` Generate a temporary directory path.

## v0.3.2

* __Bug fixes and improvements:__
  - Fixed error on `directoryIsEmpty(path)`.

## v0.3.1

* __Added methods on API:__
  - `directoryIsEmpty(path):` Check if directory is empty.

## v0.3.0

* __Added methods on API:__
  - `parseOptions(args):` Transform argument list in object key value pair.

## v0.2.0

* __New features:__
  - Added JavaScript zip extractor implementation to replace powershell process;

* __Bug fixes and improvements:__
  - `getUserEnvironmentWin32` and `setUserEnvironmentWin32` migrated to Powershell script.

## v0.1.8

* __Bug fixes and improvements:__
  - Fixed error that occurs when the extraction has not written anything in the process
    output on `extractFileWin32(origin, destination)` global function.

## v0.1.7

* __Bug fixes and improvements:__
  - Update prompt environment on set user environment variable.

## v0.1.6

* __Added methods on API:__
  - `getEnvironmentVarToken(varName):` Get a Token environment variable

## v0.1.5

Only publish at https://www.npmjs.com/package/e5r-dev.

## v0.1.4

* __New features:__
  - Added Linux installer.

* __Added methods on API:__
  - `arch():` get OS architecture;
  - `mkdir(path):` create a directory from path;
  - `rmdir(path):` remove a directory from path;
  - `rename(oldPath, newPath):` rename a path;
  - `pathExists(path):` check if path exists;
  - `extractFile(origin, destination):` extract a ZIP file (only Windows);
  - `fileExists(path):` check if file exists from path;
  - `directoryExists(path):` check if directory exists from path.

## v0.1.4-alpha

First release (_Only Windows installer_).
