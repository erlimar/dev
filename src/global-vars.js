/* DEVCODE-BEGIN */
(async () => {
    "use strict";

    var devUtil = require('../scripts/devutils');

    devUtil
        .ensureNode()
        .requireGlobal([
            'global-consts',
        ]);
    /* DEVCODE-END */

    var _assert = require('assert');
    var _path = require('path');
    var _util = require('util');
    var _os = require('os');
    var _fs = require('fs');
    var _url = require('url');
    var _childProcess = require('child_process');
    var _zlib = require('zlib');
    var _crypto = require('crypto');
    var _readline = require('readline');
    var _rootPath = _path.resolve(_os.homedir(), TOOL_DEVFOLDER);
    var _devPaths = {
        root: _rootPath,
        tools: _path.join(_rootPath, 'tools'),
        bin: _path.join(_rootPath, 'bin'),
        lib: _path.join(_rootPath, 'lib'),
        cmd: _path.join(_rootPath, 'lib', 'cmd'),
        doc: _path.join(_rootPath, 'doc')
    };
    var _globalConfiguration;

    /* DEVCODE-BEGIN */
    // Reconfigure to use local source code devcom
    _rootPath = _path.join(_path.parse(module.filename).dir, 'devcom');
    _devPaths = {
        root: _rootPath,
        tools: _path.join(_rootPath, 'tools'),
        bin: _path.join(_rootPath, 'bin'),
        lib: _path.join(_rootPath, 'lib'),
        cmd: _path.join(_rootPath, 'lib', 'cmd'),
        doc: _path.join(_rootPath, 'doc')
    };

    module.exports = {
        _assert: _assert,
        _path: _path,
        _util: _util,
        _os: _os,
        _fs: _fs,
        _url: _url,
        _childProcess: _childProcess,
        _zlib: _zlib,
        _crypto: _crypto,
        _rootPath: _rootPath,
        _devPaths: _devPaths,
        _globalConfiguration: _globalConfiguration
    }

    if (!module.parent && module.filename === __filename && process.argv.indexOf('-devmode') >= 0) {
    }

})();
/* DEVCODE-END */