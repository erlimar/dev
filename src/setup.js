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
        //   - Inclui %HOME%\.dev\bin ao %PATH%
        //   - Ver o uso de arquivo *.CMD & *.PS1 para propagação de %PATH%.
        //   - Ver FLAG de tipo de sessão (PS1, CMD, SH)
        /* @DOC
            - Comando windows para obtenção de variável do usuário
            REG QUERY HKCU\Environment /V NOME_ERLIMAR
            
            - Comando windows para definição de variável do usuário
            SETX NOME_ERLIMAR "Erlimar Silva Campos"
            
            - Comando windows para definição de variável do usuário + máquina
            SETX NOME_ERLIMAR "Erlimar Silva Campos" /M
            
            - Sugestões para Linux
            ABC="123"; export ABC
            export ABC="123"
            echo 'export ABC="123"' >> ~/.profile
        */
        
        // 4> InstalL binary
        let registry = lib.require('cmd://registry');

        registry.run(devTool, parseArgOptions([
            'get-binaries'
        ]));
        
        // 5> Show completed info
        lib.printf('Set-up completed!');
    }
}
