// Copyright (c) E5R Development Team. All rights reserved.
// Licensed under the Apache License, Version 2.0. More license information in LICENSE.txt.

/* global process, __filename, __dirname */

/* @TODO: Use Gulp to build system */

const TOOL_TITLE = 'E5R Tools for Development Team';
const TOOL_VERSION = '0.1.0-alpha';
const TOOL_COPYRIGHT = 'Copyright (c) E5R Development Team. All rights reserved.';
const TOOL_DEVFOLDER = '.dev';
const TOOL_DEFAULT_REGISTRY = 'https://raw.githubusercontent.com/e5r/dev/develop/dist/';
const TOOL_REGISTRY_FILE = 'registry.json';
const ERROR_CODE_DEVCOM_NOTINFORMED = 9001;

/**
 * Logger dispatcher
 */
class Logger {
    
    /**
     * Print verbosed messages
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

/**
 * Library for Dev
 */
let lib = new class DevToolLib {

    constructor() {
        this._os = require('os');
        this._path = require('path');
        this._fs = require('fs');
        this._url = require('url');
        this._http = require('http');
        this._https = require('https');
        this._childProcess = require('child_process');
        this._logger = new Logger();
    }
    
    /**
     * Tool folder map
     */
    get home() {
        let root = lib.path.resolve(lib.os.homedir(), TOOL_DEVFOLDER);
        return {
            root: root,
            tools: lib.path.join(root, 'tools'),
            bin: lib.path.join(root, 'bin'),
            lib: lib.path.join(root, 'lib')
        }
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
     * DevCom base class
     * 
     * @TODO: Move to `src/devcom.js`
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
     * 
     * @return {bool} `true` if success
     */
    download(url, path) {
        lib.logger.verbose('Downloading "' + url + '"...');
        let urlOptions = lib.url.parse(url),
            protocol = urlOptions.protocol.split(':')[0],
            wget = lib[protocol].request;
        
        // @TODO: Backup a file
        
        let file = lib.fs.createWriteStream(path);

        let req = wget(urlOptions, function(res) {
            if(res.statusCode !== 200){
                if(lib.fs.existsSync(path)){
                    lib.fs.unlink(path);
                    // callback
                }
                throw new lib.Error('Response status code: ' + res.statusCode + ' ' + res.statusMessage);
            }
            res.pipe(file);
        });
        
        file.on('finish', function(){
            lib.logger.debug('Download successfuly!');
            file.close(/* callback */);
        });
        
        req.on('error', function(error){
            if(lib.fs.existsSync(path)){
                lib.fs.unlink(path);
                // callback
            }
            throw new lib.Error('Download error:', error);
        });
        
        // @TODO: Add timeout.
        // req.setTimeout(12000, function () {
        //     req.abort();
        // });
        
        req.end();
    }
    
    downloadSync(url, path) {
        let jsEngine = process.execPath,
            jsEngineArgv = process.execArgv,
            jsScript = module.filename,
            exec = this.childProcess.spawnSync;
        
        //lib.logger.debug('downloadSync:', process);
              
        let child = exec(jsEngine, jsEngineArgv.concat([
                jsScript,
                'wget',
                url,
                path
            ]));
            
        lib.printf(child.output[2].toString());
        
        if(child.status !== 0) {
            lib.logger.error('======');
            lib.logger.error('Error: Failed of exec shell command');
            lib.logger.error('  PID:', child.pid);
            lib.logger.error('  CMD:', child.args.join(' '));
            lib.logger.error('======');
        }
    }
}

/**
 * E5R Development Tool command line
 * 
 * @TODO: Move to `src/devtool.js`
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

        return devcom.run(self, self._args);
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
            name = BuiltinType.name.toLowerCase();

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
 * DevCom `help` command
 * 
 * Show help information for tool and commands
 * 
 * @TODO: Move to `src/help.js`
 */
class Help extends lib.DevCom {
    
    /**
     * Run the `help` built-in devcom
     * 
     * @param {DevToolCommandLine} toolInstance - Instance of DevToolCommandLine
     * @param {Array} args - Argument list
     */
    run(toolInstance, args) {
        lib.logger.debug('Help built-in devcom is running...'); 
    }
}

/**
 * DevCom `wget` command
 * 
 * Download a web file
 * 
 * @TODO: Move to `src/wget.js`
 */
class WGet extends lib.DevCom {
    
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
 * 
 * Setup the E5R Development Tool on the user home
 * 
 * @TODO: Move to `src/setup.js`
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
        
        // mkdir %home%/.dev
        if (!lib.fs.existsSync(lib.home.root)) {
            lib.fs.mkdirSync(lib.home.root);
        }

        // mkdir %home%/.dev/tools
        if (!lib.fs.existsSync(lib.home.tools)) {
            lib.fs.mkdirSync(lib.home.tools);
        }

        // mkdir %home%/.dev/bin
        if (!lib.fs.existsSync(lib.home.bin)) {
            lib.fs.mkdirSync(lib.home.bin);
        }

        // mkdir %home%/.dev/lib
        if (!lib.fs.existsSync(lib.home.lib)) {
            lib.fs.mkdirSync(lib.home.lib);
        }
        
        // 1> Download de url://dist/registry.json para %HOME%\.dev\registry.json
        //   Este arquivo contém os URL's com plugins (DEVCOM - Development Command),
        //   no seguinte formato:
        //   {
        //       "default": {
        //           "type": "GitHub",
        //           "owner": "e5r",
        //           "repository": "dev",
        //           "branch": "develop",
        //           "path": "dist"
        //           },
        //           "sampleUrlForRegistryFile": "https://raw.githubusercontent.com/e5r/dev/develop/dist/registry.json"
        //       },
        //       "default-url": {
        //           "type": "URL",
        //           "repository": "http://dev.mycompany.com/plugins",
        //           "sampleUrlForRegistryFile": "http://dev.mycompany.com/plugins/registry.json"
        //       }
        //   }
        lib.downloadSync(
            lib.url.resolve(TOOL_DEFAULT_REGISTRY, TOOL_REGISTRY_FILE),
            lib.path.resolve(lib.home.root, TOOL_REGISTRY_FILE)
        );
        
        // 2> Add /bin to PATH
        //   - Inclui %HOME%\.dev\bin ao %PATH%
        //   - Ver o uso de arquivo *.CMD & *.PS1 para propagação de %PATH%.
        //   - Ver FLAG de tipo de sessão (PS1, CMD, SH)
        
        // 3> Instala binários
        //   - $> dev bin-install e5r-contrib
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
        //     js> lib.require('hlp://setup').show({full:true});
        
        // 4> Show completed info

    }
}

if(!module.parent && module.filename === __filename) {
    lib.logger.debug('Running DEV command...');
    // Instantiate and run the E5R Tools for Development Team process
    new DevToolCommandLine([
        Help,
        WGet,
        Setup,
    ]);
}else{
    lib.logger.debug('Required DEV command...');
    module.exports = lib;
}



/* 

@NOTES:
    
O primeiro argumento sempre deve ser o %DEVCOM%, e existe em:
%HOME%\.dev\tools\devcom\*.js

Se o mesmo não existir, percorre-se o registro (%HOME%\.dev\registry.json)
combinando a url gerada com o nome possível do arquivo em busca do arquivo
para download. 
*/

/*
DEVCOM padrões:

- help -> builtin
    Exibe o arquivo /help/devcom/command.html no navegador
    ou, /help/devcom/command.man/ no prompt

- registry -> builtin
    * list -> Lista os nomes dos registros em `registry.json`
    * show [name] -> Exibe as informações do registro X em `registry.json`
    * remove [name] -> Remove um registro da lista
    * update [url for registry.json] -> Faz um merge do `registry.json` atual com o baixado da url
    Todos os registros no remoto serão adicionados ou substituirão os existentes localmente
*/
