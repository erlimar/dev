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
        throw createError('DevCom.shortDoc not implemented.');
    }
}
