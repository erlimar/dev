// Copyright (c) E5R Development Team. All rights reserved.
// Licensed under the Apache License, Version 2.0. More license information in LICENSE.txt.

/* global process, __filename, __dirname */
(async () => {
    "use strict";

    let _dev;
    /* DEVCODE-BEGIN */
    _dev = require('../../../main.js');
    /* DEVCODE-END */
    if (!_dev) _dev = require('e5r-dev');

    let _path = require('path'),
        _fs = require('fs'),
        _os = require('os');

    /**
     * @todo: Implements no supported platforms.
     * 
     * 'win32', 'freebsd', 'linux', 'sunos'
     */

    /** @constant {array} */
    const SUPPORTED_PLATFORMS = [
        'darwin'
    ];

    /** @constant {string} */
    const CHMOD_EXECUTABLE = '100750';

    /** @constant {string} */
    const NODE_VERSION_INDEX_URL = "https://nodejs.org/dist/index.json";

    /**
     * Get a current architecture
     */
    function getArchitecture() {
        let arch = _os.arch();

        if (arch === 'ia32') {
            return 'x86';
        }

        return arch;
    }

    /**
     * Get a current platform
     */
    function getPlatformPrefix() {
        let platform = _os.platform();

        if (platform === 'win32') {
            return 'win';
        }

        return platform;
    }

    /**
     * Prepare a platform and architecture object properties.
     * 
     * @param {object} objList - The object list
     */
    function preparePlatformArchitectureObject(objList) {
        if (!Array.isArray(objList)) {
            objList = [objList];
        }

        objList.map(obj => {
            if (!Array.isArray(obj.files)) {
                return;
            }

            if (typeof obj.platforms !== 'object') {
                obj.platforms = {};
            }

            obj.files.map(file => {
                let parts = new RegExp('^(\\w+)-(\\w+).*$', 'g').exec(file);

                if (!Array.isArray(parts)) {
                    return;
                }

                let platform = parts[1],
                    arch = parts[2];

                if (!Array.isArray(obj.platforms[platform])) {
                    obj.platforms[platform] = [];
                }

                if (0 > obj.platforms[platform].indexOf(arch)) {
                    obj.platforms[platform].push(arch);
                }
            });
        });
    }

    /**
     * Remove a object propertie if exists
     * 
     * @todo: Move to env NODE
     * 
     * @param {object[]} objList - The object list
     * @param {string[]} propList - The propertie name list
     */
    function removeProperty(objList, propList) {
        if (!Array.isArray(objList)) {
            objList = [objList];
        }

        if (!Array.isArray(propList)) {
            return;
        }

        objList.map(obj => propList.map(prop => {
            if (Object.getOwnPropertyDescriptor(obj, prop)) {
                delete obj[prop];
            }
        }));
    }

    /**
     * Ensures that all requirements are ok
     */
    function ensure() {
        let platform = _os.platform();

        if (0 > SUPPORTED_PLATFORMS.indexOf(platform)) {
            throw _dev.createError('Environment NODE does not support the ' + platform.toUpperCase() + ' platform.');
        }
    }

    /**
     * Management NODE Environment
     * @class
     */
    class NodeEnvironment {
        get devTool() {
            return this._devTool;
        }

        get options() {
            return this._options;
        }

        /** @required */
        get checked() {
            ensure();

            return true;
        }

        get name() {
            return 'node';
        }

        /** @required */
        init(devTool, options) {
            this._devTool = devTool;
            this._options = options;
        }

        /** @required */
        getFullVersionNumber(version) {
            return version;

            /** @todo: Implements check options */
        }

        /** @required */
        versionIsValid(version) {
            return true;

            /** @todo: Implements check options */
        }

        /**
         * Make a download file list for a new installation
         * 
         * @required
         * 
         * @param {string} version - Version number
         *
         * @return {string[]} Array of URL to download
         * */
        getDownloadFileList(version) {
            let filesToDownload = [],
                arch = this.options.arch || getArchitecture();

            // Darwin, Linux, Sunos, AIX, and Windows (only node 6.2.1 or higher)
            let platform = getPlatformPrefix(),
                pkgSufix = platform === 'win' ? 'zip' : 'tar.gz',
                fileName = 'node-v{version}-{platform}-{arch}.{pkg}'
                    .replace('{version}', version)
                    .replace('{platform}', platform)
                    .replace('{arch}', arch)
                    .replace('{pkg}', pkgSufix),
                url = 'https://nodejs.org/dist/v{version}/{file}'
                    .replace('{version}', version)
                    .replace('{file}', fileName);

            /** @todo: Implements windows filename and npm url if required */

            filesToDownload.push(url);

            return filesToDownload;
        }

        /**
         * Install files to installation folder
         * 
         * @param {string} downloaddedPath - Downloadded directory path
         * @param {string} extractedPath - Extracted files directory path
         * @param {string} installPath - Installation directory path
         * @param {string} version - Version number
         */
        installFiles(downloaddedPath, extractedPath, installPath, version) {
            /** @todo: Check all versions format files and directories */

            let arch = this.options.arch || getArchitecture(),
                platform = getPlatformPrefix(),
                folderName = 'node-v{version}-{platform}-{arch}'
                    .replace('{version}', version)
                    .replace('{platform}', platform)
                    .replace('{arch}', arch);

            _dev.copyDirectory(_path.join(extractedPath, folderName), installPath);

            // Set executable flag for *nix
            if (platform !== 'win') {
                let nodeExePath = _path.join(installPath, 'bin', 'node'),
                    npmExePath = _path.join(installPath, 'bin', 'npm');

                if (_dev.fileExists(nodeExePath)) {
                    _fs.chmodSync(nodeExePath, CHMOD_EXECUTABLE);
                }

                if (_dev.fileExists(npmExePath)) {
                    _fs.chmodSync(npmExePath, CHMOD_EXECUTABLE);
                }
            }
        }

        /**
         * Verify installation files
         * 
         * @param {string} version - Version number
         * @param {string} installPath - Installation path
         * 
         * @return {boolean} True if OK, or False.
         */
        successfullyInstalled(version, installPath) {
            let platform = getPlatformPrefix(),
                nodeExe = platform === 'win' ? 'node.exe' : 'node',
                npmExe = platform === 'win' ? 'npm.cmd' : 'npm',
                nodePath = _path.join(installPath, 'bin', nodeExe),
                npmPath = _path.join(installPath, 'bin', npmExe),
                modulesPath = _path.join(installPath, 'lib', 'node_modules');

            // files and directories
            if (!_dev.fileExists(nodePath)) return false;
            if (!_dev.fileExists(npmPath)) return false;
            if (!_dev.directoryExists(modulesPath)) return false;

            // chmod
            if (_fs.statSync(nodePath).mode !== parseInt(CHMOD_EXECUTABLE, 8)) return false;
            if (_fs.statSync(npmPath).mode !== parseInt(CHMOD_EXECUTABLE, 8)) return false;

            // Successfully
            return true;
        }

        /**
         * Verify installation files
         * 
         * @param {string} version - Version number
         * @param {string} installPath - Installation path
         * 
         * @return {boolean} True if OK, or False.
         */
        getBinPath(version, installPath) {
            let paths = [];
            
            paths.push(_path.join(installPath, 'bin'));

            return paths;
        }

        /** @required */
        async getVersions() {
            let tempDir = _dev.generateTempDir(),
                tempFilePath = _path.join(tempDir, 'node-index.json'),
                versionsInfo = {
                    "environment": this.name,
                    "versions": []
                };

            try {
                if (!_dev.directoryExists(tempDir)) {
                    _dev.mkdir(tempDir);
                }

                /** @todo: Use async download */
                await _dev.downloadAsync(NODE_VERSION_INDEX_URL, tempFilePath);

                let nodeIndex = require(tempFilePath);

                if (!Array.isArray(nodeIndex)) {
                    throw 'Invalid downloaded file content for NODE versions information.'
                }

                versionsInfo.versions = nodeIndex;

                for (let idx in versionsInfo.versions) {
                    let version = versionsInfo.versions[idx];

                    // Remove "v" from "v7.0.0" version number
                    version.version = version.version.substring(1);

                    // Prepare platform and architecture information
                    preparePlatformArchitectureObject(version);

                    // Remove unnecessary information. (e.g: files, openssl, npm, etc.)
                    removeProperty(version, [
                        'date',
                        'npm',
                        'v8',
                        'uv',
                        'zlib',
                        'openssl',
                        'modules',
                        'lts',
                        'files'
                    ]);
                }

                if (_dev.directoryExists(tempDir)) {
                    _dev.rmdir(tempDir);
                }
            } catch (error) {
                if (_dev.directoryExists(tempDir)) {
                    _dev.rmdir(tempDir);
                }

                throw error;
            }

            return versionsInfo;
        }
    }

    module.exports = new NodeEnvironment();

    /* DEVCODE-BEGIN */
    // Assert
    /* DEVCODE-END */
})();
