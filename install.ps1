# Copyright (c) E5R Development Team. All rights reserved.
# Licensed under the Apache License, Version 2.0. More license information in LICENSE.txt.

#Requires -Version 2

<#
.SYNOPSIS
    Install the E5R Tools for Development Team. 

.PARAMETER Branch
    Name of the Git branch on repository
.PARAMETER Force
    Force installation over a exist old installation 
#>

param (
    [string] $Branch = "develop",
    [switch] $Force = $false,
    [switch] $Verbose = $false
)

# Default PowerShell Configurations

$ErrorActionPreference = 'Stop'

if($Verbose) {
    $VerbosePreference = 'Continue'
}

# Constants

Set-Variable -Option Constant "Arch" @{32="x86"; 64="x64"}[[IntPtr]::Size * 8]
Set-Variable -Option Constant "ScriptName" $MyInvocation.MyCommand
Set-Variable -Option Constant "ScriptFile" $MyInvocation.InvocationName
Set-Variable -Option Constant "GitBranch" $Branch
Set-Variable -Option Constant "DevHome" "$Home\.dev"
Set-Variable -Option Constant "DevTools" "$DevHome\tools"

# HACK: All libraries are installed in "/lib" or "/lib/cmd". So when these libraries
#       use "require('e5r-dev')" will always find the file "dist/e5r-dev.js" as a module,
#       as is the standard way of resolving NodeJS dependencies.
Set-Variable -Option Constant "DevLib" "$DevHome\lib\node_modules"

Set-Variable -Option Constant "BinJSEngine" "$DevTools\jsengine.exe"
Set-Variable -Option Constant "BinJSDev" "$DevLib\e5r-dev.js"
Set-Variable -Option Constant "PostFile" "$DevTools\dev-envvars.ps1"
Set-Variable -Option Constant "NodeVersion" "7.4.0"
Set-Variable -Option Constant "NodeURL" "https://nodejs.org/dist/v$NodeVersion/win-$Arch/node.exe" 
Set-Variable -Option Constant "JSInstallerURL" "https://raw.githubusercontent.com/e5r/dev/$GitBranch/dist/e5r-dev.js" 

<#
.SYNOPSIS
    Show the exception information on screen

.PARAMETER exception
    Exception object
#>
Function Show-Exception
{
    param(
        $exception
    )

    "/-----------------------------------------------------------------------------------------" | Write-Host -ForegroundColor DarkRed
    " INSTALLER ERROR:`n" | Write-Host -ForegroundColor DarkRed
    
    $col = 0
    $nl = ""
    
    foreach($word in "$exception" -split "\s+") {
        $col += $word.length + 1
        " $word" | Write-Host -NoNewLine  -ForegroundColor Red
        $nl = "`n"
        if($col -gt 80)
        {
            "" | Write-Host
            $col = $word.length + 1
            $nl = ""
        }
    }
    
    "$nl"
    "" | Write-Host
    " Script: " | Write-Host -NoNewLine -ForegroundColor DarkRed; $exception.InvocationInfo.ScriptName | Write-Host -ForegroundColor Red 
    " Line:   " | Write-Host -NoNewLine -ForegroundColor DarkRed; $exception.InvocationInfo.ScriptLineNumber | Write-Host -ForegroundColor Red
    " Column: " | Write-Host -NoNewLine -ForegroundColor DarkRed; $exception.InvocationInfo.OffsetInLine | Write-Host -ForegroundColor Red
    " Body:   " | Write-Host -NoNewLine -ForegroundColor DarkRed; $exception.InvocationInfo.Line.Trim() | Write-Host -ForegroundColor Red
    "-----------------------------------------------------------------------------------------\" | Write-Host -ForegroundColor DarkRed
}

<#
.SYNOPSIS
    Find a old installation
#>
Function Find-Installation
{
    if(!(Test-Path $DevTools)) {
        return $false
    }
    
    if(!(Test-Path $BinJSEngine)) {
        return $false
    }
    
    if(!(Test-Path $BinJSDev)) {
        return $false
    }
    
    return $true
}

<#
.SYNOPSIS
    Get a file on the Web with Web Request
.PARAMETER Origin
    The origin URL of the web file
.PARAMETER Destination
    The destination Path to save file
#>
Function Get-WebFile
{
    param (
        [string] $Origin,
        [string] $Destination
    )
    
    $wc = New-Object System.Net.WebClient
    # @todo: Apply-Proxy $wc
    "Downloading $Origin..." | Write-Verbose
    
    $wc.DownloadFile($Origin, $Destination)
}

<#
.SYNOPSIS
    Clear a old installation
#>
Function Clear-Dev
{
    "Cleaning old installation..." | Write-Verbose
    Remove-Item -Path $DevHome -Force -Recurse
}

<#
.SYNOPSIS
    Install the E5R Tools for Development Team.
#>
Function Install-Dev
{
    "Preparing E5R Tools for Development Team Installation..." | Write-Host
    
    # Make directory structure
    New-Item -Path $DevTools -ItemType Directory -Force | Out-Null
    New-Item -Path $DevLib -ItemType Directory -Force | Out-Null
    
    # Download NODEJS
    Get-WebFile -Origin $NodeURL -Destination $BinJSEngine
    
    # Download "e5r-dev.js" script
    Get-WebFile -Origin $JSInstallerURL -Destination $BinJSDev
    
    # Invoke $> node e5r-dev.js setup
    $ShellName = 'powershell'
    
    if($DevShell) {
        $ShellName = $DevShell
    }
    
    Invoke-Expression "& `"$BinJSEngine`" `"$BinJSDev`" setup --shell=$ShellName"
}

<#
.SYNOPSIS
    Start a script logic
#>
Function Start-Script
{
    $found = Find-Installation
    
    if($found -and $Force) {
        Clear-Dev
    } elseif($found) {
        "An installation already exists" | Write-Warning
        return
    }

    Install-Dev
    
    # Update environment from postfile
    if(Test-Path $PostFile) {
        Invoke-Expression (Get-Content $PostFile)
    }
    
    if(Test-Path $PostFile) {
        Remove-Item $PostFile
    }
}

try {
    Start-Script
} catch {
    Set-Variable -Option Constant "ErrorCode" 1
    Show-Exception $_
} finally {
    if($ErrorCode) {
        $ExitCode = $ErrorCode
    } elseif($LastExitCode) {
        $ExitCode = $LastExitCode
    } else {
        $ExitCode = 0
    }
    
    "Exit code: $ExitCode" | Write-Verbose
    
    $LastExitCode = $ExitCode
}
