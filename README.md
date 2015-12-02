E5R Dev
=======

E5R Tools for Development Team.

## Windows build

```
npm install
make dist
```

## Unix build

```
npm install
./make dist
```

## Install on Windows

### CMD

```
@powershell -NoProfile -ExecutionPolicy unrestricted -Command "&{$DevShell='cmd';$wc=New-Object System.Net.WebClient;$wc.Proxy=[System.Net.WebRequest]::DefaultWebProxy;$wc.Proxy.Credentials=[System.Net.CredentialCache]::DefaultNetworkCredentials;Invoke-Expression ($wc.DownloadString('https://raw.githubusercontent.com/e5r/dev/develop/install.ps1'))}" && set POSTFILE=%UserProfile%\.dev\tools\dev-envvars.cmd && if exist %POSTFILE% (call %POSTFILE% && del %POSTFILE%)
```

### PowerShell
```powershell
&{$wc=New-Object System.Net.WebClient;$wc.Proxy=[System.Net.WebRequest]::DefaultWebProxy;$wc.Proxy.Credentials=[System.Net.CredentialCache]::DefaultNetworkCredentials;Invoke-Expression ($wc.DownloadString('https://raw.githubusercontent.com/e5r/dev/develop/install.ps1'))}
```

## Install on Unix

Copy and paste the text on you shell.

```
TODO
```

## Start usage

```
dev help
```
