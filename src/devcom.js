/* DEVCODE-BEGIN */
var devUtil = require('../scripts/devutils');

devUtil
    .ensureNode()
    .requireGlobal([
        'global-consts',
        'global-extensions',
        'global-functions',
        'global-vars'
    ]);
/* DEVCODE-END */

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
        throw createError('DevCom.run() not implemented.');
    }

    get name() {
        throw createError('DevCom.name not implemented.');
    }

    get shortDoc() {
        throw createError('DevCom.shortDoc not implemented for [' + this.name + '].');
    }
}

/* DEVCODE-BEGIN */
module.exports.DevCom = DevCom;

// Asserts
var devcom = new DevCom();

_assert(devcom instanceof DevCom, 'Invalid devcom instance');
/* DEVCODE-END */