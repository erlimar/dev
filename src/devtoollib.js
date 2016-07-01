/** @instance */
var lib =

    /**
     * Library for E5R Tools for Development Team.
     * @class
     * 
     * @property {object} logger
     * @property {object} devHome
     * @property {string} devHome.root
     * @property {string} devHome.tools
     * @property {string} devHome.bin
     * @property {string} devHome.lib
     * @property {string} devHome.cmd
     * @property {string} devHome.doc
     */
    new class DevToolLib {

        /** @constructor */
        constructor() {
            this._logger = new Logger();

            // Enable cache 
            this.__require_cache__ = [];
            this.__registry_cache__ = null;

            // Getter and Setter for platform tools
            if (_os.platform() === 'win32') {
                this.__getUserEnvironment = getUserEnvironmentWin32;
                this.__setUserEnvironment = setUserEnvironmentWin32;
            } else {
                this.__getUserEnvironment = getUserEnvironmentUnix;
                this.__setUserEnvironment = setUserEnvironmentUnix;
            }
        }

        /**
         * Computer architecture
         */
        get arch() {
            if (!this._arch) {
                this._arch = _os.arch();
                if (this._arch !== 'x64') this._arch = 'x86';
            }
            return this._arch;
        }

        /**
         * Tool folder map
         */
        get devHome() {
            return _devPaths;
        }

        /**
         * Print formated messages on console
         */
        get printf() {
            return console.log;
        }

        /**
         * Logger message
         */
        get logger() {
            return this._logger;
        }

        /**
         * DevCom base class
         * 
         * @return {DevCom}
         */
        get DevCom() {
            return DevCom;
        }

        /**
         * Smart substitute for `mkdir()' native function
         * 
         * @param {string} path
         */
        mkdir(path) {
            let stat;
            try {
                stat = _fs.statSync(path);
                if (stat.isDirectory()) return;
                throw createError('Path "' + path + '" already exists and not a directory.');
            } catch (error) {
                if (error.code !== 'ENOENT') throw error;
                try {
                    _fs.mkdirSync(path);
                } catch (error_into) {
                    if (error_into.code !== 'ENOENT') throw error_into;
                    let dirname = _path.dirname(path);
                    if (dirname === path) {
                        throw createError('Undefined error for path "' + path + '".');
                    }
                    this.mkdir(dirname);
                    _fs.mkdirSync(path);
                }
            }
        }

        /**
         * Smart substitute for `rmdir()` native function
         * 
         * @param {string} path
         */
        rmdir(path) {
            /** @note: Tank you @tkihira
             * 
             * https://gist.github.com/tkihira/2367067
             */
            if (!_fs.statSync(path).isDirectory()) {
                throw createError('Path "' + path + '" is not a directory.');
            }

            let list = _fs.readdirSync(path);

            for (let i in list) {
                let childPath = _path.join(path, list[i]);
                let stat = _fs.statSync(childPath);

                if (childPath === "." || childPath === "..") continue;
                if (stat.isDirectory()) {
                    this.rmdir(childPath);
                    continue;
                }

                _fs.unlinkSync(childPath);
            }

            _fs.rmdirSync(path);
        }

        /**
         * Smart substitute for `fs.rename()` native function
         * 
         * @param {string} oldPath
         * @param {string} newPath
         */
        rename(oldPath, newPath) {
            _fs.renameSync(oldPath, newPath);
        }

        /**
         * Smart substitute for `fs.exists()` native function
         * 
         * @param {string} path
         */
        pathExists(path) {
            try { _fs.statSync(path); return true; } catch (_) { /* silent */ }
            return false;
        }

        /**
         * Smart substitute for `fs.exists()` native function, only for files.
         * 
         * @param {string} path
         */
        fileExists(path) {
            try {
                let stat = _fs.statSync(path);
                return stat.isFile() || stat.isSymbolicLink();
            } catch (_) { /* silent */ }
            return false;
        }

        /**
         * Smart substitute for `fs.exists()` native function, only for directory.
         * 
         * @param {string} path
         */
        directoryExists(path) {
            try {
                let stat = _fs.statSync(path);
                return stat.isDirectory();
            } catch (_) { /* silent */ }
            return false;
        }

        /**
         * Check if directory is empty.
         * 
         * @param {string} path
         */
        directoryIsEmpty(path) {
            try {
                let list = _fs.readdirSync(path);
                return list.length === 0;
            } catch (_) { /* silent */ }
            return true;
        }

        /**
         * Generate a temporary directory name
         */
        generateTempDir() {
            return _path.join(_os.tmpdir(), _crypto.randomBytes(16).toString('hex'));
        }

        /**
         * Create a Error instance
         *
         * @param {string} msg - Message of error
         * @return {object} Instance of Error
         */
        createError(msg) {
            return createError(msg);
        }

        /**
         * Normalize a URL, adding '/' end if necessary.
         * 
         * @param {string} url - An URL
         * @return {string} An normalized URL
         */
        normalizeUrl(url) {
            if (typeof url !== 'string') {
                throw createError('Invalid url value. Must be an string.');
            }

            return url.concat(url.lastIndexOf('/') !== url.length - 1 ? '/' : '');
        }

        /**
         * Make a registry Url
         * 
         * @param {object} entry - Registry entry object
         * @return {string}
         */
        makeRegistryUrl(entry) {
            if (typeof entry !== 'object') {
                throw createError('Invalid content type of registry.');
            }

            let registryType = entry.type.toLowerCase();

            // GitHub type
            if (registryType === 'github' && entry.owner && entry.repository && entry.branch) {
                return 'https://raw.githubusercontent.com/{owner}/{repository}/{branch}/{path}'
                    .replace('{owner}', entry.owner)
                    .replace('{repository}', entry.repository)
                    .replace('{branch}', entry.branch)
                    .replace('{path}', entry.path ? entry.path : '');
            }

            // URL type
            if (registryType === 'url' && entry.url) {
                return '{base}/{path}'
                    .replace('{base}', entry.url)
                    .replace('{path}', entry.path ? entry.path : '');
            }

            throw createError('Invalid registry entry to generate URL: ' + JSON.stringify(entry, null, 2));
        }

        /**
         * Resolve name in camelCase to "camel-case"
         * 
         * @param {string} name - Name in camelCase
         * 
         * @return {string} - Return a name formated to "camel-case"
         */
        resolveCamelCaseName(name) {
            if (typeof name !== 'string') {
                throw createError('Param name is not a string');
            }

            let buffer = [],
                regex = RegExp('^[A-Z]$');

            for (let c = 0; c < name.length; c++) {
                let char = name.charAt(c);
                if (c > 0 && regex.test(char.toString())) {
                    buffer.push('-');
                }
                buffer.push(char.toLowerCase());
            }

            return buffer.join('');
        }

        /**
         * Make name "camel-case" from camelCase 
         * 
         * @param {string} name - Name
         * 
         * @return {string} - Return a name formated to "camelCase"
         */
        makeCamelCaseName(name) {
            if (typeof name !== 'string') {
                throw createError('Param name is not a string');
            }

            let buffer = [],
                regex = new RegExp('^[a-zA-Z0-9-_]+$'),
                nextUpper = false;

            if (!regex.test(name)) {
                throw createError('Invalid name for makeCamelCaseName.');
            }

            for (let c = 0; c < name.length; c++) {
                let char = name.charAt(c);
                if (char === '-' && 0 < buffer.length) {
                    nextUpper = true;
                    continue;
                }
                if (nextUpper) {
                    buffer.push(char.toUpperCase());
                    nextUpper = false;
                    continue;
                }
                buffer.push(char.toLowerCase());
            }

            return buffer.join('');
        }

        /**
         * Get a user environment variable value
         * 
         * @param {string} varName - Variable name
         * @return {string}
         */
        getUserEnvironment(varName) {
            return this.__getUserEnvironment(varName);
        }

        /**
         * Set a user environment variable value
         * 
         * @param {string} varName - Variable name
         * @param {string} value - Value of variable
         * @param {Object} shellOptions
         */
        setUserEnvironment(varName, value, shellOptions) {
            this.__setUserEnvironment(varName, value, shellOptions);
            //appendUpdateEnvironmentFile(varName, value, shellOptions);
        }

        /**
         * Extract a packaged file
         * 
         * @param {string} origin - Path to packaged file
         * @param {string} destination - Path do directory destination
         */
        extractFile(origin, destination) {
            let extractor = new ZipExtractor(origin);
            extractor.extractTo('./', destination);
        }

        /**
         * Add path to environment %PATH% var
         * 
         * @param {string} path - Path to add to %PATH%
         * @param {object} devTool - Instance of DevToolCommandLine
         * @return {string} Return a environment %PATH% updated
         */
        addPathToEnvironmentPath(path, devTool, onlyUser) {
            let varName = _os.platform() === 'win32' ? 'Path' : 'PATH',
                pathSep = _os.platform() === 'win32' ? ';' : ':',
                processPath = (process.env[varName] || '').split(pathSep),
                userPath = (lib.getUserEnvironment(varName) || '').split(pathSep);

            // Update process environment
            if (!onlyUser && 0 > processPath.indexOf(path)) {
                let newPath = [path]
                    .concat(processPath)
                    .join(pathSep);
                process.env[varName] = newPath;

                /** @todo: this really necessary? YES! Only here! */
                appendUpdateEnvironmentFile(varName, newPath, devTool.shellOptions);
            }

            // Update user environment       
            if (0 > userPath.indexOf(path)) {
                let newPath = [path]
                    .concat(userPath)
                    .join(pathSep);
                lib.setUserEnvironment(varName, newPath, devTool.shellOptions);
            }
        }

        /**
         * Get a Token environment variable
         * 
         * @sample: MY_VAR
         * @note: On *nix: $MY_VAR
         * @node: On Windows: %MY_VAR%, $env:MY_VAR
         * 
         * @param {string} varName
         * @return {string} 
         */
        getEnvironmentVarToken(varName, shell) {
            if (shell === 'cmd') return '%' + varName + '%';
            if (shell === 'powershell') return '$env:' + varName;
            return '$' + varName;
        }

        /**
         * Download a web file
         * 
         * @param {string} url - Url for download
         * @param {string} path - Path to save file
         * @param {object} options - Options object
         */
        download(url, path, options) {
            options = options || {};

            if (!(options.quiet || false)) {
                lib.logger.verbose('Downloading "' + url + '"...');
            }

            let urlOptions = _url.parse(url),
                protocol = urlOptions.protocol.split(':')[0],
                wget = require(protocol).request;

            /** @todo: Backup a file */

            let file;

            let req = wget(urlOptions, function (res) {
                if (res.statusCode !== 200) {
                    throw createError('Response status code: ' + res.statusCode + ' ' + res.statusMessage + ' >>> ' + url);
                }

                lib.mkdir(_path.dirname(path));

                file = _fs.createWriteStream(path);

                file.on('finish', function () {
                    if (!(options.quiet || false)) {
                        lib.logger.verbose('Download successfuly!');
                    }
                    file.close(/* callback */);
                });

                res.pipe(file);
            });

            req.on('error', function (error) {
                if (file) {
                    file.close(/* callback */);
                }

                if (lib.fileExists(path)) {
                    _fs.unlink(path);
                    // callback
                }
                throw createError('Download error:', error);
            });

            if (Number.isInteger(options.timeout) && options.timeout > 0) {
                req.setTimeout(options.timeout * 1000, function () {
                    req.abort();
                });
            }

            req.end();
        }

        /**
         * Download a web file with process blocked
         * 
         * @param {string} url - Url for download
         * @param {string} path - Path to save file
         * @param {object} options - Options object
         */
        downloadSync(url, path, options) {
            options = options || {};

            let jsEngine = process.execPath,
                jsEngineArgv = [],
                jsScript = module.filename,
                exec = _childProcess.spawnSync;

            /* @hack: No crash in node debug mode */
            process.execArgv.map((value) => {
                if (!value.startsWith('--debug-brk') && !value.startsWith('--nolazy')) {
                    jsEngineArgv.push(value);
                }
            });

            let child = exec(jsEngine, jsEngineArgv.concat([
                jsScript,
                'wget',
                url,
                path
            ]));

            if (!(options.quiet || false)) {
                let output = child.output[1].toString();
                if (typeof output === 'string' && 0 < output.trim().length) {
                    lib.printf();
                }
            }

            if (child.status !== 0) {
                let errorMessage;

                // Searching error message output
                let errorLines = child.output[2].toString().split(_os.EOL),
                    errorRegex = new RegExp('^Error: {1}(.+)$');

                for (let l in errorLines) {
                    let regexResult = errorRegex.exec(errorLines[l]);
                    if (regexResult) {
                        errorMessage = regexResult[1];
                        break;
                    }
                };

                if (errorMessage) {
                    throw createError(errorMessage);
                }

                if (!(options.quiet || false)) {
                    let output = child.output[2].toString();
                    if (typeof output === 'string' && 0 < output.trim().length) {
                        lib.printf(output);
                    }
                }

                throw createError(''
                    + 'Download failed to "' + url + '"' + _os.EOL
                    + '  PID: ' + child.pid + _os.EOL
                    + '  Command: ' + child.args.join(' ') + _os.EOL
                    + '  Exit Code: ' + child.status
                );
            }
        }

        /**
         * Load the resource object to cache from disk
         * 
         * @param {string} uri - Uniform Resource Identifier
         * 
         * @return {object} Cached object
         */
        loadCachedObjectResource(uri) {
            let uriData = compileRequireData(uri);

            // Load file from cache
            for (let c in lib.__require_cache__) {
                let cacheObj = lib.__require_cache__[c];
                if (cacheObj.name === uriData.urlSufix) {
                    return cacheObj.file;
                }
            }

            let fileExists = lib.fileExists(uriData.path);

            // Load Javascript file from disk
            if (fileExists && uriData.isJS) {
                let file = require(uriData.path);

                if (uriData.type === 'cmd' && !(file instanceof lib.DevCom)) {
                    throw createError('Invalid DevCom type inheritance.');
                }

                if (lib.__require_cache__.length >= CACHE_MAX_FILE) {
                    lib.__require_cache__.splice(0, 1);
                }

                lib.__require_cache__.push({
                    name: uriData.urlSufix,
                    file: file
                });

                return file;
            }

            // Load Text file from disk
            if (fileExists && !uriData.isJS) {
                let file = _fs.readFileSync(uriData.path, 'utf8');
                if (lib.__require_cache__.length >= CACHE_MAX_FILE) {
                    lib.__require_cache__.splice(0, 1);
                }
                lib.__require_cache__.push({
                    name: uriData.urlSufix,
                    file: file
                });
                return file;
            }

            return null;
        }

        /**
         * Make a registry lock file path
         * 
         * @param {string} scope - Name of scope to get content
         */
        makeRegistryLockFilePath(scope) {
            let fileName = TOOL_REGISTRY_LOCAL_LOCKFILE.replace(MAGIC_REGISTRY_LOCKNAME, scope);
            return _path.resolve(lib.devHome.root, fileName);
        }

        /**
         * Get `registry.{scope}.lock.json` content
         * 
         * @param {string} scope - Name of scope to get content
         * @return {object}
         */
        getRegistryLock(scope, force, options) {
            force = !!force;
            options = options || {};

            let registryLockFilePath = lib.makeRegistryLockFilePath(scope);

            lib.loadRegistryCache();

            // Download LOCK file
            if (force && lib.fileExists(registryLockFilePath)) {
                _fs.unlinkSync(registryLockFilePath);
            }

            if (!lib.fileExists(registryLockFilePath)) {
                let registryURL = lib.makeRegistryUrl(lib.__registry_cache__[scope]);

                if (typeof registryURL !== 'string') {
                    throw createError('Unable to determine the URL for registry "' + scope + '"');
                }

                let registryLockURL = lib.normalizeUrl(registryURL).concat(TOOL_REGISTRY_LOCKFILE);
                lib.downloadSync(registryLockURL, registryLockFilePath, options);
            }

            // Load LOCK file
            let lockContent = require(registryLockFilePath);

            if (!Array.isArray(lockContent)) {
                throw createError('Invalid lock content. Must be an array of file paths.');
            }

            return lockContent;
        }

        /**
         * Load the `registry.json` on cache
         */
        loadRegistryCache() {
            let registryPath = _path.resolve(lib.devHome.root, TOOL_REGISTRY_FILE);

            if (!lib.__registry_cache__ && !lib.fileExists(registryPath)) {
                throw createError('Registry file "' + TOOL_REGISTRY_FILE + ' " not found!');
            }

            if (!lib.__registry_cache__) {
                lib.__registry_cache__ = require(registryPath);
            }

            if (typeof lib.__registry_cache__ !== 'object') {
                throw createError('Invalid registry content. Must be an object.');
            }
        }

        /**
         * Get object for `registry.json`
         * 
         * @return {object}
         */
        getRegistry() {
            lib.loadRegistryCache();
            return lib.__registry_cache__;
        }

        /**
         * Download resource object from web
         * 
         * @param {string} uri - Uniform Resource Identifier
         */
        downloadWebObjectResource(uri) {
            let uriData = compileRequireData(uri);

            lib.loadRegistryCache();

            let registryScopes = Object.getOwnPropertyNames(lib.__registry_cache__),
                registryFileUrl;

            for (let scope in registryScopes) {
                let registryScope = registryScopes[scope],
                    registryContent = lib.__registry_cache__[registryScope];

                if (typeof registryContent.type !== 'string') {
                    throw createError('Invalid registry type for "' + registryScope + '"');
                }

                // Load LOCK file
                if (!registryContent.lock) {
                    registryContent.lock = lib.getRegistryLock(registryScope);
                }

                if (-1 < registryContent.lock.indexOf(uriData.urlSufix)) {
                    let registryURL = lib.makeRegistryUrl(registryContent);

                    if (typeof registryURL !== 'string') {
                        throw createError('Unable to determine the URL for registry "' + registryScope + '"');
                    }

                    registryFileUrl = lib.normalizeUrl(registryURL).concat(uriData.urlSufix);
                    break;
                }
            }

            if (!registryFileUrl) {
                let typeName = uriData.type === 'cmd'
                    ? 'DevCom'
                    : uriData.type === 'lib'
                        ? 'Library'
                        : 'Documentation';
                throw createError(typeName + ' "' + uriData.name + '' + '" not found!');
            }

            lib.downloadSync(registryFileUrl, uriData.path);

            if (!lib.fileExists(uriData.path)) {
                throw createError('Download failed to:', registryFileUrl);
            }
        }

        /**
         * Smart substitute for `require()' native function
         * 
         * @param {string} uri - Uniform Resource Identifier
         * 
         * @return {object}
         */
        require(uri) {
            let cachedFile = lib.loadCachedObjectResource(uri);

            if (!cachedFile) {
                lib.downloadWebObjectResource(uri);
                cachedFile = lib.loadCachedObjectResource(uri);
            }

            if (cachedFile) {
                return cachedFile;
            }

            throw createError('Unexpected result to lib.require()!');
        }

        /**
         * Transform argument list in object key value pair
         * 
         * @example
         * // $input = 'install --scope MY_SCOPE -flag1 -flag2 --key=Value "Other value" -flag3'
         *   
         * // $output:
         * {
         *   args: ['install', 'Other value'],
         *   scope: 'MY_SCOPE',
         *   flag1: true,
         *   flag2: true,
         *   key: 'Value',
         *   flag3: true
         * }
         * 
         * @param {array} args - Argument list
         * @return {object} Object options
         */
        parseOptions(args) {
            return parseArgOptions(args);
        }

        /**
         * Show prompt message and get a user string
         * 
         * @param {string} message - Prompt message
         * @return {string} User input
         */
        prompt(message) {
            let buffer = new Buffer(1),
                /** @todo: Use Buffer */
                input = '';

            _fs.writeSync(process.stdout.fd, message, 0, 'utf-8');
            while (true) {
                let r = _fs.readSync(process.stdin.fd, buffer, 0, 1, 0);
                if (1 > r || buffer[0] === 13) break;
                if (buffer[0] === 10) continue;
                input += buffer.toString();
            }

            return input;
        }
    }
