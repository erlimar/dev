:: Copyright (c) E5R Development Team. All rights reserved.
:: Licensed under the Apache License, Version 2.0. More license information in LICENSE.txt.
@echo off
setlocal

if defined PROCESSOR_ARCHITECTURE if "%PROCESSOR_ARCHITECTURE%" == "AMD64" (
    set ARCH=x64
) else (
    set ARCH=x86
)

if not defined BRANCH set BRANCH=develop

set PROGRAM_NODE=
set PROGRAM_CURL=
set PROGRAM_WGET=
set PROGRAM_POWERSHELL=
set DOWNLOAD=
set NAME=%n0
set SCRIPT=%~s0
set HOME=%USERPROFILE%
set DEV_HOME=%HOME%\.dev
set DEV_BIN=%DEV_HOME%\bin
set BIN_JSENGINE=%DEV_BIN%\jsengine.exe
set BIN_JSINSTALL=%DEV_BIN%\install.js
set DEV_TOOLS=%DEV_HOME%\tools
set NODE_URL=https://nodejs.org/dist/latest-v5.x/win-%ARCH%/node.exe
set INSTALL_JS_URL=https://github.com/e5r/dev/raw/%BRANCH%/install.js

goto :main

REM //
REM // Show error message
REM //
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

REM //
REM // Verify installation
REM //
:verify_installation
    if not exist %DEV_HOME% exit /b 1
    if not exist %DEV_BIN% exit /b 2
    if not exist %DEV_TOOLS% exit /b 3
    
    exit /b 0

REM //
REM // Download file with CURL tool
REM //
:download_curl
    echo Downloading %1 with CURL...
    echo   To %2
    call curl -G %1 -o %2 -s ^
        2>nul >nul
    exit /b %ERRORLEVEL%

REM //
REM // Download file with WGet tool
REM //
:download_wget
    echo Downloading %1 with WGet...
    echo   To %2
    call wget -nv -q --no-check-certificate -o %2 %1 ^
        2>nul >nul
    exit /b %ERRORLEVEL%

REM //
REM // Download file with PowerShell tool
REM //
:download_powershell
    echo Downloading %1 with PowerShell...
    echo   To %2
    call powershell -NoProfile -ExecutionPolicy unrestricted ^
        -Command "&{(new-object system.net.webclient).downloadfile('%1','%2')}" ^
        2>nul >nul
    exit /b %ERRORLEVEL%

REM //
REM // Main entry point 
REM //
:main
    REM // Verify NODE installed
    where node 2>nul >nul
    if %ERRORLEVEL% == 0 (
        set PROGRAM_NODE=1
    )

    REM // Verify CURL installed
    where curl 2>nul >nul
    if %ERRORLEVEL% == 0 (
        set PROGRAM_CURL=1
    )
    
    REM // Verify WGET installed
    where wget 2>nul >nul
    if %ERRORLEVEL% == 0 (
        set PROGRAM_WGET=1
    )
    
    REM // Verify POWERSHELL installed
    where powershell 2>nul >nul
    if %ERRORLEVEL% == 0 (
        set PROGRAM_POWERSHELL=1
    )
    
    REM // Set download mechanism.
    if defined PROGRAM_CURL set DOWNLOAD=download_curl && goto :install
    if defined PROGRAM_WGET set DOWNLOAD=download_wget && goto :install
    if defined PROGRAM_POWERSHELL set DOWNLOAD=download_powershell && goto :install
    
    if not defined DOWNLOAD (
        set ERROR_MSG_L1=Could not determine a mechanism to perform downloads.
        set ERROR_MSG_L2=Expected one of the tools: CURL, WGet or PowerShell.
        set ERROR_MSG_L3=Install one of these tools on your system and try again.
        call :show_error
        goto :end
    )

REM //
REM // Start installation
REM //
:install
    call :verify_installation
    if "%ERRORLEVEL%" == "0" goto :success
    
    echo Installing E5R Tools for Development Team...
    
    REM // Create directory structure
    if exist %DEV_HOME% call rmdir /S /Q %DEV_HOME%
    
    call mkdir %DEV_HOME%
    call mkdir %DEV_BIN%
    call mkdir %DEV_TOOLS%
    
    REM // Download NodeJS
    call :%DOWNLOAD% %NODE_URL% %BIN_JSENGINE%
    if not exist %BIN_JSENGINE% (
        set ERROR_MSG=Could not download NodeJS.
        call :show_error
        goto :end
    )
    
    REM // Download install.js
    call :%DOWNLOAD% %INSTALL_JS_URL% %BIN_JSINSTALL%
    if not exist %BIN_JSINSTALL% (
        set ERROR_MSG=Could not download install.js file.
        call :show_error
        goto :end
    )
    
    REM // Run node install.js
    call %BIN_JSENGINE% %BIN_JSINSTALL% %*
    set ERROR_LEVEL=%ERRORLEVEL%
    if "ERROR_LEVEL" neq "0" (
        set ERROR_MSG=Error running install.js script file.
        call :show_error
        goto :end
    )
    
:success
    echo.
    echo             __________________________________________
    echo            ( Copyright (c) 2015 E5R Development Team /
    echo            \____________  ___________________________)
    echo                            \/
    echo  //////////////////////////////////////////////////////
    echo  \\ ................................................ \\
    echo  // E5R Tools for Development Team successfuly installed! //
    echo  \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
    echo   ___________/\___________
    echo  (  All rights reserved.  )
    echo   (_____---____----_____) 
    echo.

REM //
REM // Script finish
REM //
:end
    endlocal
    exit /b %ERROR_LEVEL%
