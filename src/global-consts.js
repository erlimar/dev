/* DEVCODE-BEGIN */
(async () => {
    "use strict";
    /* DEVCODE-END */

    /** @constant {string} */
    const TOOL_NAME = 'dev';

    /** @constant {string} */
    const TOOL_TITLE = 'E5R Tools for Development Team';

    /** @constant {string} */
    const TOOL_VERSION = '0.14.0';

    /** @constant {string} */
    const TOOL_COPYRIGHT = '(c) E5R Development Team. All rights reserved.';

    /** @constant {string} */
    const TOOL_DEVFOLDER = '.' + TOOL_NAME;

    const TOOL_DEVE5R_LIB_URL = 'https://raw.githubusercontent.com/e5r/dev/develop/dist/e5r-dev.js';

    /** @constant {string} */
    const TOOL_DEFAULT_REGISTRY_URL = 'https://raw.githubusercontent.com/e5r/dev/develop/dist/devcom/';

    /** @constant {string} */
    const TOOL_REGISTRY_FILE = 'registry.json';

    /** @constant {string} */
    const TOOL_CONFIGURATION_FILE = 'config.json';

    /** @constant {string} */
    const TOOL_APPEND_PATH_FILE = 'append_path.txt';

    /** @constant {string} */
    const TOOL_EXPORT_ENV_FILE = 'export_env.txt';

    /** @constant {object} */
    const TOOL_DEFAULT_CONFIGURATION = {};

    /** @constant {string} */
    const REQUIRE_URI_REGEX = '^(cmd|lib|doc)://(([a-z0-9]|\-|_|/)+)$';

    /** @constant {string} */
    const PARAM_KEYVALUE_REGEX1 = '^[-]{2}([a-zA-Z0-9-_]+)[=]{1}([^=]+)$';

    /** @constant {string} */
    const PARAM_KEYVALUE_REGEX2 = '^[-]{2}([a-zA-Z0-9-_]+)$';

    /** @constant {string} */
    const PARAM_FLAG_REGEX = '^[-]{1}([a-zA-Z0-9-_]+)$';

    /** @constant {number} */
    const CACHE_MAX_FILE = 20;

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

    /** @constant {string} */
    const WIN_REG_QUERY_REGEX = '^(.+)(REG_SZ|REG_MULTI_SZ|REG_EXPAND_SZ|REG_DWORD|REG_QWORD|REG_BINARY|REG_NONE)\\s*(.+)$';

    /** @constant {string} */
    const TOOL_ENVVARS_CMD = TOOL_NAME + '-envvars.cmd';

    /** @constant {string} */
    const TOOL_ENVVARS_PS1 = TOOL_NAME + '-envvars.ps1';

    /** @constant {string} */
    const TOOL_ENVVARS_SH = TOOL_NAME + '-envvars.sh';

    /* DEVCODE-BEGIN */
    module.exports = {
        TOOL_NAME: TOOL_NAME,
        TOOL_TITLE: TOOL_TITLE,
        TOOL_VERSION: TOOL_VERSION,
        TOOL_COPYRIGHT: TOOL_COPYRIGHT,
        TOOL_DEVFOLDER: TOOL_DEVFOLDER,
        TOOL_DEVE5R_LIB_URL: TOOL_DEVE5R_LIB_URL,
        TOOL_DEFAULT_REGISTRY_URL: TOOL_DEFAULT_REGISTRY_URL,
        TOOL_REGISTRY_FILE: TOOL_REGISTRY_FILE,
        TOOL_CONFIGURATION_FILE: TOOL_CONFIGURATION_FILE,
        TOOL_APPEND_PATH_FILE:TOOL_APPEND_PATH_FILE,
        TOOL_EXPORT_ENV_FILE:TOOL_EXPORT_ENV_FILE,
        TOOL_DEFAULT_CONFIGURATION: TOOL_DEFAULT_CONFIGURATION,
        REQUIRE_URI_REGEX: REQUIRE_URI_REGEX,
        PARAM_KEYVALUE_REGEX1: PARAM_KEYVALUE_REGEX1,
        PARAM_KEYVALUE_REGEX2: PARAM_KEYVALUE_REGEX2,
        PARAM_FLAG_REGEX: PARAM_FLAG_REGEX,
        CACHE_MAX_FILE: CACHE_MAX_FILE,
        TOOL_REGISTRY_LOCKFILE: TOOL_REGISTRY_LOCKFILE,
        MAGIC_REGISTRY_LOCKNAME: MAGIC_REGISTRY_LOCKNAME,
        TOOL_REGISTRY_LOCAL_LOCKFILE: TOOL_REGISTRY_LOCAL_LOCKFILE,
        DEBUG_IDENTIFY: DEBUG_IDENTIFY,
        ERROR_CODE_DEVCOM_NOTINFORMED: ERROR_CODE_DEVCOM_NOTINFORMED,
        WIN_REG_QUERY_REGEX: WIN_REG_QUERY_REGEX,
        TOOL_ENVVARS_CMD: TOOL_ENVVARS_CMD,
        TOOL_ENVVARS_PS1: TOOL_ENVVARS_PS1,
        TOOL_ENVVARS_SH: TOOL_ENVVARS_SH
    }

    if (!module.parent && module.filename === __filename && process.argv.indexOf('-devmode') >= 0) {
    }

})();
/* DEVCODE-END */