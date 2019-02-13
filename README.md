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
@powershell -NoProfile -ExecutionPolicy unrestricted -Command "&{$DevShell='cmd';$wc=New-Object System.Net.WebClient;$wc.Proxy=[System.Net.WebRequest]::DefaultWebProxy;$wc.Proxy.Credentials=[System.Net.CredentialCache]::DefaultNetworkCredentials;Invoke-Expression ($wc.DownloadString('https://raw.githubusercontent.com/e5r/dev/develop/install.ps1'))}"
```

### PowerShell
```powershell
&{$wc=New-Object System.Net.WebClient;$wc.Proxy=[System.Net.WebRequest]::DefaultWebProxy;$wc.Proxy.Credentials=[System.Net.CredentialCache]::DefaultNetworkCredentials;Invoke-Expression ($wc.DownloadString('https://raw.githubusercontent.com/e5r/dev/develop/install.ps1'))}
```

## Install on Unix (_Linux and macOS_)

### curl (eg: macOS)
```
curl -sSL https://raw.githubusercontent.com/e5r/dev/develop/install.sh
```

### wget (eg: Ubuntu)

```
wget --no-check-certificate -O- https://raw.githubusercontent.com/e5r/dev/develop/install.sh
```

## Start usage

```
dev --help
```
