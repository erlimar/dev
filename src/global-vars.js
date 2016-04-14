var _path = require('path');
var _util = require('util');
var _os = require('os');
var _fs = require('fs');
var _url = require('url');
var _childProcess = require('child_process');
var _zlib = require('zlib');
var _rootPath = _path.resolve(_os.homedir(), TOOL_DEVFOLDER);
var _devPaths = {
    root: _rootPath,
    tools: _path.join(_rootPath, 'tools'),
    bin: _path.join(_rootPath, 'bin'),
    lib: _path.join(_rootPath, 'lib'),
    cmd: _path.join(_rootPath, 'lib', 'cmd'),
    doc: _path.join(_rootPath, 'doc')
};
