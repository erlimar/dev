// Copyright (c) E5R Development Team. All rights reserved.
// Licensed under the Apache License, Version 2.0. More license information in LICENSE.txt.

/* global process, __filename, __dirname */

/**
 * @todo: Use Gulp to build system
 * @todo: Add async support
 * @todo: Implements verbosity
 */

/** @constant {string} */
const TOOL_TITLE = 'E5R Tools for Development Team';

/** @constant {string} */
const TOOL_VERSION = '0.1.0-alpha';

/** @constant {string} */
const TOOL_COPYRIGHT = 'Copyright (c) E5R Development Team. All rights reserved.';

/** @constant {string} */
const TOOL_DEVFOLDER = '.dev';

/** @constant {string} */
const TOOL_DEFAULT_REGISTRY_URL = 'https://raw.githubusercontent.com/e5r/dev/develop/dist/';

/** 
 * @constant {string}
 * @see "dist/registry.json"
*/
const TOOL_DEFAULT_SCOPE = 'e5r-devcom'; 

/** @constant {string} */
const TOOL_REGISTRY_FILE = 'registry.json';

/** @constant {string} */
const REQUIRE_URI_REGEX = '^(cmd|lib|doc)://(([a-z0-9]|\-|_)+)$';

/** @constant {string} */
const PARAM_KEYVALUE_REGEX1 = '^[-]{2}([a-zA-Z0-9-_]+)[=]{1}([^=]+)$';

/** @constant {string} */
const PARAM_KEYVALUE_REGEX2 = '^[-]{2}([a-zA-Z0-9-_]+)$';

/** @constant {string} */
const PARAM_FLAG_REGEX = '^[-]{1}([a-zA-Z0-9-_]+)$';

/** @constant {number} */
const CACHE_MAX_FILE = 2;

/** @constant {string} */
const TOOL_REGISTRY_LOCKFILE = 'registry.lock.json';

/** @constant {string} */
const MAGIC_REGISTRY_LOCKNAME = '{name}';

/** @constant {string} */
const TOOL_REGISTRY_LOCAL_LOCKFILE = 'registry.' + MAGIC_REGISTRY_LOCKNAME + '.lock.json';

/** @constant {string} */
const DEBUG_IDENTIFY = 'E5RDEV';

/** @constant {number} */
const ERROR_CODE_DEVCOM_NOTINFORMED = 9001;

let _path = require('path'),
    _util = require('util'),
    _os = require('os'),
    _fs = require('fs'),
    _url = require('url'),
    _childProcess = require('child_process'),

    _rootPath = _path.resolve(_os.homedir(), TOOL_DEVFOLDER),

    _devPaths = {
        root: _rootPath,
        tools: _path.join(_rootPath, 'tools'),
        bin: _path.join(_rootPath, 'bin'),
        lib: _path.join(_rootPath, 'lib'),
        cmd: _path.join(_rootPath, 'lib', 'cmd'),
        doc: _path.join(_rootPath, 'doc')
    };

/**
 * Create a Error instance
 * 
 * @param {string} msg - Message of error
 * @return {object} Instance of Error
 */
function _createError(msg) {
    return new Error(msg);
}

/**
 * Compile information to URI require
 * 
 * @param {string} uri - Uniform Resource Identifier
 * @sample "(cmd|doc|lib)://[:alphanum:]"
 * 
 * @return {object} Object compiled for URI 
 */
function compileRequireData(uri) {
    if (typeof uri !== 'string') {
        throw _createError('Param uri is not a string');
    }

    let regex = new RegExp(REQUIRE_URI_REGEX),
        regexResult = regex.exec(uri);

    if (!regexResult) {
        throw _createError('Invalid URI: "' + uri + '" for lib.require().');
    }

    let type = regexResult[1],
        name = regexResult[2],
        fileName = name,
        isJS = false;

    if (type === 'cmd' || type === 'lib') {
        fileName = name.concat('.js');
        isJS = true;
    }

    if (type === 'doc') {
        fileName = name.concat('.txt');
    }

    let parts = [type, fileName];
    
    // .dev/cmd -> .dev/lib/cmd
    if (type === 'cmd') {
        parts = ['lib'].concat(parts);
    }

    let path = _path.resolve(_devPaths.root, parts.join(_path.sep)),
        urlSufix = parts.join('/');

    return {
        type: type,
        name: name,
        fileName: fileName,
        isJS: isJS,
        path: path,
        urlSufix: urlSufix
    }
}

/**
 * Resolve name in camelCase to "camel-case"
 * 
 * @param {string} name - Name in camelCase
 * 
 * @return {string} - Return a name formated to "camel-case"
 */
function resolveCamelCaseName(name) {
    if (typeof name !== 'string') {
        throw _createError('Param name is not a string');
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
 * Transform argument list in object key value pair
 * 
 * @example
 * // input: install --scope MY_SCOPE -flag1 -flag2 "Other value" -flag3  
 * // output = {
 * //   args: ['install', 'Other value'],
 * //   scope: 'MY_SCOPE',
 * //   flag1: true,
 * //   flag2: true,
 * //   flag3: true
 * // }
 * 
 * @param {array} args - Argument list
 * @return {object} Object options
 */
function parseArgOptions(args) {
    if (!Array.isArray(args)) {
        throw _createError('Invalid @param type for "args". Must be an array.');
    }

    let _options = { args: [] },
        _nextParams = [],
        regexKV1 = new RegExp(PARAM_KEYVALUE_REGEX1),
        regexKV2 = new RegExp(PARAM_KEYVALUE_REGEX2),
        regexFlag = new RegExp(PARAM_FLAG_REGEX);

    args.map((value) => {
        if (value.toLowerCase() === 'args') {
            throw _createError('Reserved word found. Not use "args" in arguments list!');
        }

        let kv1Result = regexKV1.exec(value),
            kv2Result = regexKV2.exec(value),
            flagResult = regexFlag.exec(value);

        // --param_key=Value
        if (kv1Result) {
            let paramName = kv1Result[1].toLowerCase(),
                paramValue = kv1Result[2];
            _options[paramName] = paramValue;
            return;
        }

        // --param_key "Value" part 1
        if (kv2Result) {
            let paramName = kv2Result[1].toLowerCase();
            _nextParams.push(paramName);
            return;
        }

        // -param-flag
        if (flagResult) {
            let paramName = flagResult[1].toLowerCase();
            _options[paramName] = true;
            return;
        }

        // --param_key "Value" part 2
        if (0 < _nextParams.length) {
            let paramName = _nextParams.shift();
            _options[paramName] = value;
            return;
        }

        // options.args
        _options.args.push(value);
    });

    _nextParams.map((value) => {
        _options[value] = null;
    });

    return _options;
}

/**
 * Logger dispatcher
 * @class
 * 
 * @property {object} verbose
 * @property {object} debug
 * @property {object} warning
 * @property {object} error
 */
class Logger {
    
    /**
     * Print verbose messages
     */
    get verbose() {
        return console.info;
    }
    
    /**
     * Print messages if environment variable NODE_DEBUG=E5RDEV
     */
    get debug() {
        if (!this._debug) {
            this._debug = _util.debuglog(DEBUG_IDENTIFY);
        }
        return this._debug;
    }
    /**
     * Print warning messages
     */
    get warning() {
        return console.warn;
    }
    
    /**
     * Print error messages
     */
    get error() {
        return console.error;
    }
}

/**
 * Base type for DevCom's
 */
class DevCom {
    /**
    * Run the builtin command
    * 
    * @param {object} devTool - Instance of DevToolCommandLine
    * @param {object} options - Options for arguments of command
    */
    run(devTool, options) {
        throw _createError('Built-in [run()] not implemented.');
    }
}

/** @instance */
let lib = 

    /**
     * Library for E5R Tools for Development Team.
     * @class
     * 
     * @property {object} printf
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
         * @todo: Move to `src/devcom.js`
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
            return _createError(msg);
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
        
            /**
             * @todo: Backup a file
             */

            let file;

            let req = wget(urlOptions, function (res) {
                if (res.statusCode !== 200) {
                    throw _createError('Response status code: ' + res.statusCode + ' ' + res.statusMessage + ' >>> ' + url);
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
                if (_fs.existsSync(path)) {
                    _fs.unlink(path);
                    // callback
                }
                throw _createError('Download error:', error);
            });
        
            /**
             * @todo: Add timeout
             */
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

            /* @hack: No crash node debug mode */
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

            lib.printf(child.output[2].toString());

            if (child.status !== 0) {
                throw _createError(''
                    + 'Download failed to "' + url + '"' + _os.EOL
                    + '  pid: ' + child.pid + _os.EOL
                    + '  cmd: ' + child.args.join(' ') + _os.EOL
                    + '  code: ' + child.status
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

            let fileExists = _fs.existsSync(uriData.path);
        
            // Load Javascript file from disk
            if (fileExists && uriData.isJS) {
                let file = require(uriData.path);

                if (uriData.type === 'cmd' && !(file instanceof lib.DevCom)) {
                    throw _createError('Invalid DevCom type inheritance.');
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
         * Download resource object from web
         * 
         * @param {string} uri - Uniform Resource Identifier
         */
        downloadWebObjectResource(uri) {
            let uriData = compileRequireData(uri),
                registryPath = _path.resolve(lib.devHome.root, TOOL_REGISTRY_FILE);

            if (!lib.__registry_cache__ && !_fs.existsSync(registryPath)) {
                throw _createError('Registry file "' + TOOL_REGISTRY_FILE + ' " not found!');
            }

            if (!lib.__registry_cache__) {
                lib.__registry_cache__ = require(registryPath);
            }

            if (typeof lib.__registry_cache__ !== 'object') {
                throw _createError('Invalid registry content. Must be an object.');
            }

            let registryNames = Object.getOwnPropertyNames(lib.__registry_cache__),
                registryFileUrl;

            for (let r in registryNames) {
                let registryName = registryNames[r],
                    registryContent = lib.__registry_cache__[registryName],
                    registryLockFileName = TOOL_REGISTRY_LOCAL_LOCKFILE.replace(MAGIC_REGISTRY_LOCKNAME, registryName),
                    registryLockFilePath = _path.resolve(lib.devHome.root, registryLockFileName),
                    registryType = registryContent.type.toLowerCase(),
                    registryURL;

                if (typeof registryContent.type !== 'string') {
                    throw _createError('Invalid registry type for "' + registryName + '"');
                }

                if (registryType === 'github' && registryContent.owner && registryContent.repository && registryContent.branch) {
                    registryURL = 'https://raw.githubusercontent.com/{owner}/{repository}/{branch}/{path}'
                        .replace('{owner}', registryContent.owner)
                        .replace('{repository}', registryContent.repository)
                        .replace('{branch}', registryContent.branch)
                        .replace('{path}', registryContent.path);
                }
            
                /** @todo: Implements type URL */
                //if(registryType === 'url' && registryContent...)
            
                if (typeof registryURL !== 'string') {
                    throw _createError('Unable to determine the URL for registry "' + registryName + '"');
                }
            
                // Normalize lock URL
                let registryLockURL = registryURL.concat(
                    registryURL.lastIndexOf('/') !== registryURL.length - 1
                        ? '/' + TOOL_REGISTRY_LOCKFILE
                        : TOOL_REGISTRY_LOCKFILE
                    );
            
                // Download LOCK file
                if (!registryContent.lock && !_fs.existsSync(registryLockFilePath)) {
                    lib.downloadSync(registryLockURL, registryLockFilePath);
                }
            
                // Load LOCK file
                if (!registryContent.lock) {
                    registryContent.lock = require(registryLockFilePath);

                    if (!Array.isArray(registryContent.lock)) {
                        throw _createError('Invalid lock content. Must be an array of file paths.');
                    }
                }

                if (-1 < registryContent.lock.indexOf(uriData.urlSufix)) {
                    // Normalize lock URL
                    registryFileUrl = registryURL.concat(
                        registryURL.lastIndexOf('/') !== registryURL.length - 1
                            ? '/' + uriData.urlSufix
                            : uriData.urlSufix
                        );
                    break;
                }
            }

            if (!registryFileUrl) {
                let typeName = uriData.type === 'cmd'
                    ? 'DevCom'
                    : uriData.type === 'lib'
                        ? 'Library'
                        : 'Documentation';
                throw _createError(typeName + ' "' + uriData.name + '' + '" not found!');
            }

            lib.downloadSync(registryFileUrl, uriData.path);

            if (!_fs.existsSync(uriData.path)) {
                throw _createError('Download failed to:', registryFileUrl);
            }
        }
    
        /**
         * Smart substitute for `require()' native function
         * 
         * @todo: Not Implemented!
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

            throw _createError('Unexpected result to lib.require()!');
        }
    }

/**
 * Command line runner for E5R Tools for Development Team.
 * @class
 * 
 * @todo: Move to `src/devtool.js`
 */
class DevToolCommandLine {
    
    /**
     * @constructor
     * 
     * @param {Array} builtins - List of built-in functions
     */
    constructor(builtins) {
        if (!Array.isArray(builtins)) {
            throw _createError('Invalid @param builtins. Must be an array builtins.');
        }

        let self = this;

        self._args = process.argv.slice(2);
        self._name = _path.parse(__filename).name;
        self._cmd = (this._args.shift() || '').toLowerCase();
        self._builtin = new Object;

        try {
            // Registry Built-in Functions.
            builtins.map((value) => {
                self.builtin = value;
            });
            
            // Start DevCom
            self.run();
        } catch (error) {
            lib.logger.error(error);
            self.exit(error.code || 1);
        }
    }
    
    /**
     * Name of the Dev Tool Command Line program
     */
    get name() {
        return this._name;
    }
    
    /**
     * Show usage text
     */
    usage() {
        lib.printf([
                '%s v%s',
                '%s',
                '',
                'Usage: %s [devcom] [options]',
                '',
                'DevCom:']
            .join(_os.EOL),

            TOOL_TITLE, TOOL_VERSION,
            TOOL_COPYRIGHT,
            this.name
            );


        let devcomNames = Object.getOwnPropertyNames(this._builtin);
        for (let d in devcomNames) {
            let devcom = this._builtin[devcomNames[d]];
            lib.printf('  %s', devcom.getType().name.toLowerCase());
        }

        lib.printf([
            '  ???',
            '',
            'Options:',
            '  ???']
            .join(_os.EOL)
            );
    }
    
    /**
     * Exit process tool
     * 
     * @param {int} code - Exit code
     */
    exit(code) {
        process.exit(code);
    }
    
    /**
     * Run the tool
     */
    run() {
        if (!this._cmd) {
            this.usage();
            this.exit(ERROR_CODE_DEVCOM_NOTINFORMED);
        }

        let devcom = this.builtin[this._cmd];

        /** @todo: Load dynamic devcom */
        // if (!devcom) {
        //     devcom = lib.require('cmd://' + this._cmd);
        // }

        if (!devcom) {
            throw _createError('DEVCOM [' + this._cmd + '] not found!');
        }
        
        devcom.run(this, parseArgOptions(this._args));
    }
    
    /**
     * Built-in Functions Getter
     */
    get builtin() {
        return this._builtin;
    }
    
    /**
     * Built-in Functions Setter
     * 
     * @param {Builtin} BuiltinType - Class Built-in
     */
    set builtin(BuiltinType) {
        if (typeof (BuiltinType) != 'function') {
            throw _createError('Invalid Built-in type');
        }

        let instance = new BuiltinType,
            name = resolveCamelCaseName(BuiltinType.name);

        if (!(instance instanceof lib.DevCom)) {
            throw _createError('Invalid Built-in type inheritance.');
        }

        if (this._builtin.hasOwnProperty(name)) {
            throw _createError('Built-in Function [' + name + '] already exists.');
        }

        Object.defineProperty(instance, 'getType', {
            value: function () {
                return BuiltinType
            }
        })

        Object.defineProperty(this._builtin, name, {
            value: instance
        })
    }
}

/**
 * DevCom `wget` command
 * @class
 * 
 * Download a web file
 * 
 * @todo: Move to `src/wget.js`
 */
class Wget extends lib.DevCom {
    
    /**
     * Run the `wget` built-in devcom
     * 
     * @param {object} devTool - Instance of DevToolCommandLine
     * @param {object} options - Options for argument list
     */
    run(devTool, options) {
        if (options.args.length !== 2) {
            let lines = [
                'WGet usage: ' + devTool.name + ' wget [url] [path]',
                '  url    URL of the web file',
                '  path   Path to save web file local'
            ];

            throw _createError(lines.join(_os.EOL));
        }

        let url = _url.parse(options.args[0]),
            path = _path.resolve(options.args[1]);

        if (!url.protocol) {
            throw _createError('Invalid URL: ' + options.args[0]);
        }

        lib.download(url.href, path);
    }
}

/**
 * Devcom `setup` command
 * @class
 * 
 * Setup the E5R Development Tool on the user home
 * 
 * @todo: Move to `src/setup.js`
 */
class Setup extends lib.DevCom {
    
    /**
     * Run the `setup` built-in command
     * 
     * @param {object} devTool - Instance of DevToolCommandLine
     * @param {object} options - Options for argument list
     */
    run(devTool, options) {
        lib.printf('Set-up E5R Tools for Development Team...');
        
        // 1> Make directory structure
        [
            lib.devHome.root,
            lib.devHome.tools,
            lib.devHome.bin,
            lib.devHome.lib,
            lib.devHome.cmd,
            lib.devHome.doc
        ].map(path => {
            if (!_fs.existsSync(path)) {
                _fs.mkdirSync(path);
            }
        });
        
        // 2> Download `registry.json`
        lib.downloadSync(
            _url.resolve(TOOL_DEFAULT_REGISTRY_URL, TOOL_REGISTRY_FILE),
            _path.resolve(lib.devHome.root, TOOL_REGISTRY_FILE)
            );
        
        // 3> Add /bin to PATH
        //   - Inclui %HOME%\.dev\bin ao %PATH%
        //   - Ver o uso de arquivo *.CMD & *.PS1 para propagação de %PATH%.
        //   - Ver FLAG de tipo de sessão (PS1, CMD, SH)
        /* @DOC
            - Comando windows para definição de variável do usuário
            SETX NOME_ERLIMAR "Erlimar Silva Campos"
            
            - Comando windows para definição de variável do usuário + máquina
            SETX NOME_ERLIMAR "Erlimar Silva Campos" /M
            
            - Sugestões para Linux
            ABC="123"; export ABC
            export ABC="123"
            echo 'export ABC="123"' >> ~/.profile
        */
        
        // 4> InstalL binary
        let registry = lib.require('cmd://registry');

        registry.run(devTool, parseArgOptions([
            'install',
            '--resources=bin,doc',
            '--scope', TOOL_DEFAULT_SCOPE
        ]));
        
        // 5> Show completed info
        lib.printf('Set-up completed!');
    }
}

/** @hack: No circular reference */
lib.DevTool = DevToolCommandLine;

exports = module.exports = lib;

if (!module.parent && module.filename === __filename) {
    // Run process tools
    new DevToolCommandLine([
        Wget,
        Setup,
    ]);
}
