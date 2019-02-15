Setup
=====

O setup é a primeira parte em que o usuário tem contato com a ferramenta,
e é aqui que o usuário instala a ferramente `dev` em seu computador.

Aqui você ficará conhecendo os passos que o setup executa, e assim
poderá contribuir com a melhoria do mesmo.

## Setup manual

De um modo geral, o setup é a instalação da ferramenta principal
na máquina do usuário, e consiste nos seguintes passos:

1. Criar uma pasta chamada `.dev` em seu diretório de usuário, e dentro deste
   diretório a seguinte estrutura:
   
    ```
     ${HOME}/
        .dev/
            bin/
            doc/
            lib/
                node_modules/
            tools/
    ```

2. Baixar o script `dev` para `${HOME}/.dev/bin`:

    * **Unix**:
      - https://raw.githubusercontent.com/e5r/dev/develop/dist/devcom/bin/dev.sh
    * **Windows**:
      - https://raw.githubusercontent.com/e5r/dev/develop/dist/devcom/bin/dev.cmd
      - https://raw.githubusercontent.com/e5r/dev/develop/dist/devcom/bin/dev.ps1
  
    No caso do Windows temos um script tanto para CMD quanto para PowerShell.

    2.1. No Unix ainda precisaremos tornar o arquivo `dev.sh` executável e 
         renomeá-lo para `dev` (sem a extensão)

    ```
    $ chmod a+x dev.sh
    $ mv dev.sh dev
    ```

3. Adicionar o caminho `${HOME}/.dev/bin` a variável `PATH` do sistema.

    3.1. No Unix

    ```
    $ export PATH=$HOME/.dev/bin:$PATH
    ```

    Recomendamos adicionar essa linha em um de seus arquivos de perfil do shell:

    - $HOME/.profile
    - $HOME/.bashrc
    - $HOME/.bash_profile

    3.2. No Windows

    ```
    CMD:> setx Path "%UserProfile%\.dev\bin;%Path%"
    ```

4. Instalar a biblioteca JavaScript `e5r-dev.js` e o NodeJS

    O script `dev` em si somente é um atalho para chamar o script `e5r-dev.js`
    usando o NodeJS para fazer todo o trabalho, por isso precisaremos:
    
    4.1. Baixar `e5r-dev.js` para `${HOME}/.dev/lib/node_modules`.
    
    Url: https://raw.githubusercontent.com/e5r/dev/develop/dist/e5r-dev.js
    
    4.2. Baixar o `node` versão `7.4.0` para `${HOME}/.dev/tools/`.
    
    - Windows: https://nodejs.org/dist/v7.4.0/node-v7.4.0-win-x64.zip
    - Linux: https://nodejs.org/dist/v7.4.0/node-v7.4.0-linx-x64.tar.gz
    - macOS: https://nodejs.org/dist/v7.4.0/node-v7.4.0-darwin-x64.tar.gz
    
    Após baixar, extraia o arquivo `node|node.exe` para a pasta correta,
    você deve renomear o arquivo para `jsengine.exe` no Windows, ou `jsengine`
    no Unix (Linux e macos).
    
    No Unix ainda precisaremos tornar o arquivo executável também:
    
    ```
    $ chmod a+x jsengine
    ```

Com isso você já tem a ferramente `dev` disponível em sua linha de comando.

Experimente:

```console
$ dev --help
  
  ________
  ___  __ \_______   __
  __  / / /  _ \_ | / /
  _  /_/ //  __/_ |/ /
  /_____/ \___/_____/  v0.14.1
  
  (c) E5R Development Team. All rights reserved.
  
  E5R Tools for Development Team
  
  usage: dev [devcom] [options]
  
  DevCom:
    wget                       Download a web files
    setup                      Setup a E5R Development Team Environment
    ???                        Something
  
  Options:
    --help|-h                  Show this help text
    --version|-v               Show version number
    --workdir=[path]           Set the work directory. Default is ${cwd}
    -devmode                   Run on development mode
```