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
const TOOL_DEFAULT_SCOPE = 'e5r-devcom'; // 

/** @constant {string} */
const TOOL_REGISTRY_FILE = 'registry.json';

/** @constant {string} */
const REQUIRE_URI_REGEX = '^(cmd|lib|doc)://(([a-z0-9]|\-|_)+)$';

/** @constant {number} */
const CACHE_MAX_FILE = 2;

/** @constant {string} */
const TOOL_REGISTRY_LOCKFILE = 'registry.lock.json';

/** @constant {string} */
const MAGIC_REGISTRY_LOCKNAME = '{name}';

/** @constant {string} */
const TOOL_REGISTRY_LOCAL_LOCKFILE = 'registry.' + MAGIC_REGISTRY_LOCKNAME +'.lock.json';

/** @constant {number} */
const ERROR_CODE_DEVCOM_NOTINFORMED = 9001;

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
        if(!this._debug) {
            this._debug = require('util').debuglog('E5RDEV');
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

/** @instance */
let lib = 

/**
 * Library for E5R Tools for Development Team.
 * @class
 * 
 * @property {object} os
 * @property {object} path
 * @property {object} fs
 * @property {object} url
 * @property {object} http
 * @property {object} https
 * @property {object} childProcess
 * @property {object} printf
 * @property {object} logger
 * @property {object} Error
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
        this._os = require('os');
        this._path = require('path');
        this._fs = require('fs');
        this._url = require('url');
        this._http = require('http');
        this._https = require('https');
        this._childProcess = require('child_process');
        this._logger = new Logger();
        
        // Enable cache to lib.require() 
        this.__require_cache__ = [];
        this.__registry_cache__ = null;
        
        // Home map
        this._devHome = (root => {
            return {
                root: root,
                tools: this._path.join(root, 'tools'),
                bin: this._path.join(root, 'bin'),
                lib: this._path.join(root, 'lib'),
                cmd: this._path.join(root, 'lib', 'cmd'),
                doc: this._path.join(root, 'doc')
            }})(this._path.resolve(this._os.homedir(), TOOL_DEVFOLDER));
    }
    
    /**
     * Tool folder map
     */
    get devHome() {
        return this._devHome;
    }
    
    /**
     * Alias to `require('os')`
     */
    get os() {
       return this._os; 
    }
    
    /**
     * Alias to `require('path')`
     */
    get path() {
        return this._path;
    }
    
    /**
     * Alias to `require('fs')`
     */
    get fs() {
        return this._fs;
    }
    
    /**
     * Alias to `require('url')`
     */
    get url() {
        return this._url;
    }

    /**
     * Alias to `require('http')`
     */
    get http() {
        return this._http;
    }
    
    /**
     * Alias to `require('https')`
     */
    get https() {
        return this._https;
    }
    
    /**
     * Alias to `require('child_process')`
     */
    get childProcess() {
        return this._childProcess;
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
     * Alias for `Error`
     */
    get Error() {
        return Error;
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
            throw new lib.Error('Param name is not a string');
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
     * DevCom base class
     * 
     * @todo: Move to `src/devcom.js`
     * 
     * @return {DevCom}
     */
    get DevCom() {
        if(!this._DevComType_) {
            this._DevComType_ = class DevCom {
                /**
                * Run the builtin command
                * 
                * @param {DevToolCommandLine} toolInstance - Instance of DevToolCommandLine
                * @param {Array} args - Arguments of command
                */
                run(toolInstance, args) {
                    throw new lib.Error('Built-in [run()] not implemented.');
                }
            } 
        }
        
        return  this._DevComType_;
    }
    
    /**
     * Download a web file
     * 
     * @param {string} url - Url for download
     * @param {string} path - Path to save file
     */
    download(url, path) {
        lib.logger.verbose('Downloading "' + url + '"...');
        let urlOptions = lib.url.parse(url),
            protocol = urlOptions.protocol.split(':')[0],
            wget = lib[protocol].request;
        
        /**
         * @todo: Backup a file
         */
        
        let file;
        
        let req = wget(urlOptions, function (res) {
            if (res.statusCode !== 200) {
                throw new lib.Error('Response status code: ' + res.statusCode + ' ' + res.statusMessage + ' >>> ' + url);
            }

            file = lib.fs.createWriteStream(path);

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
            if (lib.fs.existsSync(path)) {
                lib.fs.unlink(path);
                // callback
            }
            throw new lib.Error('Download error:', error);
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
     * 
     * @return {bool}
     */    
    downloadSync(url, path) {
        let jsEngine = process.execPath,
            jsEngineArgv = [],
            jsScript = module.filename,
            exec = this.childProcess.spawnSync;

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
            lib.logger.error('======');
            lib.logger.error('Error: Failed of exec shell command');
            lib.logger.error('  PID:', child.pid);
            lib.logger.error('  CMD:', child.args.join(' '));
            lib.logger.error('======');
        }

        return lib.fs.existsSync(path);
    }
    
    /** @todo: Move to new method */
    compileRequireData(uri) {
        if (typeof uri !== 'string') {
            throw new lib.Error('Param uri is not a string');
        }

        let regex = new RegExp(REQUIRE_URI_REGEX),
            regexResult = regex.exec(uri);

        if (!regexResult) {
            throw new lib.Error('Invalid URI: "' + uri + '" for lib.require().');
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

        let path = lib.path.resolve(lib.devHome.root, parts.join(lib.path.sep)),
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
    
    /** @todo: Move to new method */
    loadCachedObjectResource(uriData) {
        // Load file from cache
        for (let c in lib.__require_cache__) {
            let cacheObj = lib.__require_cache__[c];
            if (cacheObj.name === uriData.urlSufix) {
                return cacheObj.file;
            }
        }
        
        let fileExists = lib.fs.existsSync(uriData.path);
        
        // Load Javascript file from disk
        /** @todo: Move to method */
        if (fileExists && uriData.isJS) {
            let file = require(uriData.path);
            if (lib.__require_cache__.length >= CACHE_MAX_FILE) {
                lib.__require_cache__.splice(0,1);
            }
            lib.__require_cache__.push({
                name: uriData.urlSufix,
                file: file
            });
            return file;
        }
        
        // Load Text file from disk
        /** @todo: Move to method */
        if (fileExists && !uriData.isJS) {
            let file = lib.fs.readFileSync(uriData.path, 'utf8');
            if (lib.__require_cache__.length >= CACHE_MAX_FILE) {
                lib.__require_cache__.splice(0,1);
            }
            lib.__require_cache__.push({
                name: uriData.urlSufix,
                file: file
            });
            return file;
        }
        
        return null;
    }
    
    /** @todo: Move to new method */
    loadWebObjectResource(uriData) {
        /** @todo: Use compileRequireData(uri string) over uriData */ 
        let registryPath = lib.path.resolve(lib.devHome.root, TOOL_REGISTRY_FILE);
        
        if(!lib.__registry_cache__ && !lib.fs.existsSync(registryPath))
        {
            throw new lib.Error('Registry file "' + TOOL_REGISTRY_FILE + ' " not found!');
        }
        
        if(!lib.__registry_cache__){
            let registry_text = lib.fs.readFileSync(registryPath, 'utf8');
            lib.__registry_cache__ = JSON.parse(registry_text);
        }
        
        if (typeof lib.__registry_cache__ !== 'object') {
            throw new lib.Error('Invalid registry content. Must be an object.');
        }
        
        let registryNames = Object.getOwnPropertyNames(lib.__registry_cache__),
            registryFileUrl;
        
        for (let r in registryNames) {
            let registryName = registryNames[r],
                registryContent = lib.__registry_cache__[registryName],
                registryLockFileName = TOOL_REGISTRY_LOCAL_LOCKFILE.replace(MAGIC_REGISTRY_LOCKNAME, registryName),
                registryLockFilePath = lib.path.resolve(lib.devHome.root, registryLockFileName),
                registryType = registryContent.type.toLowerCase(),
                registryURL;
            
            if (typeof registryContent.type !== 'string') {
                throw new lib.Error('Invalid registry type for "' + registryName + '"');
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
                throw new lib.Error('Unable to determine the URL for registry "' + registryName + '"');
            }
            
            // Normalize lock URL
            let registryLockURL = registryURL.concat(
                    registryURL.lastIndexOf('/') !== registryURL.length - 1
                    ? '/' + TOOL_REGISTRY_LOCKFILE
                    : TOOL_REGISTRY_LOCKFILE
                );
            
            // Download LOCK file
            if (!registryContent.lock && !lib.fs.existsSync(registryLockFilePath)) {
                lib.downloadSync(registryLockURL, registryLockFilePath);
            }
            
            // Load LOCK file
            if (!registryContent.lock) {
                registryContent.lock = require(registryLockFilePath);
                
                if(!Array.isArray(registryContent.lock)){
                    throw new lib.Error('Invalid lock content. Must be an array of file paths.');
                }
            }
            
            if(-1 < registryContent.lock.indexOf(uriData.urlSufix)){
                // Normalize lock URL
                registryFileUrl = registryURL.concat(
                        registryURL.lastIndexOf('/') !== registryURL.length - 1
                        ? '/' + uriData.urlSufix
                        : uriData.urlSufix
                    );
                break;
            }
        }
        
        if(!registryFileUrl){
            let typeName = uriData.type === 'cmd'
                ? 'DevCom'
                : uriData.type === 'lib'
                ? 'Library'
                : 'Documentation';
            throw new lib.Error(typeName + ' "' + uriData.name + '' + '" not found!');
        }
        
        lib.downloadSync(registryFileUrl, uriData.path);
        
        if (!lib.fs.existsSync(uriData.path)) {
            throw new lib.Error('Download failed to:', registryFileUrl);
        }
    }
    
    /**
     * Smart substitute for `require()' native function
     * 
     * @todo: Not Implemented!
     * 
     * @param {string} uri - URI for resource
     * 
     * @return {object}
     */
    require(uri){
        let uriData = lib.compileRequireData(uri),
            cachedFile = lib.loadCachedObjectResource(uriData);
        
        if(!cachedFile){
            lib.loadWebObjectResource(uriData);
            cachedFile = lib.loadCachedObjectResource(uriData);
        }
        
        if(cachedFile){
            return cachedFile;
        }
        
        throw new lib.Error('Unexpected result to lib.require()!');
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
            throw new lib.Error('Invalid @param builtins. Must be an array builtins.');
        }
        
        let self = this;

        self._args = process.argv.slice(2);
        self._name = lib.path.parse(__filename).name;
        self._cmd = (this._args.shift() || '').toLowerCase();
        self._builtin = new Object;
        
        self.registry(builtins)
            .then(self.run)
            .catch(function(error){
                lib.logger.error(error);
                self.exit(error.code || 1);
            });
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
            .join(lib.os.EOL),
            
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
            .join(lib.os.EOL)
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
     * Registry Built-in Functions.
     * 
     * @param {Array} builtins - List of built-in functions
     * 
     * @return {Promise}
     */
    registry(builtins) {
        let self = this;
        return new Promise(function (resolve, reject) {
            try {
                for (let b in builtins) {
                    self.builtin = builtins[b];
                }
                resolve(self);
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Run the tool
     */
    run(self) {
        if (!self._cmd) {
            self.usage();
            self.exit(ERROR_CODE_DEVCOM_NOTINFORMED);
        }

        let devcom = self.builtin[self._cmd];

        if (!devcom) {
            throw new lib.Error('DEVCOM [' + self._cmd + '] not found!');
        }

        devcom.run(self, self._args);
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
            throw new lib.Error('Invalid Built-in type');
        }

        let instance = new BuiltinType,
            name = lib.resolveCamelCaseName(BuiltinType.name);

        if (!(instance instanceof lib.DevCom)) {
            throw new lib.Error('Invalid Built-in type inheritance.');
        }
        
        if (this._builtin.hasOwnProperty(name)) {
            throw new lib.Error('Built-in Function [' + name + '] already exists.');
        }
        
        Object.defineProperty(instance, 'getType', {
            value: function() {
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
     * @param {DevToolCommandLine} toolInstance - Instance of DevToolCommandLine
     * @param {Array} args - Argument list
     */
    run(toolInstance, args) {
        if(args.length !== 2) {
            let lines = [
                'WGet usage: ' + toolInstance.name + ' wget [url] [path]',
                '  url    URL of the web file',
                '  path   Path to save web file local'
            ];
            
            throw new lib.Error(lines.join(lib.os.EOL));
        } 
        
        let url = lib.url.parse(args[0]),
            path = lib.path.resolve(args[1]);
        
        if(!url.protocol) {
            throw new lib.Error('Invalid URL: ' + args[0]);
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
     * @param {DevToolCommandLine} toolInstance - Instance of DevToolCommandLine
     * @param {Array} args - Argument list
     */
    run(toolInstance, args) {
        lib.printf('Set-up E5R Tools for Development Team...');
        
        // 2> Make directory structure
        [
            lib.devHome.root,
            lib.devHome.tools,
            lib.devHome.bin,
            lib.devHome.lib,
            lib.devHome.cmd,
            lib.devHome.doc
        ].map(path => {
            if (!lib.fs.existsSync(path)) {
                lib.fs.mkdirSync(path);
            }
        });
        
        // 2> Download `registry.json`
        lib.downloadSync(
            lib.url.resolve(TOOL_DEFAULT_REGISTRY_URL, TOOL_REGISTRY_FILE),
            lib.path.resolve(lib.devHome.root, TOOL_REGISTRY_FILE)
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
        
        // 4> Instala binários
        //   - $> dev bin-install e5r-devcom
        //   - Download de url://dist/bin/dev.{cmd,ps1} (Windows) para %HOME%\.dev\bin\dev.{cmd,ps1}
        //     Esses arquivos (dev.cmd e dev.ps1) devem somente repassar os argumentos para o comando
        //     nodeJS [jsengine.exe dev.js *ARGS*]
        //
        //   - Sugest:
        //     js> let binInstall = lib.require('devcom/bin-install');
        //     js> if(binInstall.run(toolInstance, ['e5r-contrib']))...
        //
        //   - Others:
        //     js> lib.require('lib://my-lib');
        //     js> lib.require('cmd://bin-install');
        //     js> lib.require('doc://setup').show({full:true});
        // $> dev registry install "bin,doc" --scope "e5r-devcom"
        // let cmd = lib.require('cmd://registry');
        // 
        // cmd.run(toolInstance, [
        //     'install', 'bin,doc',
        //     '--scope', TOOL_DEFAULT_SCOPE
        // ]);
        
        let _cmd = lib.require('cmd://registry');
        
        // Ideia
        /*
        // let cmd = lib.require('cmd://registry');
        //
        // cmd.run(toolInstance, [
        //     'install',
        //     '--resources', 'bin,doc',
        //     '--scope', TOOL_DEFAULT_SCOPE
        // ]);
        //
        // Lib.require => Usa lib.getResources('DevComName') pra baixar arquivos da Web
        //                depois carrega.
        //
        // Registry.js {
             let command = args.splice(0, 1);
             let params = lib.parseParams(args);
             
             if(command === 'install') {
                 lib.getResources(params.resources, params.scope);
                 return;
             }
             
             ...
        // }
        */
        
        _cmd.run(toolInstance, args);
        
        let _cmdCache = lib.require('cmd://registry'),
            _lib = lib.require('lib://my-lib'),
            _libCache = lib.require('lib://my-lib'),
            _doc = lib.require('doc://my-lib'),
            _docCache = lib.require('doc://my-lib');
        
        // 5> Show completed info
        lib.printf('Set-up completed!');
    }
}

if (!module.parent && module.filename === __filename) {
    lib.logger.debug('Running DEV command line tool!');
    
    // Run process tools
    new DevToolCommandLine([
        Wget,
        Setup,
    ]);
} else {
    lib.logger.debug('Required DEV tool!');
}

exports = module.exports = lib;