E5R Dev
=======

E5R Tools for Development Team.

## Install on Windows

Copy and paste the text on you command prompt.

```
@powershell -NoProfile -ExecutionPolicy unrestricted -Command "&{$wc=New-Object System.Net.WebClient;$wc.Proxy=[System.Net.WebRequest]::DefaultWebProxy;$wc.Proxy.Credentials=[System.Net.CredentialCache]::DefaultNetworkCredentials;iex ($wc.downloadfile('https://raw.githubusercontent.com/e5r/dev/develop/install.cmd','install.cmd')); iex ('cmd.exe /C install.cmd'); iex ('del install.cmd');}"
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
