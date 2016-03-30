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
        value,
        /** @todo: Move HKEY to constant */
        child = exec('reg', ['query', 'HKEY_CURRENT_USER\\Environment', '/v', varName]);

    if (child.status === 0) {
        let output = child.output[1].toString().split(_os.EOL),
            regex = new RegExp(WIN_REG_QUERY_REGEX);

        for (let l in output) {
            let line = output[l].trim(),
                result = regex.exec(line);

            if (result) {
                value = result[3];
                break;
            }
        }
    }

    return value;
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
        child = exec('setx', [varName, value]);

    if (child.status !== 0) {
        throw createError('It was not possible to assign the environment variable "' + varName + '" to the user.');
    }
}

/**
 * Return a path list of user profile files
 * 
 * @return {Object} Array os paths
 */
function getUserProfilePaths() {
    let profiles = [],
        bash_profile = _path.join(_os.homedir(), '.bash_profile'),
        bashrc = _path.join(_os.homedir(), '.bashrc'),
        profile = _path.join(_os.homedir(), 'profile'),
        zshrc = _path.join(_os.homedir(), 'zshrc');

    if (lib.fileExists(bash_profile)) profiles.push(bash_profile);
    if (lib.fileExists(bashrc)) profiles.push(bashrc);
    if (lib.fileExists(profile)) profiles.push(profile);
    if (lib.fileExists(zshrc)) profiles.push(zshrc);

    return profiles;
}

/**
 * Set a user environment variable value for platforms ['linux', 'freebsd', 'darwin', 'sunos']
 * 
 * @param {string} varName - Variable name
 * @param {string} value - Value of variable
 * @param {Object} shellOptions
 */
function setUserEnvironmentUnix(varName, value, shellOptions) {
    getUserProfilePaths().map((path) => {
        lib.printf('LOG: setUserEnvironmentUnix, #PROFILE: ' + path);
        lib.printf('      ' + JSON.stringify(shellOptions, null, 4));

        let lines = [],
            lineBegin = shellOptions.resolver(varName, value, true);

        (_fs.readFileSync(path, 'utf8') || '')
            .split(_os.EOL)
            .map((lineValue) => {
                if (!lineValue.startsWith(lineBegin)) {
                    lines.push(lineValue);
                }
            });

        lines.push(shellOptions.resolver(varName, value));

        if (0 < lines.length) {
            _fs.writeFileSync(path, lines.join(_os.EOL), 'utf8');
        }
    });
}

/**
 * Extract a zip file for platform win32
 * 
 * @param {string} origin
 * @param {string} destination
 */
function extractFileWin32(origin, destination) {
    let exec = _childProcess.spawnSync,
        command = "& {$s=new-object -com shell.application;foreach($i in $s.namespace('" + origin + "').items()){$s.namespace('" + destination + "').copyhere($i, 16)}}";

    let child = exec('powershell', [
        '-nologo',
        '-noprofile',
        '-command',
        command
    ]);

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
            + 'Extract file failed.' + _os.EOL
            + '  From: ' + zipFile + _os.EOL
            + '  To: ' + directory + _os.EOL
            + '  PID: ' + child.pid + _os.EOL
            + '  Command: ' + child.args.join(' ') + _os.EOL
            + '  Exit Code: ' + child.status
            );
    }
}

/**
 * Extract a zip file for platforms ['linux', 'freebsd', 'darwin', 'sunos']
 * 
 * @param {string} origin
 * @param {string} destination
 */
function extractFileUnix(origin, destination) {
    /** @todo: Not implemented! */
    throw createError('@TODO: extractFileUnix() not implemented!');
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

    let lines = [],
        lineBegin = options.resolver(varName, value, true);

        /** @todo: Change to _fs.statSync(path) */
    if (_fs.existsSync(options.path)) {
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
