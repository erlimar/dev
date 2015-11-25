#!/bin/env bash

# Copyright (c) E5R Development Team. All rights reserved.
# Licensed under the Apache License, Version 2.0. More license information in LICENSE.txt.

# @todo: FreeBSD node:
#
# - Download node:
#   $> fetch --no-verify-peer http://pkg.freebsd.org/freebsd:11:x86:32/latest/All/node-devel-5.0.0.txz
#
# - Extract jsengine:
#   $> mkdir ./node-devel
#   $> tar -xf node-devel-5.0.0.txz -C ./node-devel
#   $> mv ./node-devel/usr/local/bin/node ./jsengine
#   $> rm -rf ./node-devel
#   $> rm node-devel-5.0.0.txz

# Thank you Tim Caswell:
# - https://github.com/creationix/nvm/blob/master/install.sh
# - https://github.com/creationix/nvm/blob/master/nvm.sh

{

dev_has() {
    type "$1" > /dev/null 2>&1
}

dev_download() {
# curl --insecure --silent -o Outputfile
# wget --no-check-certificate --quiet -o Outputfile
# fetch --no-verify-peer --quiet -o Outputfile
#
#
#
    if nvm_has "curl"; then
        curl -q $*
    elif nvm_has "wget"; then
        # Emulate curl with wget
        ARGS=$(echo "$*" | command sed -e 's/--progress-bar /--progress=bar /' \
                            -e 's/-L //' \
                            -e 's/-I /--server-response /' \
                            -e 's/-s /-q /' \
                            -e 's/-o /-O /' \
                            -e 's/-C - /-c /')
        wget $ARGS
    elif nvm_has "fetch"; then
        fetch --no-verify-peer $*
    fi
}

install_nvm_from_git() {
  if [ -d "$NVM_DIR/.git" ]; then
    echo "=> nvm is already installed in $NVM_DIR, trying to update using git"
    printf "\r=> "
    cd "$NVM_DIR" && (command git fetch 2> /dev/null || {
      echo >&2 "Failed to update nvm, run 'git fetch' in $NVM_DIR yourself." && exit 1
    })
  else
    # Cloning to $NVM_DIR
    echo "=> Downloading nvm from git to '$NVM_DIR'"
    printf "\r=> "
    mkdir -p "$NVM_DIR"
    command git clone "$(nvm_source git)" "$NVM_DIR"
  fi
  cd "$NVM_DIR" && command git checkout --quiet $(nvm_latest_version)
  if [ ! -z "$(cd "$NVM_DIR" && git show-ref refs/heads/master)" ]; then
    if git branch --quiet 2>/dev/null; then
      cd "$NVM_DIR" && command git branch --quiet -D master >/dev/null 2>&1
    else
      echo >&2 "Your version of git is out of date. Please update it!"
      cd "$NVM_DIR" && command git branch -D master >/dev/null 2>&1
    fi
  fi
  return
}

install_nvm_as_script() {
  local NVM_SOURCE_LOCAL
  NVM_SOURCE_LOCAL=$(nvm_source script)
  local NVM_EXEC_SOURCE
  NVM_EXEC_SOURCE=$(nvm_source script-nvm-exec)

  # Downloading to $NVM_DIR
  mkdir -p "$NVM_DIR"
  if [ -d "$NVM_DIR/nvm.sh" ]; then
    echo "=> nvm is already installed in $NVM_DIR, trying to update the script"
  else
    echo "=> Downloading nvm as script to '$NVM_DIR'"
  fi
  nvm_download -s "$NVM_SOURCE_LOCAL" -o "$NVM_DIR/nvm.sh" || {
    echo >&2 "Failed to download '$NVM_SOURCE_LOCAL'"
    return 1
  }
  nvm_download -s "$NVM_EXEC_SOURCE" -o "$NVM_DIR/nvm-exec" || {
    echo >&2 "Failed to download '$NVM_EXEC_SOURCE'"
    return 2
  }
  chmod a+x "$NVM_DIR/nvm-exec" || {
    echo >&2 "Failed to mark '$NVM_DIR/nvm-exec' as executable"
    return 3
  }
}

#
# Detect profile file if not specified as environment variable
# (eg: PROFILE=~/.myprofile)
# The echo'ed path is guaranteed to be an existing file
# Otherwise, an empty string is returned
#
nvm_detect_profile() {

  local DETECTED_PROFILE
  DETECTED_PROFILE=''
  local SHELLTYPE
  SHELLTYPE="$(basename /$SHELL)"

  if [ $SHELLTYPE = "bash" ]; then
    if [ -f "$HOME/.bashrc" ]; then
      DETECTED_PROFILE="$HOME/.bashrc"
    elif [ -f "$HOME/.bash_profile" ]; then
      DETECTED_PROFILE="$HOME/.bash_profile"
    fi
  elif [ $SHELLTYPE = "zsh" ]; then
    DETECTED_PROFILE="$HOME/.zshrc"
  fi

  if [ -z $DETECTED_PROFILE ]; then
    if [ -f "$PROFILE" ]; then
      DETECTED_PROFILE="$PROFILE"
    elif [ -f "$HOME/.profile" ]; then
      DETECTED_PROFILE="$HOME/.profile"
    elif [ -f "$HOME/.bashrc" ]; then
      DETECTED_PROFILE="$HOME/.bashrc"
    elif [ -f "$HOME/.bash_profile" ]; then
      DETECTED_PROFILE="$HOME/.bash_profile"
    elif [ -f "$HOME/.zshrc" ]; then
      DETECTED_PROFILE="$HOME/.zshrc"
    fi
  fi

  if [ ! -z $DETECTED_PROFILE ]; then
    echo "$DETECTED_PROFILE"
  fi
}

#
# Check whether the user has any globally-installed npm modules in their system
# Node, and warn them if so.
#
nvm_check_global_modules() {
  command -v npm >/dev/null 2>&1 || return 0

  local NPM_VERSION
  NPM_VERSION="$(npm --version)"
  NPM_VERSION="${NPM_VERSION:--1}"
  [ "${NPM_VERSION%%[!-0-9]*}" -gt 0 ] || return 0

  local NPM_GLOBAL_MODULES
  NPM_GLOBAL_MODULES="$(
    npm list -g --depth=0 |
    sed '/ npm@/d' |
    sed '/ (empty)$/d'
  )"

  local MODULE_COUNT
  MODULE_COUNT="$(
    printf %s\\n "$NPM_GLOBAL_MODULES" |
    sed -ne '1!p' |                             # Remove the first line
    wc -l | tr -d ' '                           # Count entries
  )"

  if [ $MODULE_COUNT -ne 0 ]; then
    cat <<-'END_MESSAGE'
	=> You currently have modules installed globally with `npm`. These will no
	=> longer be linked to the active version of Node when you install a new node
	=> with `nvm`; and they may (depending on how you construct your `$PATH`)
	=> override the binaries of modules installed with `nvm`:
	END_MESSAGE
    printf %s\\n "$NPM_GLOBAL_MODULES"
    cat <<-'END_MESSAGE'
	=> If you wish to uninstall them at a later point (or re-install them under your
	=> `nvm` Nodes), you can remove them from the system Node as follows:
	     $ nvm use system
	     $ npm uninstall -g a_module
	END_MESSAGE
  fi
}

nvm_do_install() {
  if [ -z "$METHOD" ]; then
    # Autodetect install method
    if nvm_has "git"; then
      install_nvm_from_git
    elif nvm_has "nvm_download"; then
      install_nvm_as_script
    else
      echo >&2 "You need git, curl, or wget to install nvm"
      exit 1
    fi
  elif [ "~$METHOD" = "~git" ]; then
    if ! nvm_has "git"; then
      echo >&2 "You need git to install nvm"
      exit 1
    fi
    install_nvm_from_git
  elif [ "~$METHOD" = "~script" ]; then
    if ! nvm_has "nvm_download"; then
      echo >&2 "You need curl or wget to install nvm"
      exit 1
    fi
    install_nvm_as_script
  fi

  echo

  local NVM_PROFILE
  NVM_PROFILE=$(nvm_detect_profile)

  SOURCE_STR="\nexport NVM_DIR=\"$NVM_DIR\"\n[ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\"  # This loads nvm"

  if [ -z "$NVM_PROFILE" ] ; then
    echo "=> Profile not found. Tried $NVM_PROFILE (as defined in \$PROFILE), ~/.bashrc, ~/.bash_profile, ~/.zshrc, and ~/.profile."
    echo "=> Create one of them and run this script again"
    echo "=> Create it (touch $NVM_PROFILE) and run this script again"
    echo "   OR"
    echo "=> Append the following lines to the correct file yourself:"
    printf "$SOURCE_STR"
    echo
  else
    if ! command grep -qc '/nvm.sh' "$NVM_PROFILE"; then
      echo "=> Appending source string to $NVM_PROFILE"
      printf "$SOURCE_STR\n" >> "$NVM_PROFILE"
    else
      echo "=> Source string already in $NVM_PROFILE"
    fi
  fi

  nvm_check_global_modules

  echo "=> Close and reopen your terminal to start using nvm"
  nvm_reset
}

#
# Unsets the various functions defined
# during the execution of the install script
#
nvm_reset() {
  unset -f nvm_reset nvm_has nvm_latest_version \
    nvm_source nvm_download install_nvm_as_script install_nvm_from_git \
    nvm_detect_profile nvm_check_global_modules nvm_do_install
}

[ "_$NVM_ENV" = "_testing" ] || nvm_do_install

}