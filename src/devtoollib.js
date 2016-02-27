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
        
        // Getter and Setter for user environment variables
        if(_os.platform() === 'win32'){
            this.__getUserEnvironment = getUserEnvironmentWin32;
            this.__setUserEnvironment = setUserEnvironmentWin32;
        }else{
            this.__getUserEnvironment = getUserEnvironmentUnix;
            this.__setUserEnvironment = setUserEnvironmentUnix;
        }
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
     */
    setUserEnvironment(varName, value) {
        this.__setUserEnvironment(varName, value);
    }
    
    /**
     * Add path to environment %PATH% var
     * 
     * @param {string} path - Path to add to %PATH%
     * @param {object} devTool - Instance of DevToolCommandLine
     * @return {string} Return a environment %PATH% updated
     */
    addPathToEnvironmentPath(path, devTool){
        let varName = _os.platform() === 'win32' ? 'Path' : 'PATH',
            pathSep = _os.platform() === 'win32' ? ';' : ':',
            processPath = (process.env[varName] || '').split(pathSep),
            userPath = (lib.getUserEnvironment(varName) || '').split(pathSep);
            
        // Update process environment
        if (0 > processPath.indexOf(path)) {
            let newPath = [path]
                .concat(processPath)
                .join(pathSep);
            process.env[varName] = newPath;
            appendUpdateEnvironmentFile(varName, newPath, devTool.shellOptions);
        }
        
        // Updatte user environment
        if (0 > userPath.indexOf(path)) {
            let newPath = [path]
                .concat(userPath)
                .join(pathSep);
            lib.setUserEnvironment(varName, newPath);
        }
    }

    /**
     * Download a web file
     * 
     * @param {string} url - Url for download
     * @param {string} path - Path to save file
     */
    download(url, path) {
        lib.logger.verbose('Downloading "' + url + '"...');

        let urlOptions = _url.parse(url),
            protocol = urlOptions.protocol.split(':')[0],
            wget = require(protocol).request;
    
        /** @todo: Backup a file */

        let file;

        let req = wget(urlOptions, function (res) {
            if (res.statusCode !== 200) {
                throw createError('Response status code: ' + res.statusCode + ' ' + res.statusMessage + ' >>> ' + url);
            }

            let dirname = _path.dirname(path);

            try {
                if (!_fs.statSync(dirname).isDirectory()) {
                    throw createError('Path "' + dirname + '" already exist and not a directory!');
                }
            } catch (e) {
                _fs.mkdirSync(dirname);
            }

            file = _fs.createWriteStream(path);

            file.on('finish', function () {
                lib.logger.verbose('Download successfuly!');
                file.close(/* callback */);
            });

            res.pipe(file);
        });

        req.on('error', function (error) {
            if (file) {
                file.close(/* callback */);
            }
            /** @todo: Change to _fs.statSync(path) */
            if (_fs.existsSync(path)) {
                _fs.unlink(path);
                // callback
            }
            throw createError('Download error:', error);
        });
    
        /** @todo: Add timeout */
        // req.setTimeout(12000, function () {
        //     req.abort();
        // });
    
        req.end();
    }

    /**
     * Download a web file with process blocked
     * 
     * @param {string} url - Url for download
     * @param {string} path - Path to save file
     */
    downloadSync(url, path) {
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

        lib.printf(child.output[1].toString());

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

            lib.printf(child.output[2].toString());

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
        
        /** @todo: Change to _fs.statSync(path) */
        let fileExists = _fs.existsSync(uriData.path);
    
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
     * Get `registry.{scope}.lock.json` content
     * 
     * @param {string} scope - Name of scope to get content
     * @return {object}
     */
    getRegistryLock(scope) {
        let registryLockFileName = TOOL_REGISTRY_LOCAL_LOCKFILE.replace(MAGIC_REGISTRY_LOCKNAME, scope),
            registryLockFilePath = _path.resolve(lib.devHome.root, registryLockFileName);

        lib.loadRegistryCache();

        // Download LOCK file
        /** @todo: Change to _fs.statSync(path) */
        if (!_fs.existsSync(registryLockFilePath)) {
            let registryURL = lib.makeRegistryUrl(lib.__registry_cache__[scope]);

            if (typeof registryURL !== 'string') {
                throw createError('Unable to determine the URL for registry "' + scope + '"');
            }
            
            let registryLockURL = lib.normalizeUrl(registryURL).concat(TOOL_REGISTRY_LOCKFILE);
            lib.downloadSync(registryLockURL, registryLockFilePath);
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
    loadRegistryCache(){
        let registryPath = _path.resolve(lib.devHome.root, TOOL_REGISTRY_FILE);

        /** @todo: Change to _fs.statSync(path) */
        if (!lib.__registry_cache__ && !_fs.existsSync(registryPath)) {
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
    getRegistry(){
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

        /** @todo: Change to _fs.statSync(path) */
        if (!_fs.existsSync(uriData.path)) {
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
}
