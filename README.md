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

## Generate NPM version

Change the constant `TOOL_VERSION` in `src/global-consts.js` file.

```
npm version major|minor|patch -m "Release version %s"
npm publish
```

## Install on Windows

### CMD

```
@powershell -NoProfile -ExecutionPolicy unrestricted -Command "&{$DevShell='cmd';$wc=New-Object System.Net.WebClient;$wc.Proxy=[System.Net.WebRequest]::DefaultWebProxy;$wc.Proxy.Credentials=[System.Net.CredentialCache]::DefaultNetworkCredentials;Invoke-Expression ($wc.DownloadString('https://raw.githubusercontent.com/e5r/dev/develop/install.ps1'))}" && if exist %UserProfile%\.dev\bin\dev.cmd %UserProfile%\.dev\bin\dev.cmd update-devenvvars
```

### PowerShell
```powershell
&{$wc=New-Object System.Net.WebClient;$wc.Proxy=[System.Net.WebRequest]::DefaultWebProxy;$wc.Proxy.Credentials=[System.Net.CredentialCache]::DefaultNetworkCredentials;Invoke-Expression ($wc.DownloadString('https://raw.githubusercontent.com/e5r/dev/develop/install.ps1'))}
```

## Install on Unix (_Linux only_)

```
curl -sSL https://raw.githubusercontent.com/e5r/dev/develop/install.sh | sh && source ~/.dev/tools/dev-envvars.sh
```

## Start usage

```
dev --help
```
