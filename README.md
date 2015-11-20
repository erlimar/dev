E5R Dev
=======

E5R Tools for Development Team.

## Build

```
npm install
gulp dist
```

## Install on Windows

Copy and paste the text on you command prompt.

### CMD

```
@powershell -NoProfile -ExecutionPolicy unrestricted -Command "&{$wc=New-Object System.Net.WebClient;$wc.Proxy=[System.Net.WebRequest]::DefaultWebProxy;$wc.Proxy.Credentials=[System.Net.CredentialCache]::DefaultNetworkCredentials;Invoke-Expression ($wc.DownloadString('https://raw.githubusercontent.com/e5r/dev/develop/install.ps1'))}"
```

### PowerShell
```powershell
&{$wc=New-Object System.Net.WebClient;$wc.Proxy=[System.Net.WebRequest]::DefaultWebProxy;$wc.Proxy.Credentials=[System.Net.CredentialCache]::DefaultNetworkCredentials;Invoke-Expression ($wc.DownloadString('https://raw.githubusercontent.com/e5r/dev/develop/install.ps1'))}
```

## Install on Unix

Copy and paste the text on you shell.

```
$> TODO
```

## Usage

```
$> dev <command> [options]
```

### command

Any of the [file list](dist/tools).

### options

Options of the command.

## Help

```
$> dev help
```
