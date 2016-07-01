/** @constant {string} */
const TOOL_TITLE = 'E5R Tools for Development Team';

/** @constant {string} */
const TOOL_VERSION = '0.10.0';

/** @constant {string} */
const TOOL_COPYRIGHT = '(c) E5R Development Team. All rights reserved.';

/** @constant {string} */
const TOOL_DEVFOLDER = '.dev';

/** @constant {string} */
const TOOL_DEFAULT_REGISTRY_URL = 'https://raw.githubusercontent.com/e5r/devcom/develop/dist/';

/** @constant {string} */
const TOOL_REGISTRY_FILE = 'registry.json';

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
const TOOL_ENVVARS_CMD = 'dev-envvars.cmd';

/** @constant {string} */
const TOOL_ENVVARS_PS1 = 'dev-envvars.ps1';

/** @constant {string} */
const TOOL_ENVVARS_SH = 'dev-envvars.sh';
