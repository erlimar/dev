/* DEVCODE-BEGIN */
(async () => {
    "use strict";

    var devUtil = require('../scripts/devutils');

    devUtil
        .ensureNode()
        .requireGlobal([
            'global-consts',
            'global-extensions',
            'global-functions',
            'global-vars',

            'devtoollib',
            'devtoolcommandline',
            'wget',
            'setup'
        ]);
    /* DEVCODE-END */

    /** @hack: No circular reference */
    lib.DevTool = DevToolCommandLine;
    lib.devToolDefaultInstance = new DevToolCommandLine([
        Wget,
        Setup,
    ]);

    exports = module.exports = lib;

    // Run process tools
    if (!module.parent && module.filename === __filename) {
        if (lib.devToolDefaultInstance.exitCode === 0) {
            lib.devToolDefaultInstance.run();
        }
        if (lib.devToolDefaultInstance.exitCode !== 0) {
            lib.devToolDefaultInstance.exit();
        }
    }

    /* DEVCODE-BEGIN */
})();
/* DEVCODE-END */