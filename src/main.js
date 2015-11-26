/**
 * @todo: Add async support
 * @todo: Implements verbosity
 */

/** @hack: No circular reference */
lib.DevTool = DevToolCommandLine;

exports = module.exports = lib;

if (!module.parent && module.filename === __filename) {
    // Run process tools
    new DevToolCommandLine([
        Wget,
        Setup,
    ]);
}
