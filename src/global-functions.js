/* DEVCODE-BEGIN */
(async () => {
    "use strict";

    var devUtil = require('../scripts/devutils');

    devUtil
        .ensureNode()
        .requireGlobal([
            'global-consts',
            'global-extensions',
            'global-vars'
        ]);
    /* DEVCODE-END */

    /**
     * Create a Error instance
     * 
     * @param {string} msg - Message of error
     * @return {object} Instance of Error
     */
    function createError(msg) {
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
            throw createError('Param uri is not a string');
        }

        let regex = new RegExp(REQUIRE_URI_REGEX),
            regexResult = regex.exec(uri);

        if (!regexResult) {
            throw createError('Invalid URI: "' + uri + '" for lib.require().');
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
    function parseArgOptions(args) {
        if (!Array.isArray(args)) {
            throw createError('Invalid @param type for "args". Must be an array.');
        }

        let _options = { args: [] },
            _nextParams = [],
            regexKV1 = new RegExp(PARAM_KEYVALUE_REGEX1),
            regexKV2 = new RegExp(PARAM_KEYVALUE_REGEX2),
            regexFlag = new RegExp(PARAM_FLAG_REGEX);

        args.map((value) => {
            if (value.toLowerCase() === 'args') {
                throw createError('Reserved word found. Not use "args" in arguments list!');
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

        // --workdir ~/ to --workdir $HOME/
        if (typeof _options.workdir === 'string' && ['~/', '~\\'].indexOf(_options.workdir.substr(0, 2)) >= 0) {
            _options.workdir = (
                process.env.HOME ||
                process.env.HOMEPATH ||
                process.env.HOMEDIR ||
                process.cwd()
            ) + _options.workdir.substr(1);
        }

        return _options;
    }

    /**
     * Get a user environment variable value for platform win32
     * 
     * @param {string} varName - Variable name
     * @return {string}
     */
    function getUserEnvironmentWin32(varName) {
        let exec = _childProcess.spawnSync,
            child = exec('powershell', [
                '-NoProfile',
                '-ExecutionPolicy',
                'unrestricted',
                '-Command',
                '[environment]::GetEnvironmentVariable(\'' + varName + '\',\'User\')'
            ]);

        if (child.status === 0 && child.output && child.output.length > 0) {
            return child.output[1].toString();
        }
    }

    /**
     * Get a user environment variable value for platforms ['linux', 'freebsd', 'darwin', 'sunos']
     * 
     * @param {string} varName - Variable name
     * @return {string}
     */
    function getUserEnvironmentUnix(varName) {
        return process.env[varName];
    }

    /**
     * Set a user environment variable value for platform win32
     * 
     * @param {string} varName - Variable name
     * @param {string} value - Value of variable
     * @param {Object} shellOptions
     */
    function setUserEnvironmentWin32(varName, value, shellOptions) {
        var exec = require('child_process').spawnSync,
            child = exec('powershell', [
                '-NoProfile',
                '-ExecutionPolicy',
                'unrestricted',
                '-Command',
                '[environment]::SetEnvironmentVariable(\'' + varName + '\', \'' + value + '\', \'User\')'
            ]);

        if (child.status !== 0) {
            throw createError('It was not possible to assign the environment variable "' + varName + '" to the user.');
        }
    }

    /**
     * Return all paths of available user profile files
     * 
     * @return {Object} Array os paths
     */
    function getAllUserProfilePathsAvailable() {
        let homedir = _os.homedir();

        /** @todo: Check `makeShellScriptExportEnv()` and `makeShellScriptAppendEnvPath()` to use [.bashrc, .profile, .zshrc] */
        return [
            '.bash_profile'
            //'.bashrc',
            //'.profile',
            //'.zshrc'
        ].map(file => _path.join(homedir, file));
    }

    /**
     * Set a user environment variable value for platforms ['linux', 'freebsd', 'darwin', 'sunos']
     * 
     * @param {string} varName - Variable name
     * @param {string} value - Value of variable
     * @param {Object} shellOptions
     */
    function setUserEnvironmentUnix(varName, value, shellOptions) {
        let envFilePath = _path.join(lib.devHome.tools, TOOL_EXPORT_ENV_FILE),
            lines = [],
            lineBegin = shellOptions.resolver(varName, value, true);

        (lib.fileExists(envFilePath) ? _fs.readFileSync(envFilePath, 'utf8') || '' : '')
            .split(_os.EOL)
            .map((lineValue) => {
                if ((lineValue || "").trim() !== "" && !lineValue.startsWith(lineBegin)) {
                    lines.push(lineValue);
                }
            });

        lines.push(shellOptions.resolver(varName, value));

        if (0 < lines.length) {
            _fs.writeFileSync(envFilePath, lines.join(_os.EOL), 'utf8');
        }
    }

    /**
     * Append var name to file TOOL_APPEND_PATH_FILE
     * 
     * @param {string} varName - Name of variable
     */
    function appendUserEnvironmentVarToPathUnix(varName) {
        let appendFilePath = _path.join(lib.devHome.tools, TOOL_APPEND_PATH_FILE),
            lines = [];

        (lib.fileExists(appendFilePath) ? _fs.readFileSync(appendFilePath, 'utf8') || '' : '')
            .split(_os.EOL)
            .map((lineValue) => {
                if ((lineValue || "").trim() !== "" && lineValue !== varName) {
                    lines.push(varName);
                }
            });

        lines.push(varName);

        if (0 < lines.length) {
            _fs.writeFileSync(appendFilePath, lines.join(_os.EOL), 'utf8');
        }
    }

    /**
     * Install Shell Script Profile to Unix system
     */
    function installShellScriptProfile() {
        // Write file .dev/tools/update-envvars.sh
        if (_os.platform() !== 'win32') {
            let filePath = _path.join(lib.devHome.tools, TOOL_UPDATE_ENVVARS_SH),
                scriptText = ""
                    + makeShellScriptExportEnv()
                    + makeShellScriptAppendEnvPath();

            _fs.writeFileSync(filePath, scriptText, 'utf8');
        }

        
    }

    /**
     * Make a script text to export E5R environment variables
     * 
     * @return {string} Shell script text
     */
    function makeShellScriptExportEnv() {
        let exportEnvFilePath = _path.join(lib.devHome.tools, TOOL_EXPORT_ENV_FILE),
            lines = [
                '',
                '# Export E5R environment variables',
                'if [ -f "' + exportEnvFilePath + '" ]; then',
                'while IFS=\'\' read -r line || [[ -n "${line}" ]]; do',
                '  echo "export ${line}"',
                'done < "' + exportEnvFilePath + '"',
                'fi',
                ''
            ];

        return lines.join(_os.EOL);
    }

    /**
     * Make a script text to append $E5R_PATH to system $PATH variable
     * 
     * @return {string} Shell script text
     */
    function makeShellScriptAppendEnvPath() {
        let appendEnvPathFilePath = _path.join(lib.devHome.tools, TOOL_APPEND_PATH_FILE),
            lines = [
                '',
                '# Append $E5R_PATH to $PATH variable',
                'if [ -f "' + appendEnvPathFilePath + '" ]; then',
                'while IFS=\'\' read -r line || [[ -n "${line}" ]]; do',
                '  echo "export PATH=\\$${line}:\\$PATH"',
                'done < "' + appendEnvPathFilePath + '"',
                'fi',
                ''
            ];

        return lines.join(_os.EOL);
    }

    /**
     * Append expression to update environment file
     * 
     * @param {any} varName
     * @param {any} value
     * @param {options} options
     */
    function appendUpdateEnvironmentFile(varName, value, options) {
        if (!options) {
            throw createError('Options has required.');
        }

        if (typeof options.path !== 'string') {
            throw createError('Options.path must be a string.');
        }

        if (typeof options.resolver !== 'function') {
            throw createError('Options.resolver must be a function.')
        }

        if (_os.platform() !== 'win32') {
            if (lib.fileExists(options.path)) {
                return;
            }

            let scriptText = ""
                + makeShellScriptExportEnv()
                + makeShellScriptAppendEnvPath();

            _fs.writeFileSync(options.path, scriptText, 'utf8');

            return;
        }

        // Only Windows
        let lines = [],
            lineBegin = options.resolver(varName, value, true),
            fileExists = false;

        if (lib.fileExists(options.path)) {
            (_fs.readFileSync(options.path, 'utf8') || '')
                .split(_os.EOL)
                .map((lineValue) => {
                    if (!lineValue.startsWith(lineBegin)) {
                        lines.push(lineValue);
                    }
                });
        }

        lines.push(options.resolver(varName, value));

        if (0 < lines.length) {
            _fs.writeFileSync(options.path, lines.join(_os.EOL), 'utf8');
        }
    }

    /**
     *  Load a global configuration value from TOOL_CONFIGURATION_FILE file
     *  and storage in _globalConfiguration variable. 
     */
    function getGlobalConfiguration() {
        if (_globalConfiguration) {
            return _globalConfiguration;
        }

        let filePath = _path.join(_devPaths.root, TOOL_CONFIGURATION_FILE);

        if (!lib.fileExists(filePath)) {
            _fs.writeFileSync(filePath, JSON.stringify(TOOL_DEFAULT_CONFIGURATION, null, 4), 'utf8');
        }

        _globalConfiguration = require(filePath);

        return _globalConfiguration;
    }

    /**
     * Save config on TOOL_CONFIGURATION_FILE file and
     * reset then _globalConfiguration variable.
     * 
     * @param {any} config - The configuration value object
     */
    function setGlobalConfiguration(config) {
        let filePath = _path.join(_devPaths.root, TOOL_CONFIGURATION_FILE);

        _fs.writeFileSync(filePath, JSON.stringify(config, null, 4), 'utf8');

        _globalConfiguration = undefined;
    }

    /* DEVCODE-BEGIN */
    module.exports = {
        createError: createError,
        compileRequireData: compileRequireData,
        parseArgOptions: parseArgOptions,
        getUserEnvironmentWin32: getUserEnvironmentWin32,
        getUserEnvironmentUnix: getUserEnvironmentUnix,
        setUserEnvironmentWin32: setUserEnvironmentWin32,
        getAllUserProfilePathsAvailable: getAllUserProfilePathsAvailable,
        setUserEnvironmentUnix: setUserEnvironmentUnix,
        appendUserEnvironmentVarToPathUnix: appendUserEnvironmentVarToPathUnix,
        appendUpdateEnvironmentFile: appendUpdateEnvironmentFile,
        getGlobalConfiguration: getGlobalConfiguration,
        setGlobalConfiguration: setGlobalConfiguration,
        installShellScriptProfile: installShellScriptProfile
    }

    if (!module.parent && module.filename === __filename && process.argv.indexOf('-devmode') >= 0) {
    }

})();
/* DEVCODE-END */