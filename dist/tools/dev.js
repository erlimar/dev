// Copyright (c) E5R Development Team. All rights reserved.
// Licensed under the Apache License, Version 2.0. More license information in LICENSE.txt.

/* global process, __filename, __dirname */

+function(){
    console.log('Executing [install.js] script on [NodeJs]...');
    console.log('  __filename:', __filename);
    console.log('  __dirname:', __dirname);

    // 1> Download de url://dist/registry.json para %HOME%\.dev\registry.json
    //   Este arquivo contém os URL's com plugins (DEVCOM - Development Command),
    //   no seguinte formato:
    //   {
    //       "default": {
    //           "type": "GitHub",
    //           "owner": "e5r",
    //           "repository": "dev",
    //           "branch": "develop",
    //           "path": "dist"
    //           },
    //           "sampleUrlForRegistryFile": "https://raw.githubusercontent.com/e5r/dev/develop/dist/registry.json"
    //       },
    //       "default-url": {
    //           "type": "URL",
    //           "repository": "http://dev.mycompany.com/plugins",
    //           "sampleUrlForRegistryFile": "http://dev.mycompany.com/plugins/registry.json"
    //       }
    //   }
    
    // 2> Download de url://dist/bin/dev.{cmd,ps1} (Windows) para %HOME%\.dev\bin\dev.{cmd,ps1}
    //   Esses arquivos (dev.cmd e dev.ps1) devem somente repassar os argumentos para o comando
    //   nodeJS [jsengine.exe dev.js *ARGS*]
    //   - Inclui %HOME%\.dev\bin ao %PATH%
    //   - Ver o uso de arquivo *.CMD & *.PS1 para propagação de %PATH%.

    // 3> Download de url://dist/tools/dev.js par %HOME%\.dev\tools\dev.js
    
    // 4> Apagar este arquivo (%HOME%\.dev\tools\install.js)
}();


/* ~file: /tools/dev.js
    
O primeiro argumento sempre deve ser o %DEVCOM%, e existe em:
%HOME%\.dev\tools\devcom\*.js

Se o mesmo não existir, percorre-se o registro (%HOME%\.dev\registry.json)
combinando a url gerada com o nome possível do arquivo em busca do arquivo
para download. 
*/

/*
DEVCOM padrões:

- help -> builtin
    Exibe o arquivo /help/devcom/command.html no navegador
    ou, /help/devcom/command.man/ no prompt

- registry -> builtin
    * list -> Lista os nomes dos registros em `registry.json`
    * show [name] -> Exibe as informações do registro X em `registry.json`
    * remove [name] -> Remove um registro da lista
    * update [url for registry.json] -> Faz um merge do `registry.json` atual com o baixado da url
    Todos os registros no remoto serão adicionados ou substituirão os existentes localmente
*/
