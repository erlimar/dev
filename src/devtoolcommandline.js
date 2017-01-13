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

        self._name = 'dev';
        self._exitCode = 0;
        self._options = parseArgOptions(process.argv.slice(2));
        self._cmd = (this._options.args.shift() || '').toLowerCase();
        self._builtin = new Object;

        // Registry Built-in DevCom.
        try {
            builtins.map((value) => {
                self.builtin = value;
            });
        } catch (error) {
            lib.logger.error(error);
            self.exitCode = error.code || 1;
        }
    }

    /**
     * Name of the Dev Tool Command Line program
     */
    get name() {
        return this._name;
    }

    get exitCode() {
        return this._exitCode;
    }

    set exitCode(value) {
        this._exitCode = value;
    }

    help() {
        let lines = [
            '',
            '________',
            '___  __ \\_______   __',
            '__  / / /  _ \\_ | / /',
            '_  /_/ //  __/_ |/ /',
            '/_____/ \\___/_____/  v' + TOOL_VERSION,
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
        this.help();

        lib.printf('DevCom:');

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
     */
    exit() {
        process.exit(this.exitCode);
    }

    /**
     * Run the tool
     */
    run() {
        try {
            if (!this._cmd || /^[-]{1}.+$/.test(this._cmd)) {
                this.usage();
                this.exit(ERROR_CODE_DEVCOM_NOTINFORMED);
            }

            if (this._cmd === 'help') {
                this.help();
                this.exit(0);
            }

            let devcom = this.builtin[this._cmd] || lib.require('cmd://' + this._cmd);

            if (!devcom) {
                throw createError('DEVCOM [' + this._cmd + '] not found!');
            }

            devcom.run(this, this._options);
        } catch (error) {
            lib.logger.error(error);
            this.exitCode = error.code || 1;
        }
    }

    get shell() {
        return this._options.shell;
    }

    /**
     * Get shell options
     */
    get shellOptions() {
        let options,
            shell = (this.shell || '').toLowerCase();

        if (shell === 'cmd') {
            options = {
                path: _path.resolve(lib.devHome.tools, TOOL_ENVVARS_CMD),
                resolver: (name, value, onlyPrefix) => {
                    let prefix = 'set ' + name + '=';

                    if (onlyPrefix) {
                        return prefix;
                    }

                    return prefix + value;
                }
            }
        }

        if (shell === 'powershell') {
            options = {
                path: _path.resolve(lib.devHome.tools, TOOL_ENVVARS_PS1),
                resolver: (name, value, onlyPrefix) => {
                    let prefix = '$env:' + name + ' = ';

                    if (onlyPrefix) {
                        return prefix;
                    }

                    return prefix + '"' + value + '";';
                }
            }
        }

        if (shell === 'sh') {
            options = {
                path: _path.resolve(lib.devHome.tools, TOOL_ENVVARS_SH),
                resolver: (name, value, onlyPrefix) => {
                    let prefix = name + '=';

                    if (onlyPrefix) {
                        return prefix;
                    }

                    return prefix + '"' + value + '"';
                }
            }
        }

        if (!options) {
            throw createError('Shell can not be identified.');
        }

        return options;
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
