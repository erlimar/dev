// Copyright (c) E5R Development Team. All rights reserved.
// Licensed under the Apache License, Version 2.0. More license information in LICENSE.txt.

/* global process, __filename, __dirname */

/* @TODO: Use Gulp to build system */

let util = require('util'),
    path = require('path'),

    _print = console.log,
    _verbose = console.info,
    _debug = console.log,
    _warning = console.warn,
    _error = console.error;

const TOOL_TITLE = 'E5R Tools for Development Team';
const TOOL_VERSION = '0.1.0-alpha';
const TOOL_COPYRIGHT = 'Copyright (c) E5R Development Team. All rights reserved.';
const ERROR_CODE_DEVCOM_NOTINFORMED = 9001;

/**
 * Builtin base class
 * 
 * @TODO: Move to `src/builtin.js`
 * @TODO: Rename to `DevCom` => `src/devcom.js`
 */
class Builtin {

    /**
     * Run the builtin command
     * 
     * @param {Array} args - Arguments of command
     */
    run(args) {
        throw new Error('Built-in [run()] not implemented.');
    }
}

/**
 * E5R Development Tool
 * 
 * @TODO: Move to `src/devtool.js`
 */
class DevTool {
    
    /**
     * @constructor
     * 
     * @param {Array} builtins - List of built-in functions
     */
    constructor(builtins) {
        if (!util.isArray(builtins)) {
            throw new Error('Invalid @param builtins. Must be an array builtins.');
        }

        this._args = process.argv.slice(2);
        this._name = path.parse(__filename).name;
        this._cmd = (this._args.shift() || '').toLowerCase();
        this._builtin = new Object;

        this.registry(builtins);
        this.run();
    }
    
    /**
     * Show usage text
     */
    usage() {
        _print('%s v%s', TOOL_TITLE, TOOL_VERSION);
        _print('%s', TOOL_COPYRIGHT);
        _print();
        _print('Usage: %s [devcom] [options]', this._name);
        _print();
        _print('DevCom:');

        let devcomNames = Object.getOwnPropertyNames(this._builtin);
        for (let d in devcomNames) {
            let devcom = this._builtin[devcomNames[d]];
            _print('  %s', devcom.name);
        }

        _print('  %s', '???');
        _print();
        _print('Options:');
        _print('  ???');
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
            throw new Error('DEVCOM [' + this._cmd + '] not found!');
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
            throw new Error('Invalid Built-in type');
        }

        let instance = new BuiltinType,
            name = BuiltinType.name.toLowerCase();

        if (!(instance instanceof Builtin)) {
            throw new Error('Invalid Built-in type inheritance.');
        }
        
        if (this._builtin.hasOwnProperty(name)) {
            throw new Error('Built-in Function [' + name + '] already exists.');
        }

        Object.defineProperty(this._builtin, name, {
            value: instance
        })
    }
}

/**
 * Built-in `help` command
 * 
 * Show help information for tool and commands
 * 
 * @TODO: Move to `src/help.js`
 */
class Help extends Builtin {
    
    /**
     * Run the `help` built-in command
     * 
     * @param {Array} args - Argument list
     */
    run(args) {
        _debug('Help built-in is running...'); 
    }
}

/**
 * Built-in `setup` command
 * 
 * Setup the E5R Development Tool on the user home
 * 
 * @TODO: Move to `src/setup.js`
 */
class Setup extends Builtin {
    
    /**
     * Run the `setup` built-in command
     * 
     * @param {Array} args - Argument list
     */
    run(args) {
        _debug('Set-up built-in is running...');
        
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

// Instantiate and run the E5R Tools for Development Team process
new DevTool([
    Help,
    Setup
]);

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
