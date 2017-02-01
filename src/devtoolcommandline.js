/* DEVCODE-BEGIN */
(async () => {
    "use strict";

    var devUtil = require('../scripts/devutils');

    devUtil
        .ensureNode()
        .requireGlobal([
            'global-consts',
            'global-extensions',
            'global-functions',
            'global-vars',

            'devtoollib',
            'wget',
            'setup'
        ]);
    /* DEVCODE-END */

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

            self._name = TOOL_NAME;
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
                ''
            ];

            lib.printf(lines.join(_os.EOL));
            this.usage(true);

            lib.printf('\nDevCom:');

            let getNameDescription = (n, d) => {
                let nameFill = '                          ';
                return '  ' + n + nameFill.substr(n.length) + ' ' + d;
            };

            let devcomNames = Object.getOwnPropertyNames(this._builtin);
            for (let d in devcomNames) {
                let devcomName = devcomNames[d];
                let devcom = this._builtin[devcomName];
                lib.printf(getNameDescription(devcomName, devcom.shortDoc));
            }

            lib.printf(getNameDescription('???', 'Something'));

            lib.printf([
                '',
                'Options:',
                getNameDescription('--help|-h', 'Show this help text'),
                getNameDescription('--version|-v', 'Show version number'),
                getNameDescription('--workdir=[path]', 'Set the work directory. Default is ${cwd}'),
                getNameDescription('-devmode', 'Run on development mode')
            ].join(_os.EOL));
        }

        /**
         * Show usage text
         */
        usage(hideTitle) {
            let lines = [
                TOOL_TITLE,
                '',
                '    Version: ' + TOOL_VERSION,
            ];
            if (!hideTitle) {
                lib.printf(lines.join(_os.EOL));
                lib.printf();
            }
            lib.printf('usage: ' + this.name + ' [devcom] [options]');
        }

        /**
         * Show version number
         */
        showVersion() {
            lib.printf(TOOL_VERSION);
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
        async run() {
            try {
                if (!this._cmd && (this._options.help || this._options.h)) {
                    this.help();
                    return;
                }

                if (!this._cmd && (this._options.version || this._options.v)) {
                    this.showVersion();
                    return;
                }

                if (!this._cmd || /^[-]{1}.+$/.test(this._cmd)) {
                    this.usage();
                    this.exitCode = ERROR_CODE_DEVCOM_NOTINFORMED;
                    return;
                }

                let devcom = this.builtin[this._cmd] || await lib.require('cmd://' + this._cmd);

                if (!devcom) {
                    throw createError('DEVCOM [' + this._cmd + '] not found!');
                }

                await devcom.run(this, this._options);
            } catch (error) {
                lib.logger.error(error);
                this.exitCode = error.code || 1;
            }

            this.exit();
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

    /* DEVCODE-BEGIN */
    module.exports.DevToolCommandLine = DevToolCommandLine;

    if (!module.parent && module.filename === __filename && process.argv.indexOf('-devmode') >= 0) {
        _rootPath = _path.resolve(_os.homedir(), '.dev');
        _devPaths = {
            root: _rootPath,
            tools: _path.join(_rootPath, 'tools'),
            bin: _path.join(_rootPath, 'bin'),
            lib: _path.join(_rootPath, 'lib'),
            cmd: _path.join(_rootPath, 'lib', 'cmd'),
            doc: _path.join(_rootPath, 'doc')
        };

        process.argv.push('--shell=sh');

        var devTool = new DevToolCommandLine([Wget, Setup]);

        // Asserts
        _assert(devTool.name === 'dev', 'Invalid tool name');
        _assert(typeof devTool.builtin === 'object', 'Invalid builtins');
        _assert(devTool.builtin['wget'] instanceof Wget, 'Invalid wget builtin');
        _assert(devTool.builtin['setup'] instanceof Setup, 'Invalid setup builtin');
    }

})();
/* DEVCODE-END */