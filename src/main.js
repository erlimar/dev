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
    lib.devToolDefaultInstance.exit();
}
