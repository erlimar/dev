/**
 * Read a BYTE (8bits) from buffer
 * 
 * @param {number} position
 * 
 * @return {number} 
 */
Buffer.prototype.readZipByte = function (position) {
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
Buffer.prototype.readZipWord = function (position) {
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
Buffer.prototype.readZipDWord = function (position) {
    /** @todo: Privatize */
    if (!(this instanceof Buffer)) {
        throw new Error('This must be a Buffer instance');
    }
    return this.slice(position, position + 4).readUIntLE(0, 4);
}

/* DEVCODE-BEGIN */
module.exports = {}
/* DEVCODE-END */