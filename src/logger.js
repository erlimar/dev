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

/* DEVCODE-BEGIN */
module.exports.Logger = Logger;
/* DEVCODE-END */