// Copyright (c) E5R Development Team. All rights reserved.
// Licensed under the Apache License, Version 2.0. More license information in LICENSE.txt.

/* global process, __filename, __dirname */

/* @TODO: Use Gulp to build system */

const TOOL_TITLE = 'E5R Tools for Development Team';
const TOOL_VERSION = '0.1.0-alpha';
const TOOL_COPYRIGHT = 'Copyright (c) E5R Development Team. All rights reserved.';
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
        this._path = require('path');
        this._logger = new Logger();
    }
    
    /**
     * Alias to `require('path')`
     */
    get path() {
        return this._path;
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
                * @param {Array} args - Arguments of command
                */
                run(args) {
                    throw new lib.Error('Built-in [run()] not implemented.');
                }
            }
        }
        
        return  this._DevComType_;
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

        this._args = process.argv.slice(2);
        this._name = lib.path.parse(__filename).name;
        this._cmd = (this._args.shift() || '').toLowerCase();
        this._builtin = new Object;

        this.registry(builtins);
        this.run();
    }
    
    /**
     * Show usage text
     */
    usage() {
        lib.printf('%s v%s', TOOL_TITLE, TOOL_VERSION);
        lib.printf('%s', TOOL_COPYRIGHT);
        lib.printf();
        lib.printf('Usage: %s [devcom] [options]', this._name);
        lib.printf();
        lib.printf('DevCom:');

        let devcomNames = Object.getOwnPropertyNames(this._builtin);
        for (let d in devcomNames) {
            let devcom = this._builtin[devcomNames[d]];
            lib.printf('  %s', devcom.getType().name.toLowerCase());
        }

        lib.printf('  %s', '???');
        lib.printf();
        lib.printf('Options:');
        lib.printf('  ???');
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
        for (let b in builtins) {
            this.builtin = builtins[b];
        }
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

        if (!devcom) {
            throw new lib.Error('DEVCOM [' + this._cmd + '] not found!');
        }

        devcom.run(this._args);
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
     * @param {Array} args - Argument list
     */
    run(args) {
        lib.logger.debug('Help built-in devcom is running...'); 
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
     * @param {Array} args - Argument list
     */
    run(args) {
        lib.logger.debug('Set-up built-in devcom is running...');
        
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
        
        // 2> Download de url://dist/bin/dev.{cmd,ps1} (Windows) para %HOME%\.dev\bin\dev.{cmd,ps1}
        //   Esses arquivos (dev.cmd e dev.ps1) devem somente repassar os argumentos para o comando
        //   nodeJS [jsengine.exe dev.js *ARGS*]
        //   - Inclui %HOME%\.dev\bin ao %PATH%
        //   - Ver o uso de arquivo *.CMD & *.PS1 para propagação de %PATH%.
        
        // 3> Download de url://dist/tools/dev.js par %HOME%\.dev\tools\dev.js
        
        // 4> Apagar este arquivo (%HOME%\.dev\tools\install.js)

    }
}

if(!module.parent && module.filename === __filename) {
    lib.logger.debug('Running DEV command...');
    // Instantiate and run the E5R Tools for Development Team process
    new DevToolCommandLine([
        Help,
        Setup
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
