/*!
 * e5r-dev v0.4.0
 * E5R Tools for Development Team (https://github.com/e5r/dev#readme)
 * Copyright (c) E5R Development Team. All rights reserved.
 * Licensed under the Apache-2.0 License. More license information in LICENSE.txt.
 */

"use strict";
// ========================================================================
// e5r-dev/global-consts.js
// ========================================================================
/** @constant {string} */
const TOOL_TITLE = 'E5R Tools for Development Team';

/** @constant {string} */
const TOOL_VERSION = '0.4.1';

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
const CACHE_MAX_FILE = 2;

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

// ========================================================================
// e5r-dev/global-extensions.js
// ========================================================================
/**
 * Read a BYTE (8bits) from buffer
 * 
 * @param {number} position
 * 
 * @return {number} 
 */
Buffer.prototype.readZipByte = function(position) {
    /** @todo: Privatize */
    if (!(this instanceof Buffer)) {
        throw new Error('This must be a Buffer instance');
    }
    return this.slice(position, position + 1).readUIntLE(0, 1);
}

/**
 * Read a WORD (16bits) from buffer
 * 
 * @param {number} position
 * 
 * @return {number} 
 */
Buffer.prototype.readZipWord = function(position) {
    /** @todo: Privatize */
    if (!(this instanceof Buffer)) {
        throw new Error('This must be a Buffer instance');
    }
    return this.slice(position, position + 2).readUIntLE(0, 2);
}

/**
 * Read a DWORD (32bits) from buffer
 * 
 * @param {number} position
 * 
 * @return {number} 
 */
Buffer.prototype.readZipDWord = function(position) {
    /** @todo: Privatize */
    if (!(this instanceof Buffer)) {
        throw new Error('This must be a Buffer instance');
    }
    return this.slice(position, position + 4).readUIntLE(0, 4);
}

// ========================================================================
// e5r-dev/zipextractor.js
// ========================================================================
/**
 * Record structure for a directory
 * 
 * @param {string} name
 * @param {Object} meta 
 */
function ZipDirectoryEntry(name, meta) {
    /** @todo: Privatize */
    if (!(this instanceof ZipDirectoryEntry)) {
        return new ZipDirectoryEntry(name, meta);
    }

    this.name = name;
    this.meta = meta;
    this.files = [];
    this.childs = [];
}

/**
 * Record structure for a file
 * 
 * @param {string} name
 * @param {Object} meta
 */
function ZipFileEntry(name, meta) {
    /** @todo: Privatize */
    if (!(this instanceof ZipFileEntry)) {
        return new ZipFileEntry(name, meta);
    }

    this.name = name;
    this.meta = meta;
}

/**
 * Zip file end of central directory record
 * @constructor
 * 
 * @param {Object} buffer Buffer instance
 */
function ZipEndOfCentralDirectory(buffer) {
    /** @todo: Privatize */
    if (!(this instanceof ZipEndOfCentralDirectory)) {
        return new ZipEndOfCentralDirectory(buffer);
    }

    if (!(buffer instanceof Buffer)) {
        throw new Error('Param @buffer must be a Buffer instance');
    }

    if (buffer.length != ZipEndOfCentralDirectory.RECORD_SIZE) {
        throw new Error('Invalid buffer size');
    }

    // end of central dir signature    4 bytes  (0x06054b50)
    this._signature = buffer.readZipDWord(0);

    // number of this disk             2 bytes
    this._diskNumber = buffer.readZipWord(4);

    // number of the disk with the
    // start of the central directory  2 bytes
    this._distStartNumber = buffer.readZipWord(6);

    // total number of entries in
    // the central dir on this disk    2 bytes
    this._totalEntries = buffer.readZipWord(8);

    // total number of entries in
    // the central dir                 2 bytes
    this._totalAllEntries = buffer.readZipWord(10);

    // size of the central directory   4 bytes
    this._size = buffer.readZipDWord(12);

    // offset of start of central
    // directory with respect to
    // the starting disk number        4 bytes
    this._offset = buffer.readZipDWord(16);

    // zipfile comment length          2 bytes
    this._commentLength = buffer.readZipWord(20);

    if (this._signature !== ZipEndOfCentralDirectory.MAGIC_SIGNATURE) {
        throw new Error('End of central directory signature error');
    }
}

/** @constant {number} */
/** @todo: Privatize */
ZipEndOfCentralDirectory.MAGIC_SIGNATURE = 0x06054b50;

/** @constant {number} */
/** @todo: Privatize */
ZipEndOfCentralDirectory.RECORD_SIZE = 22;

/**
 * Zip file header on central directory structure.
 * @constructor
 * 
 * @param {Object} buffer Buffer instance
 */
function ZipCentralDirectoryFileHeader(buffer) {
    /** @todo: Privatize */
    if (!(this instanceof ZipCentralDirectoryFileHeader)) {
        return new ZipCentralDirectoryFileHeader(buffer);
    }

    if (!(buffer instanceof Buffer)) {
        throw new Error('Param @buffer must be a Buffer instance');
    }

    if (buffer.length != ZipCentralDirectoryFileHeader.RECORD_SIZE) {
        throw new Error('Invalid buffer size');
    }

    // central file header signature   4 bytes  (0x02014b50)
    this._signature = buffer.readZipDWord(0);

    // version made by                 2 bytes
    this._versionMadeBy = buffer.readZipWord(4);

    // version needed to extract       2 bytes
    this._versionNeeded = buffer.readZipWord(6);

    // general purpose bit flag        2 bytes
    this._generalFlag = buffer.readZipWord(8);

    // compression method              2 bytes
    this._compressionMethod = buffer.readZipWord(10);

    // last mod file time              2 bytes
    this._lastModifyTime = buffer.readZipWord(12);

    // last mod file date              2 bytes
    this._lastModifyDate = buffer.readZipWord(14);

    // crc-32                          4 bytes
    this._crc32 = buffer.readZipDWord(16);

    // compressed size                 4 bytes
    this._compressedSize = buffer.readZipDWord(20);

    // uncompressed size               4 bytes
    this._uncompressedSize = buffer.readZipDWord(24);

    // filename length                 2 bytes
    this._fileNameLength = buffer.readZipWord(28);

    // extra field length              2 bytes
    this._extraFieldLength = buffer.readZipWord(30);

    // file comment length             2 bytes
    this._commentLength = buffer.readZipWord(32);

    // disk number start               2 bytes
    this._distNumber = buffer.readZipWord(34);

    // internal file attributes        2 bytes
    this._internalAttributes = buffer.readZipWord(36);

    // external file attributes        4 bytes
    this._externalAttributes = buffer.readZipDWord(38);

    // relative offset of local header 4 bytes
    this._relativeOffset = buffer.readZipDWord(42);

    if (this._signature !== ZipCentralDirectoryFileHeader.MAGIC_SIGNATURE) {
        throw new Error('File header on central directory signature error');
    }
}

/** @constant {number} */
/** @todo: Privatize */
ZipCentralDirectoryFileHeader.MAGIC_SIGNATURE = 0x02014b50;

/** @constant {number} */
/** @todo: Privatize */
ZipCentralDirectoryFileHeader.RECORD_SIZE = 46;

/**
 * Zip local file header structure + file data structure.
 * @constructor
 * 
 * @param {Object} buffer Buffer instance
 */
function ZipLocalFile(buffer) {
    /** @todo: Privatize */
    if (!(this instanceof ZipLocalFile)) {
        return new ZipLocalFile(buffer);
    }

    if (!(buffer instanceof Buffer)) {
        throw new Error('Param @buffer must be a Buffer instance');
    }

    if (buffer.length != ZipLocalFile.RECORD_SIZE) {
        throw new Error('Invalid buffer size');
    }

    // local file header signature     4 bytes  (0x04034b50)
    this._signature = buffer.readZipDWord(0);

    // version needed to extract       2 bytes
    this._versionNeeded = buffer.readZipWord(4);

    // general purpose bit flag        2 bytes
    this._generalFlag = buffer.readZipWord(6);

    // compression method              2 bytes
    this._compressionMethod = buffer.readZipWord(8);

    // last mod file time              2 bytes
    this._lastModifyTime = buffer.readZipWord(10);

    // last mod file date              2 bytes
    this._lastModifyDate = buffer.readZipWord(12);

    // crc-32                          4 bytes
    this._crc32 = buffer.readZipDWord(14);

    // compressed size                 4 bytes
    this._compressedSize = buffer.readZipDWord(18);

    // uncompressed size               4 bytes
    this._uncompressedSize = buffer.readZipDWord(22);

    // filename length                 2 bytes
    this._fileNameLength = buffer.readZipWord(26);

    // extra field length              2 bytes
    this._extraFieldLength = buffer.readZipWord(28);

    if (this._signature !== ZipLocalFile.MAGIC_SIGNATURE) {
        throw new Error('Local file header signature error');
    }
}

/** @constant {number} */
/** @todo: Privatize */
ZipLocalFile.MAGIC_SIGNATURE = 0x04034b50;

/** @constant {number} */
/** @todo: Privatize */
ZipLocalFile.RECORD_SIZE = 30;

/** @constant {number} */
/** @todo: Privatize */
ZipLocalFile.DATA_DESCRIPTOR_FLAG = 0x04;

ZipLocalFile.prototype.checkIntegrity = function(meta) {
    /** @note: Only for compression method 8 - The file is Deflated 
     *  0 - The file is stored (no compression)
	 *  1 - The file is Shrunk
	 *  2 - The file is Reduced with compression factor 1
	 *  3 - The file is Reduced with compression factor 2
	 *  4 - The file is Reduced with compression factor 3
	 *  5 - The file is Reduced with compression factor 4
	 *  6 - The file is Imploded
	 *  7 - Reserved for Tokenizing compression algorithm
	 *  8 - The file is Deflated
     */

    if (this._compressionMethod !== 8 && this._compressionMethod !== 0) {
        throw new Error('Only Deflated compression method is available')
    }
}

/**
 * Zip local data descriptor structure.
 * @constructor
 * 
 * @param {Object} buffer Buffer instance
 */
function ZipLocalDataDescriptor(buffer) {
    /** @todo: Privatize */
    if (!(this instanceof ZipLocalDataDescriptor)) {
        return new ZipLocalDataDescriptor(buffer);
    }

    if (!(buffer instanceof Buffer)) {
        throw new Error('Param @buffer must be a Buffer instance');
    }

    if (buffer.length != ZipLocalDataDescriptor.RECORD_SIZE) {
        throw new Error('Invalid buffer size');
    }

    // crc-32                          4 bytes
    this._crc32 = buffer.readZipDWord(0);

    // compressed size                 4 bytes
    this._compressedSize = buffer.readZipDWord(4);

    // uncompressed size               4 bytes
    this._uncompressedSize = buffer.readZipDWord(8);
}

/** @constant {number} */
/** @todo: Privatize */
ZipLocalDataDescriptor.RECORD_SIZE = 12;

/**
 * Extract a zip file
 * 
 * @note: http://www.fileformat.info/info/mimetype/application/zip/index.htm
 * 
 * @constructor
 * 
 * @param {string} filePath
 */
function ZipExtractor(filePath) {
    var stat;

    try {
        stat = _fs.statSync(filePath);
    } catch (_) {
        throw new Error('Invalid file "' + filePath + '"');
    }

    if (!(this instanceof ZipExtractor)) {
        return new ZipExtractor(filePath);
    }

    this._handle = _fs.openSync(filePath, 'r');
    this._size = stat.size;
    this._files = [];
    this._rootDirectory = new ZipDirectoryEntry('.', null);

    this.readEndOfCentralDirectory();
    this.readCentralDirectoryFiles();
}

ZipExtractor.prototype.ensureDirectoryEntry = function(parts) {
    /*
    Entry = {
        "name": ".",
        "meta": Object,
        "files": [
            {
                "name": String,
                "meta": Object
            }
        ],
        "childs": [Entry..]
    }
    */
    var entry = this._rootDirectory;

    for (var p in parts) {
        var part = parts[p],
            child,
            index = -1;

        for (var c in entry.childs) {
            if (entry.childs[c].name === part) {
                index = c;
                break;
            }
        }

        if (0 > index) {
            child = new ZipDirectoryEntry(part, null);
            index = entry.childs.push(child) - 1;
        }

        entry = entry.childs[index];
    }

    return entry;
}

/**
 * Map a file to directory path
 * 
 * @param {Object} meta ZipCentralDirectoryFileHeader instance
 */
ZipExtractor.prototype.mapFile = function(meta) {
    /** @todo: Privatize */
    var isDir = meta._fileName.lastIndexOf('/') === meta._fileName.length - 1,
        dirParts = meta._fileName.split('/'),
        fileName = dirParts[dirParts.length - 1];

    dirParts = dirParts.slice(0, dirParts.length - 1);

    var directoryEntry = this.ensureDirectoryEntry(dirParts);

    if (isDir) {
        directoryEntry.meta = meta;
    } else {
        directoryEntry.files.push(new ZipFileEntry(fileName, meta));
    }
}

/**
 * Read a file content block
 * 
 * @param {number} length
 * @param {number} position
 * 
 * @return {Object} Content Buffer 
 */
ZipExtractor.prototype.read = function(length, position) {
    /** @todo: Privatize */
    if (!Number.isInteger(length) || length < 1) {
        throw new Error('Param @length must be a positive number');
    }

    if (!Number.isInteger(position) || position < 0) {
        throw new Error('Param @position must be a integer number');
    }

    var buffer = new Buffer(length),
        offset = 0,
        read = 0;

    while (read < length) {
        read += _fs.readSync(this._handle, buffer, offset, length - read, position + read);
        offset = read - 1;
        if (offset < 0) offset = 0;
    }

    return buffer;
}

/**
 * End of central dir record from zip file 
 */
ZipExtractor.prototype.readEndOfCentralDirectory = function() {
    /** @todo: Privatize */
    var eocd_pos = this._size - 4;

    while (eocd_pos > 0) {
        var magic = this.read(4, eocd_pos).readZipDWord(0);
        if (magic == ZipEndOfCentralDirectory.MAGIC_SIGNATURE) break;
        --eocd_pos;
    }

    if (eocd_pos === 0) {
        throw new Error('Invalid ZIP file. End of central directory record not found.');
    }

    var buffer = this.read(ZipEndOfCentralDirectory.RECORD_SIZE, eocd_pos);
    var eocd = new ZipEndOfCentralDirectory(buffer);

    if (eocd._commentLength > 0) {
        var buffer_comment = this.read(eocd._commentLength, eocd_pos + ZipEndOfCentralDirectory.RECORD_SIZE);
        eocd._comment = buffer_comment.toString();
    } else {
        eocd._comment = '';
    }

    /** @todo: Implement support multiple disks (files) */
    if (eocd._diskNumber !== eocd._distStartNumber ||
        eocd._diskNumber !== 0 ||
        eocd._totalEntries !== eocd._totalAllEntries) {
        throw new Error('TODO: Support multiple disks (files) not implemented.');
    }

    if (eocd_pos !== eocd._offset + eocd._size) {
        throw new Error('ZIP file corrupted. End of central directory record not found.');
    }

    this._eocd = eocd;
}

/**
 * Read a file header list from central directory structure of ZIP file
 */
ZipExtractor.prototype.readCentralDirectoryFiles = function() {
    /** @todo: Privatize */
    if (!(this._eocd instanceof ZipEndOfCentralDirectory)) {
        throw new Error('Invalid EOCD instance.');
    }

    var pos = this._eocd._offset;

    while (this._files.length < this._eocd._totalEntries) {
        var buffer = this.read(ZipCentralDirectoryFileHeader.RECORD_SIZE, pos);
        var file = new ZipCentralDirectoryFileHeader(buffer);
        pos += ZipCentralDirectoryFileHeader.RECORD_SIZE;

        // filename
        if (file._fileNameLength > 0) {
            file._fileName = this.read(file._fileNameLength, pos).toString();
            pos += file._fileNameLength;
        } else {
            file._fileName = '';
        }

        // extra fiel
        if (file._extraFieldLength > 0) {
            file._extraField = this.read(file._extraFieldLength, pos);
            pos += file._extraFieldLength;
        } else {
            file._extraField = null;
        }

        // file comment
        if (file._commentLength > 0) {
            file._comment = this.read(file._commentLength, pos).toString();
            pos += file._commentLength;
        } else {
            file._comment = '';
        }

        var index = this._files.push(file) - 1;
        this.mapFile(this._files[index]);
    }
}

/**
 * Make a directory path
 * 
 * @param {string} path
 */
ZipExtractor.prototype.makeDirectory = function(path) {
    /** @todo: Privatize */
    var stat;
    try {
        stat = _fs.statSync(path);
        if (stat.isDirectory()) return;
        throw new Error('Path "' + path + '" already exists and not a directory.');
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        try {
            _fs.mkdirSync(path);
        } catch (error_into) {
            if (error_into.code !== 'ENOENT') throw error_into;
            var dirname = _path.dirname(path);
            if (dirname === path) {
                throw new Error('Undefined error for path "' + path + '".');
            }
            this.makeDirectory(dirname);
            _fs.mkdirSync(path);
        }
    }
}

/**
 * Return a path string of directory without slash trailing
 * 
 * @param {string} path
 * @param {string} sep - Optional. Default _path.sep.
 * 
 * @return {string}
 */
ZipExtractor.prototype.pathWithoutSlashTrailing = function(path, sep) {
    var withoutTrailing = path.substr(path.length - 1, 1) === (sep || _path.sep)
        ? path.substr(0, path.length - 1)
        : path;

    return withoutTrailing;
}

/**
 * Get a entry on directory structure from path
 * 
 * @param {string} path
 * 
 * @return {Object}
 */
ZipExtractor.prototype.getEntryFromPath = function(path) {
    path = path.replace(_path.sep, '/');

    var entry = this._rootDirectory,
        parts = path.split('/');

    for (var pidx = 0; pidx < parts.length; pidx++) {
        var part = parts[pidx].trim(),
            found = false;

        if (part === '') break;
        if (pidx == 0 && (part === '.' || part === './')) continue;

        for (var c in entry.childs) {
            var child = entry.childs[c];
            if (child.name === part) {
                found = true;
                entry = child;
                break;
            }
        }

        if (!found && pidx === parts.length - 1) {
            for (var f in entry.files) {
                var file = entry.files[f];
                if (file.name === part) {
                    found = true;
                    entry = file;
                    break;
                }
            }
        }

        if (!found) return null;
    }

    return entry;
}

ZipExtractor.prototype.ensureDestinationDirectory = function(destination) {
    /** @todo: Privatize */
    try {
        var stat = _fs.statSync(destination);

        if (!stat.isDirectory()) {
            throw new Error('Destination path ' + destination + '" already exists and not a directory.');
        }
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        this.makeDirectory(destination);
    }
}

ZipExtractor.prototype.extractDirectory = function(entry, destination) {
    /** @todo: Privatize */
    if (!(entry instanceof ZipDirectoryEntry)) {
        throw new Error('Param @entry must be a ZipDirectoryEntry instance');
    }

    this.ensureDestinationDirectory(destination);

    // Files
    for (var f in entry.files) {
        var file = entry.files[f];
        this.extractFile(file, destination);
    }

    // Child directories
    for (var c in entry.childs) {
        var child = entry.childs[c];
        var child_destination = _path.join(destination, child.name);
        this.extractDirectory(child, child_destination);
    }

    // TODO: Apply directory date, time and attributes
}

ZipExtractor.prototype.extractFile = function(entry, destination) {
    /** @todo: Privatize */
    if (!(entry instanceof ZipFileEntry)) {
        throw new Error('Param @entry must be a ZipFileEntry instance');
    }

    this.ensureDestinationDirectory(destination);

    var filePath = _path.resolve(_path.join(destination, entry.name)),
        offset = entry.meta._relativeOffset,
        fileBuffer = this.read(ZipLocalFile.RECORD_SIZE, offset),
        file = new ZipLocalFile(fileBuffer);

    offset += ZipLocalFile.RECORD_SIZE;

    // filename
    if (file._fileNameLength > 0) {
        file._fileName = this.read(file._fileNameLength, offset).toString();
        offset += file._fileNameLength;
    } else {
        file._fileName = '';
    }

    // extra field
    if (file._extraFieldLength > 0) {
        file._extraField = this.read(file._extraFieldLength, offset);
        offset += file._extraFieldLength;
    } else {
        file._extraField = null;
    }

    // file data
    /**
     * @note: Using entry.meta._compressedSize x file._compressedSize because general flag big
     * */
    if (entry.meta._compressedSize > 0) {
        file._fileData = this.read(entry.meta._compressedSize, offset);
        offset += entry.meta._compressedSize;
    }

    // Data descriptor
    if (file._generalFlag & ZipLocalFile.DATA_DESCRIPTOR_FLAG === ZipLocalFile.DATA_DESCRIPTOR_FLAG) {
        var dataDescriptorBuffer = this.read(ZipLocalDataDescriptor.RECORD_SIZE, offset),
            dataDescriptor = new ZipLocalDataDescriptor(dataDescriptorBuffer);

        file._crc32 = dataDescriptor._crc32;
        file._compressedSize = dataDescriptor._compressedSize;
        file._uncompressedSize = dataDescriptor._uncompressedSize;
    }

    file.checkIntegrity(entry.meta);

    if (file._compressionMethod === 0) {
        _fs.writeFileSync(filePath, file._fileData);
    } else {
        _fs.writeFileSync(filePath, _zlib.inflateRawSync(file._fileData));
    }

    // TODO: Apply file date, time and attributes
}

/**
 * Extract a path to a destination
 * 
 * @param {string} path
 * @param {string} destination
 */
ZipExtractor.prototype.extractTo = function(path, destination) {
    /** @todo: Privatize */
    if (typeof (path) !== 'string') throw new TypeError('Param @path must be a string');
    if (typeof (destination) !== 'string') throw new TypeError('Param @destination must be a string');

    if (1 > path.trim().length) throw new Error('Parameter @path can not be empty');
    if (1 > destination.trim().length) throw new Error('Parameter @destination can not be empty');

    var entry = this.getEntryFromPath(path);

    if (!entry) throw new Error('Path "' + path + '" not found on ZIP file');

    if (entry instanceof ZipDirectoryEntry) {
        this.extractDirectory(entry, destination);
        return;
    }

    if (entry instanceof ZipFileEntry) {
        this.extractFile(entry, destination);
        return;
    }

    throw new Error('ZIP file entry corrupted from path "' + path + '"');
}

// ========================================================================
// e5r-dev/global-vars.js
// ========================================================================
var _path = require('path');
var _util = require('util');
var _os = require('os');
var _fs = require('fs');
var _url = require('url');
var _childProcess = require('child_process');
var _zlib = require('zlib');
var _crypto = require('crypto');
var _rootPath = _path.resolve(_os.homedir(), TOOL_DEVFOLDER);
var _devPaths = {
    root: _rootPath,
    tools: _path.join(_rootPath, 'tools'),
    bin: _path.join(_rootPath, 'bin'),
    lib: _path.join(_rootPath, 'lib'),
    cmd: _path.join(_rootPath, 'lib', 'cmd'),
    doc: _path.join(_rootPath, 'doc')
};

// ========================================================================
// e5r-dev/global-functions.js
// ========================================================================
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
 * Return a path list of user profile files
 * 
 * @return {Object} Array os paths
 */
function getUserProfilePaths() {
    let profiles = [],
        bash_profile = _path.join(_os.homedir(), '.bash_profile'),
        bashrc = _path.join(_os.homedir(), '.bashrc'),
        profile = _path.join(_os.homedir(), '.profile'),
        zshrc = _path.join(_os.homedir(), '.zshrc');

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

// ========================================================================
// e5r-dev/devcom.js
// ========================================================================
/**
 * Base type for DevCom's
 */
class DevCom {
    /**
     * Run the builtin command
     * 
     * @param {object} devTool - Instance of DevToolCommandLine
     * @param {object} options - Options for arguments of command
     */
    run(devTool, options) {
        throw createError('DevCom run() not implemented.');
    }
}

// ========================================================================
// e5r-dev/logger.js
// ========================================================================
/**
 * Logger dispatcher
 * @class
 * 
 * @property {object} verbose
 * @property {object} debug
 * @property {object} warning
 * @property {object} error
 */
class Logger {
    
    /**
     * Print verbose messages
     */
    get verbose() {
        return console.info;
    }
    
    /**
     * Print messages if environment variable NODE_DEBUG=E5RDEV
     */
    get debug() {
        if (!this._debug) {
            this._debug = _util.debuglog(DEBUG_IDENTIFY);
        }
        return this._debug;
    }
    /**
     * Print warning messages
     */
    get warning() {
        return console.warn;
    }
    
    /**
     * Print error messages
     */
    get error() {
        return console.error;
    }
}

// ========================================================================
// e5r-dev/devtoollib.js
// ========================================================================
/** @instance */
var lib =

    /**
     * Library for E5R Tools for Development Team.
     * @class
     * 
     * @property {object} logger
     * @property {object} devHome
     * @property {string} devHome.root
     * @property {string} devHome.tools
     * @property {string} devHome.bin
     * @property {string} devHome.lib
     * @property {string} devHome.cmd
     * @property {string} devHome.doc
     */
    new class DevToolLib {

        /** @constructor */
        constructor() {
            this._logger = new Logger();

            // Enable cache 
            this.__require_cache__ = [];
            this.__registry_cache__ = null;

            // Getter and Setter for platform tools
            if (_os.platform() === 'win32') {
                this.__getUserEnvironment = getUserEnvironmentWin32;
                this.__setUserEnvironment = setUserEnvironmentWin32;
            } else {
                this.__getUserEnvironment = getUserEnvironmentUnix;
                this.__setUserEnvironment = setUserEnvironmentUnix;
            }
        }

        /**
         * Computer architecture
         */
        get arch() {
            if (!this._arch) {
                this._arch = _os.arch();
                if (this._arch !== 'x64') this._arch = 'x86';
            }
            return this._arch;
        }

        /**
         * Tool folder map
         */
        get devHome() {
            return _devPaths;
        }

        /**
         * Print formated messages on console
         */
        get printf() {
            return console.log;
        }

        /**
         * Logger message
         */
        get logger() {
            return this._logger;
        }

        /**
         * DevCom base class
         * 
         * @return {DevCom}
         */
        get DevCom() {
            return DevCom;
        }

        /**
         * Smart substitute for `mkdir()' native function
         * 
         * @param {string} path
         */
        mkdir(path) {
            let stat;
            try {
                stat = _fs.statSync(path);
                if (stat.isDirectory()) return;
                throw createError('Path "' + path + '" already exists and not a directory.');
            } catch (error) {
                if (error.code !== 'ENOENT') throw error;
                try {
                    _fs.mkdirSync(path);
                } catch (error_into) {
                    if (error_into.code !== 'ENOENT') throw error_into;
                    let dirname = _path.dirname(path);
                    if (dirname === path) {
                        throw createError('Undefined error for path "' + path + '".');
                    }
                    this.mkdir(dirname);
                    _fs.mkdirSync(path);
                }
            }
        }

        /**
         * Smart substitute for `rmdir()` native function
         * 
         * @param {string} path
         */
        rmdir(path) {
            /** @note: Tank you @tkihira
             * 
             * https://gist.github.com/tkihira/2367067
             */
            if (!_fs.statSync(path).isDirectory()) {
                throw createError('Path "' + path + '" is not a directory.');
            }

            let list = _fs.readdirSync(path);

            for (let i in list) {
                let childPath = _path.join(path, list[i]);
                let stat = _fs.statSync(childPath);

                if (childPath === "." || childPath === "..") continue;
                if (stat.isDirectory()) {
                    this.rmdir(childPath);
                    continue;
                }

                _fs.unlinkSync(childPath);
            }

            _fs.rmdirSync(path);
        }

        /**
         * Smart substitute for `fs.rename()` native function
         * 
         * @param {string} oldPath
         * @param {string} newPath
         */
        rename(oldPath, newPath) {
            _fs.renameSync(oldPath, newPath);
        }

        /**
         * Smart substitute for `fs.exists()` native function
         * 
         * @param {string} path
         */
        pathExists(path) {
            try { _fs.statSync(path); return true; } catch (_) { /* silent */ }
            return false;
        }

        /**
         * Smart substitute for `fs.exists()` native function, only for files.
         * 
         * @param {string} path
         */
        fileExists(path) {
            try {
                let stat = _fs.statSync(path);
                return stat.isFile() || stat.isSymbolicLink();
            } catch (_) { /* silent */ }
            return false;
        }

        /**
         * Smart substitute for `fs.exists()` native function, only for directory.
         * 
         * @param {string} path
         */
        directoryExists(path) {
            try {
                let stat = _fs.statSync(path);
                return stat.isDirectory();
            } catch (_) { /* silent */ }
            return false;
        }

        /**
         * Check if directory is empty.
         * 
         * @param {string} path
         */
        directoryIsEmpty(path) {
            try {
                let list = _fs.readdirSync(path);
                return list.length === 0;
            } catch (_) { /* silent */ }
            return true;
        }

        /**
         * Generate a temporary directory name
         */
        generateTempDir() {
            return _path.join(_os.tmpdir(), _crypto.randomBytes(16).toString('hex'));
        }

        /**
         * Create a Error instance
         *
         * @param {string} msg - Message of error
         * @return {object} Instance of Error
         */
        createError(msg) {
            return createError(msg);
        }

        /**
         * Normalize a URL, adding '/' end if necessary.
         * 
         * @param {string} url - An URL
         * @return {string} An normalized URL
         */
        normalizeUrl(url) {
            if (typeof url !== 'string') {
                throw createError('Invalid url value. Must be an string.');
            }

            return url.concat(url.lastIndexOf('/') !== url.length - 1 ? '/' : '');
        }

        /**
         * Make a registry Url
         * 
         * @param {object} entry - Registry entry object
         * @return {string}
         */
        makeRegistryUrl(entry) {
            if (typeof entry !== 'object') {
                throw createError('Invalid content type of registry.');
            }

            let registryType = entry.type.toLowerCase();

            // GitHub type
            if (registryType === 'github' && entry.owner && entry.repository && entry.branch) {
                return 'https://raw.githubusercontent.com/{owner}/{repository}/{branch}/{path}'
                    .replace('{owner}', entry.owner)
                    .replace('{repository}', entry.repository)
                    .replace('{branch}', entry.branch)
                    .replace('{path}', entry.path ? entry.path : '');
            }

            // URL type
            if (registryType === 'url' && entry.url) {
                return '{base}/{path}'
                    .replace('{base}', entry.url)
                    .replace('{path}', entry.path ? entry.path : '');
            }

            throw createError('Invalid registry entry to generate URL: ' + JSON.stringify(entry, null, 2));
        }

        /**
         * Resolve name in camelCase to "camel-case"
         * 
         * @param {string} name - Name in camelCase
         * 
         * @return {string} - Return a name formated to "camel-case"
         */
        resolveCamelCaseName(name) {
            if (typeof name !== 'string') {
                throw createError('Param name is not a string');
            }

            let buffer = [],
                regex = RegExp('^[A-Z]$');

            for (let c = 0; c < name.length; c++) {
                let char = name.charAt(c);
                if (c > 0 && regex.test(char.toString())) {
                    buffer.push('-');
                }
                buffer.push(char.toLowerCase());
            }

            return buffer.join('');
        }

        /**
         * Make name "camel-case" from camelCase 
         * 
         * @param {string} name - Name
         * 
         * @return {string} - Return a name formated to "camelCase"
         */
        makeCamelCaseName(name) {
            if (typeof name !== 'string') {
                throw createError('Param name is not a string');
            }

            let buffer = [],
                regex = new RegExp('^[a-zA-Z0-9-_]+$'),
                nextUpper = false;

            if (!regex.test(name)) {
                throw createError('Invalid name for makeCamelCaseName.');
            }

            for (let c = 0; c < name.length; c++) {
                let char = name.charAt(c);
                if (char === '-' && 0 < buffer.length) {
                    nextUpper = true;
                    continue;
                }
                if (nextUpper) {
                    buffer.push(char.toUpperCase());
                    nextUpper = false;
                    continue;
                }
                buffer.push(char.toLowerCase());
            }

            return buffer.join('');
        }

        /**
         * Get a user environment variable value
         * 
         * @param {string} varName - Variable name
         * @return {string}
         */
        getUserEnvironment(varName) {
            return this.__getUserEnvironment(varName);
        }

        /**
         * Set a user environment variable value
         * 
         * @param {string} varName - Variable name
         * @param {string} value - Value of variable
         * @param {Object} shellOptions
         */
        setUserEnvironment(varName, value, shellOptions) {
            this.__setUserEnvironment(varName, value, shellOptions);
            //appendUpdateEnvironmentFile(varName, value, shellOptions);
        }

        /**
         * Extract a packaged file
         * 
         * @param {string} origin - Path to packaged file
         * @param {string} destination - Path do directory destination
         */
        extractFile(origin, destination) {
            let extractor = new ZipExtractor(origin);
            extractor.extractTo('./', destination);
        }

        /**
         * Add path to environment %PATH% var
         * 
         * @param {string} path - Path to add to %PATH%
         * @param {object} devTool - Instance of DevToolCommandLine
         * @return {string} Return a environment %PATH% updated
         */
        addPathToEnvironmentPath(path, devTool, onlyUser) {
            let varName = _os.platform() === 'win32' ? 'Path' : 'PATH',
                pathSep = _os.platform() === 'win32' ? ';' : ':',
                processPath = (process.env[varName] || '').split(pathSep),
                userPath = (lib.getUserEnvironment(varName) || '').split(pathSep);

            // Update process environment
            if (!onlyUser && 0 > processPath.indexOf(path)) {
                let newPath = [path]
                    .concat(processPath)
                    .join(pathSep);
                process.env[varName] = newPath;

                /** @todo: this really necessary? YES! Only here! */
                appendUpdateEnvironmentFile(varName, newPath, devTool.shellOptions);
            }

            // Update user environment       
            if (0 > userPath.indexOf(path)) {
                let newPath = [path]
                    .concat(userPath)
                    .join(pathSep);
                lib.setUserEnvironment(varName, newPath, devTool.shellOptions);
            }
        }

        /**
         * Get a Token environment variable
         * 
         * @sample: MY_VAR
         * @note: On *nix: $MY_VAR
         * @node: On Windows: %MY_VAR%, $env:MY_VAR
         * 
         * @param {string} varName
         * @return {string} 
         */
        getEnvironmentVarToken(varName, shell) {
            if (shell === 'cmd') return '%' + varName + '%';
            if (shell === 'powershell') return '$env:' + varName;
            return '$' + varName;
        }

        /**
         * Download a web file
         * 
         * @param {string} url - Url for download
         * @param {string} path - Path to save file
         */
        download(url, path) {
            lib.logger.verbose('Downloading "' + url + '"...');

            let urlOptions = _url.parse(url),
                protocol = urlOptions.protocol.split(':')[0],
                wget = require(protocol).request;

            /** @todo: Backup a file */

            let file;

            let req = wget(urlOptions, function (res) {
                if (res.statusCode !== 200) {
                    throw createError('Response status code: ' + res.statusCode + ' ' + res.statusMessage + ' >>> ' + url);
                }

                lib.mkdir(_path.dirname(path));

                file = _fs.createWriteStream(path);

                file.on('finish', function () {
                    lib.logger.verbose('Download successfuly!');
                    file.close(/* callback */);
                });

                res.pipe(file);
            });

            req.on('error', function (error) {
                if (file) {
                    file.close(/* callback */);
                }
                /** @todo: Change to _fs.statSync(path) */
                if (_fs.existsSync(path)) {
                    _fs.unlink(path);
                    // callback
                }
                throw createError('Download error:', error);
            });

            /** @todo: Add timeout */
            // req.setTimeout(12000, function () {
            //     req.abort();
            // });

            req.end();
        }

        /**
         * Download a web file with process blocked
         * 
         * @param {string} url - Url for download
         * @param {string} path - Path to save file
         */
        downloadSync(url, path) {
            let jsEngine = process.execPath,
                jsEngineArgv = [],
                jsScript = module.filename,
                exec = _childProcess.spawnSync;

            /* @hack: No crash in node debug mode */
            process.execArgv.map((value) => {
                if (!value.startsWith('--debug-brk') && !value.startsWith('--nolazy')) {
                    jsEngineArgv.push(value);
                }
            });

            let child = exec(jsEngine, jsEngineArgv.concat([
                jsScript,
                'wget',
                url,
                path
            ]));

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
                    + 'Download failed to "' + url + '"' + _os.EOL
                    + '  PID: ' + child.pid + _os.EOL
                    + '  Command: ' + child.args.join(' ') + _os.EOL
                    + '  Exit Code: ' + child.status
                );
            }
        }

        /**
         * Load the resource object to cache from disk
         * 
         * @param {string} uri - Uniform Resource Identifier
         * 
         * @return {object} Cached object
         */
        loadCachedObjectResource(uri) {
            let uriData = compileRequireData(uri);

            // Load file from cache
            for (let c in lib.__require_cache__) {
                let cacheObj = lib.__require_cache__[c];
                if (cacheObj.name === uriData.urlSufix) {
                    return cacheObj.file;
                }
            }

            /** @todo: Change to _fs.statSync(path) */
            let fileExists = _fs.existsSync(uriData.path);

            // Load Javascript file from disk
            if (fileExists && uriData.isJS) {
                let file = require(uriData.path);

                if (uriData.type === 'cmd' && !(file instanceof lib.DevCom)) {
                    throw createError('Invalid DevCom type inheritance.');
                }

                if (lib.__require_cache__.length >= CACHE_MAX_FILE) {
                    lib.__require_cache__.splice(0, 1);
                }

                lib.__require_cache__.push({
                    name: uriData.urlSufix,
                    file: file
                });

                return file;
            }

            // Load Text file from disk
            if (fileExists && !uriData.isJS) {
                let file = _fs.readFileSync(uriData.path, 'utf8');
                if (lib.__require_cache__.length >= CACHE_MAX_FILE) {
                    lib.__require_cache__.splice(0, 1);
                }
                lib.__require_cache__.push({
                    name: uriData.urlSufix,
                    file: file
                });
                return file;
            }

            return null;
        }

        /**
         * Get `registry.{scope}.lock.json` content
         * 
         * @param {string} scope - Name of scope to get content
         * @return {object}
         */
        getRegistryLock(scope) {
            let registryLockFileName = TOOL_REGISTRY_LOCAL_LOCKFILE.replace(MAGIC_REGISTRY_LOCKNAME, scope),
                registryLockFilePath = _path.resolve(lib.devHome.root, registryLockFileName);

            lib.loadRegistryCache();

            // Download LOCK file
            /** @todo: Change to _fs.statSync(path) */
            if (!_fs.existsSync(registryLockFilePath)) {
                let registryURL = lib.makeRegistryUrl(lib.__registry_cache__[scope]);

                if (typeof registryURL !== 'string') {
                    throw createError('Unable to determine the URL for registry "' + scope + '"');
                }

                let registryLockURL = lib.normalizeUrl(registryURL).concat(TOOL_REGISTRY_LOCKFILE);
                lib.downloadSync(registryLockURL, registryLockFilePath);
            }

            // Load LOCK file
            let lockContent = require(registryLockFilePath);

            if (!Array.isArray(lockContent)) {
                throw createError('Invalid lock content. Must be an array of file paths.');
            }

            return lockContent;
        }

        /**
         * Load the `registry.json` on cache
         */
        loadRegistryCache() {
            let registryPath = _path.resolve(lib.devHome.root, TOOL_REGISTRY_FILE);

            /** @todo: Change to _fs.statSync(path) */
            if (!lib.__registry_cache__ && !_fs.existsSync(registryPath)) {
                throw createError('Registry file "' + TOOL_REGISTRY_FILE + ' " not found!');
            }

            if (!lib.__registry_cache__) {
                lib.__registry_cache__ = require(registryPath);
            }

            if (typeof lib.__registry_cache__ !== 'object') {
                throw createError('Invalid registry content. Must be an object.');
            }
        }

        /**
         * Get object for `registry.json`
         * 
         * @return {object}
         */
        getRegistry() {
            lib.loadRegistryCache();
            return lib.__registry_cache__;
        }

        /**
         * Download resource object from web
         * 
         * @param {string} uri - Uniform Resource Identifier
         */
        downloadWebObjectResource(uri) {
            let uriData = compileRequireData(uri);

            lib.loadRegistryCache();

            let registryScopes = Object.getOwnPropertyNames(lib.__registry_cache__),
                registryFileUrl;

            for (let scope in registryScopes) {
                let registryScope = registryScopes[scope],
                    registryContent = lib.__registry_cache__[registryScope];

                if (typeof registryContent.type !== 'string') {
                    throw createError('Invalid registry type for "' + registryScope + '"');
                }

                // Load LOCK file
                if (!registryContent.lock) {
                    registryContent.lock = lib.getRegistryLock(registryScope);
                }

                if (-1 < registryContent.lock.indexOf(uriData.urlSufix)) {
                    let registryURL = lib.makeRegistryUrl(registryContent);

                    if (typeof registryURL !== 'string') {
                        throw createError('Unable to determine the URL for registry "' + registryScope + '"');
                    }

                    registryFileUrl = lib.normalizeUrl(registryURL).concat(uriData.urlSufix);
                    break;
                }
            }

            if (!registryFileUrl) {
                let typeName = uriData.type === 'cmd'
                    ? 'DevCom'
                    : uriData.type === 'lib'
                        ? 'Library'
                        : 'Documentation';
                throw createError(typeName + ' "' + uriData.name + '' + '" not found!');
            }

            lib.downloadSync(registryFileUrl, uriData.path);

            /** @todo: Change to _fs.statSync(path) */
            if (!_fs.existsSync(uriData.path)) {
                throw createError('Download failed to:', registryFileUrl);
            }
        }

        /**
         * Smart substitute for `require()' native function
         * 
         * @param {string} uri - Uniform Resource Identifier
         * 
         * @return {object}
         */
        require(uri) {
            let cachedFile = lib.loadCachedObjectResource(uri);

            if (!cachedFile) {
                lib.downloadWebObjectResource(uri);
                cachedFile = lib.loadCachedObjectResource(uri);
            }

            if (cachedFile) {
                return cachedFile;
            }

            throw createError('Unexpected result to lib.require()!');
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
        parseOptions(args) {
            return parseArgOptions(args);
        }
    }

// ========================================================================
// e5r-dev/setup.js
// ========================================================================
/**
 * Devcom `setup` command
 * @class
 * 
 * Setup the E5R Development Tool on the user home
 */
class Setup extends lib.DevCom {
    
    /**
     * Run the `setup` built-in command
     * 
     * @param {object} devTool - Instance of DevToolCommandLine
     * @param {object} options - Options for argument list
     */
    run(devTool, options) {
        lib.printf('Set-up E5R Tools for Development Team...');
        
        // 1> Make directory structure
        [
            lib.devHome.root,
            lib.devHome.tools,
            lib.devHome.bin,
            lib.devHome.lib,
            lib.devHome.cmd,
            lib.devHome.doc
        ].map(path => {
            /** @todo: Change to _fs.statSync(path) */
            if (!_fs.existsSync(path)) {
                _fs.mkdirSync(path);
            }
        });
        
        // 2> Download `registry.json`
        lib.downloadSync(
            _url.resolve(TOOL_DEFAULT_REGISTRY_URL, TOOL_REGISTRY_FILE),
            _path.resolve(lib.devHome.root, TOOL_REGISTRY_FILE)
            );
        
        // 3> Add /bin to PATH
        /** @todo: Ver o uso de arquivo *.CMD & *.PS1 para propagação de %PATH%. */
        /** @todo: Ver FLAG de tipo de sessão (PS1, CMD, SH) */
        lib.addPathToEnvironmentPath(lib.devHome.bin, devTool);
        
        // 4> InstalL binary
        let registry = lib.require('cmd://registry');

        registry.run(devTool, parseArgOptions([
            'get-binaries'
        ]));
        
        // 5> Show completed info
        lib.printf('Set-up completed!');
    }
}

// ========================================================================
// e5r-dev/wget.js
// ========================================================================
/**
 * DevCom `wget` command
 * @class
 * 
 * Download a web file
 */
class Wget extends lib.DevCom {
    
    /**
     * Run the `wget` built-in devcom
     * 
     * @param {object} devTool - Instance of DevToolCommandLine
     * @param {object} options - Options for argument list
     */
    run(devTool, options) {
        if (options.args.length !== 2) {
            let lines = [
                'WGet usage: ' + devTool.name + ' wget [url] [path]',
                '  url    URL of the web file',
                '  path   Path to save web file local'
            ];

            throw createError(lines.join(_os.EOL));
        }

        let url = _url.parse(options.args[0]),
            path = _path.resolve(options.args[1]);

        if (!url.protocol) {
            throw createError('Invalid URL: ' + options.args[0]);
        }

        lib.download(url.href, path);
    }
}

// ========================================================================
// e5r-dev/devtoolcommandline.js
// ========================================================================
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

        self._exitCode = 0;
        self._args = [];

        process.argv.slice(2).map((arg) => {
            if (arg.startsWith('--shell=')) {
                self._shell = arg.split('=')[1];
            } else {
                self._args.push(arg);
            }
        });

        self._name = 'dev';
        self._cmd = (this._args.shift() || '').toLowerCase();
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

            let devcom = this.builtin[this._cmd];

            // Load dynamic devcom
            if (!devcom) {
                devcom = lib.require('cmd://' + this._cmd);
            }

            if (!devcom) {
                throw createError('DEVCOM [' + this._cmd + '] not found!');
            }

            devcom.run(this, parseArgOptions(this._args));
        } catch (error) {
            lib.logger.error(error);
            this.exitCode = error.code || 1;
        }
    }

    get shell() {
        return this._shell;
    }

    /**
     * Get shell options
     */
    get shellOptions() {
        let options,
            shell = (this._shell || '').toLowerCase();

        if (shell === 'cmd') {
            options = {
                /** @todo: Move filename to constant */
                path: _path.resolve(lib.devHome.tools, 'dev-envvars.cmd'),
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
                /** @todo: Move filename to constant */
                path: _path.resolve(lib.devHome.tools, 'dev-envvars.ps1'),
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
                /** @todo: Move filename to constant */
                path: _path.resolve(lib.devHome.tools, 'dev-envvars.sh'),
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
            value: function() {
                return BuiltinType
            }
        })

        Object.defineProperty(this._builtin, name, {
            value: instance
        })
    }
}

// ========================================================================
// e5r-dev/main.js
// ========================================================================
/**
 * @todo: Add async support
 * @todo: Implements verbosity
 */

/** @hack: No circular reference */
lib.DevTool = DevToolCommandLine;
lib.devToolDefaultInstance = new DevToolCommandLine([
    Wget,
    Setup,
]);

exports = module.exports = lib;

// Run process tools
if (!module.parent && module.filename === __filename) {
    if(lib.devToolDefaultInstance.exitCode === 0){
        lib.devToolDefaultInstance.run();
    }
    if(lib.devToolDefaultInstance.exitCode !== 0){
        lib.devToolDefaultInstance.exit();
    }
}
