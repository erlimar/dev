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
            'wget'
        ]);
    /* DEVCODE-END */

    /**
     * Devcom `setup` command
     * @class
     * 
     * Setup the E5R Development Tool on the user home
     */
    class Setup extends lib.DevCom {

        get name() {
            return 'setup';
        }

        get shortDoc() {
            return 'Setup a E5R Development Team Environment';
        }

        /**
         * Run the `setup` built-in command
         * 
         * @param {object} devTool - Instance of DevToolCommandLine
         * @param {object} options - Options for argument list
         */
        async run(devTool, options) {
            lib.printf('Set-up E5R Tools for Development Team...');

            // Update the e5r-dev.js lib
            if (options.args[0] === 'update') {
                lib.printf('  Updating e5r-dev lib...');
                let libPath = _path.join(lib.devHome.lib, 'node_modules', 'e5r-dev.js');
                await lib.downloadAsync(TOOL_DEVE5R_LIB_URL, libPath);
            }

            // 1> Make directory structure
            [
                lib.devHome.root,
                lib.devHome.tools,
                lib.devHome.bin,
                lib.devHome.lib,
                lib.devHome.cmd,
                lib.devHome.doc
            ].map(path => {
                lib.logger.debug('mkdir:', path);
                lib.mkdir(path);
            });

            // 2> Download `registry.json`
            lib.logger.debug(
                'downloadSync:',
                _url.resolve(TOOL_DEFAULT_REGISTRY_URL, TOOL_REGISTRY_FILE),
                _path.resolve(lib.devHome.root, TOOL_REGISTRY_FILE)
            );

            let urlRegistryFile = _url.resolve(TOOL_DEFAULT_REGISTRY_URL, TOOL_REGISTRY_FILE),
                pathRegistryFile = _path.resolve(lib.devHome.root, TOOL_REGISTRY_FILE);

            await lib.downloadAsync(urlRegistryFile, pathRegistryFile);

            // 3> Add /bin to PATH
            /** @todo: Ver o uso de arquivo *.CMD & *.PS1 para propagação de %PATH%. */
            /** @todo: Ver FLAG de tipo de sessão (PS1, CMD, SH) */
            /** @todo: Move 'E5R_PATH' to constant */
            lib.setUserEnvironment('E5R_PATH', lib.devHome.bin, devTool.shellOptions);

            if (_os.platform() === 'win32') {
                throw lib.createError('global.appendUserEnvironmentVarToPathWindows() not implemented!');
            } else {
                /** @todo: Implements lib.appendUserEnvironmentVarToPath() */
                appendUserEnvironmentVarToPathUnix('E5R_PATH');
            }

            // 4> Install Shell Script on Profile
            installShellScriptProfile();

            // 5> Install binary
            lib.logger.debug('Loading DEVCOM registry...');
            let registry = await lib.require('cmd://registry');

            lib.logger.debug('Calling DEVCOM registry get-binaries...');
            await registry.run(devTool, parseArgOptions([
                'get-binaries'
            ]));

            // 6> Show completed info
            lib.printf('Set-up completed!');
        }
    }

    /* DEVCODE-BEGIN */
    module.exports.Setup = Setup;

    if (!module.parent && module.filename === __filename && process.argv.indexOf('-devmode') >= 0) {
        /** @hack: No circular reference and reconfigure paths */
        _rootPath = _path.resolve(_os.homedir(), '.dev');
        _devPaths = {
            root: _rootPath,
            tools: _path.join(_rootPath, 'tools'),
            bin: _path.join(_rootPath, 'bin'),
            lib: _path.join(_rootPath, 'lib'),
            cmd: _path.join(_rootPath, 'lib', 'cmd'),
            doc: _path.join(_rootPath, 'doc')
        };

        process.argv.push('--shell=' + (_os.platform() === 'win32' ? 'cmd' : 'sh'));

        lib.DevTool = DevToolCommandLine;
        lib.devToolDefaultInstance = new DevToolCommandLine([
            Wget,
            Setup,
        ]);

        new Setup().run(lib.devToolDefaultInstance, lib.devToolDefaultInstance._options);
    }

})();
/* DEVCODE-END */