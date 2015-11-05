@echo off

goto :main

Rem //
Rem // Show error message
Rem //
:show_error
    echo --------------------------------------------------------------------------------
    echo  ERROR!    %ERROR_MSG%%ERROR_MSG_L1%
    if "%ERROR_MSG_L2%" neq "" (
    echo            %ERROR_MSG_L2%
    )
    if "%ERROR_MSG_L3%" neq "" (
    echo            %ERROR_MSG_L3%
    )    
    echo --------------------------------------------------------------------------------
    if defined ERROR_LEVEL (
    echo  CODE:     %ERROR_LEVEL%
    echo --------------------------------------------------------------------------------
    )
    
    set ERROR_MSG=
    set ERROR_MSG_L1=
    set ERROR_MSG_L2=
    set ERROR_MSG_L3=
    
    exit /b
    
:download_curl
    echo Downloading %1 with CURL...
    echo   To %2
    call curl -G %1 -o %2 -s ^
        2>nul >nul
    exit /b
    
:download_wget
    echo Downloading %1 with WGet...
    echo   To %2
    call wget -nv -q --no-check-certificate -o %2 %1 ^
        2>nul >nul
    exit /b
    
:download_powershell
    echo Downloading %1 with PowerShell...
    echo   To %2
    call powershell -NoProfile -ExecutionPolicy unrestricted ^
        -Command "&{(new-object system.net.webclient).downloadfile('%1','%2')}" ^
        2>nul >nul
    exit /b

Rem //
Rem // Main entry point 
Rem //
:main
Rem # %~d0         Drive
Rem # %~f0         Path do script (com Drive)
Rem # %~n0         Nome do comando
Rem # %~p0         Path do script (sem Drive)
Rem # %~s0         Path do script (com Drive)
Rem # %~t0         Data/Hora atual
Rem # %~x0         Extensão do script dd
Rem # %~z0         Tamanho do arquivo de script (em bytes)
Rem # %{N}         Onde {N} é o número do parâmetro. Valor do parâmetro informado
Rem                da forma que foi passado para a linha de comando.

Rem # Cria diretório temporário 
Rem # mkdir .\curl
Rem # expand curl-7.45.0_win32.cab -F:curl.exe .\curl
Rem # move .\curl\i386\curl.exe .\curl.exe
Rem # rd /S /Q .\curl

Rem # http://home.arcor.de/skanthak/download/curl-7.45.0.cab
Rem # where node 2>nul >nul
    set PROGRAM_NODE=
    set PROGRAM_CURL=
    set PROGRAM_WGET=
    set PROGRAM_POWERSHELL=
    set DOWNLOAD=

    Rem // Verify NODE installed
    where node 2>nul >nul
    if %ERRORLEVEL% == 0 (
        set PROGRAM_NODE=1
    )

    Rem // Verify CURL installed
    where curl__ 2>nul >nul
    if %ERRORLEVEL% == 0 (
        set PROGRAM_CURL=1
    )
    
    Rem // Verify WGET installed
    where wget 2>nul >nul
    if %ERRORLEVEL% == 0 (
        set PROGRAM_WGET=1
    )
    
    Rem // Verify POWERSHELL installed
    where powershell__ 2>nul >nul
    if %ERRORLEVEL% == 0 (
        set PROGRAM_POWERSHELL=1
    )
    
    if defined PROGRAM_CURL set DOWNLOAD=download_curl && goto :next
    if defined PROGRAM_WGET set DOWNLOAD=download_wget && goto :next
    if defined PROGRAM_POWERSHELL set DOWNLOAD=download_powershell && goto :next
    Rem if defined PROGRAM_NODE echo NODE presents
    
:next
    if not defined DOWNLOAD (
        set ERROR_MSG_L1=Could not determine a mechanism to perform downloads.
        set ERROR_MSG_L2=Expected one of the tools: CURL, WGet or PowerShell.
        set ERROR_MSG_L3=Install one of these tools on your system and try again.
        call :show_error
        goto :end
    )

    if exist "%CD%\curl.cab" call del /F /Q "%CD%\curl.cab" 
    call :%DOWNLOAD% http://home.arcor.de/skanthak/download/curl-7.45.0.cab %CD%\curl.cab
    

Rem //
Rem // Script finish
Rem //
:end
    exit /b %ERROR_LEVEL%