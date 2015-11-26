/**
 * Command line runner for E5R Tools for Development Team.
 * @class
 */
class DevToolCommandLine {
    
    /**
     * @constructor
     * 
     * @param {Array} builtins - List of built-in DevCom
     */
    constructor(builtins) {
        if (!Array.isArray(builtins)) {
            throw createError('Invalid @param builtins. Must be an array builtins.');
        }

        let self = this;

        self._args = process.argv.slice(2);
        self._name = 'dev';
        self._cmd = (this._args.shift() || '').toLowerCase();
        self._builtin = new Object;

        try {
            // Registry Built-in DevCom.
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
    
    help() {
        let lines = [
            '',
            '________',
            '___  __ \_______   __',
            '__  / / /  _ \_ | / /',
            '_  /_/ //  __/_ |/ /',
            '/_____/ \___/_____/  v' + TOOL_VERSION,
            '',
            TOOL_COPYRIGHT,
            '',
            TOOL_TITLE,
            'usage: ' + this.name + ' [devcom] [options]'
        ];
        
        lib.printf(lines.join(_os.EOL));
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
        
        if(this._cmd === 'help'){
            this.help();
            this.exit(0);
        }

        let devcom = this.builtin[this._cmd];

        // Load dynamic devcom
        if (!devcom) {
            devcom = lib.require('cmd://' + this._cmd);
        }

        if (!devcom) {
            throw createError('DEVCOM [' + this._cmd + '] not found!');
        }
        
        devcom.run(this, parseArgOptions(this._args));
    }
    
    /**
     * Built-in DevCom Getter
     */
    get builtin() {
        return this._builtin;
    }
    
    /**
     * Built-in DevCom Setter
     * 
     * @param {Builtin} BuiltinType - Class Built-in
     */
    set builtin(BuiltinType) {
        if (typeof (BuiltinType) != 'function') {
            throw createError('Invalid Built-in type');
        }

        let instance = new BuiltinType,
            name = lib.resolveCamelCaseName(BuiltinType.name);

        if (!(instance instanceof lib.DevCom)) {
            throw createError('Invalid Built-in type inheritance.');
        }

        if (this._builtin.hasOwnProperty(name)) {
            throw createError('Built-in DevCom [' + name + '] already exists.');
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
