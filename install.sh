#!/bin/sh

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

# Default params
branch="develop"
force=false
verbose=false

_dev_has() {
    type "${1}" > /dev/null 2>&1
}

_dev_os()
{
    local uname=`uname`
    if [ ${uname} = "Darwin" ]; then
        echo "darwin"
    elif [ ${uname} = "FreeBSD" ]; then
        echo "freebsd"
    elif [ ${uname} = "Linux" ]; then
        echo "linux"
    else
        echo "other"
    fi
}

_dev_show_error()
{
    echo "Error: ${1}"
}

# -------------------
# Check prerequisites
# -------------------
if [ ! `_dev_os` = "linux" ]; then
    _dev_show_error "OS "`_dev_os`" is not supported"
    exit 1
fi

if ! _dev_has "basename"; then
    _dev_show_error "Unix basename is required"
    exit 1
fi

if ! _dev_has "readlink"; then
    _dev_show_error "Unix readlink is required"
    exit 1
fi

if ! _dev_has "mktemp"; then
    _dev_show_error "Unix mktemp is required"
    exit 1
fi

if ! _dev_has "tar"; then
    _dev_show_error "Unix tar is required"
    exit 1
fi

if ! _dev_has "curl" && ! _dev_has "wget" && ! _dev_has "fetch"; then
    _dev_show_error "Tool curl, wget or fetch is required"
    exit 1
fi

arch=`uname -m`

if [ ${arch} = 'x64' ]; then
    arch='x64'
elif [ ${arch} = 'x86_64' ]; then
    arch='x64'
else
    arch='x86'
fi

script_name=`basename ${0}`
script_file=`readlink -f "${0}"`
git_branch="develop"
dev_home="${HOME}/.dev"
dev_tools="${dev_home}/tools"

# # HACK: All libraries are installed in "/lib" or "/lib/cmd". So when these libraries
# #       use "require('dev')" will always find the file "dist/dev.js" as a module,
# #       as is the standard way of resolving NodeJS dependencies.
dev_lib="${dev_home}/lib/node_modules"

bin_jsengine="${dev_tools}/jsengine"
bin_jsdev="${dev_lib}/e5r-dev.js"
post_file="${dev_tools}/dev-envvars.sh"
node_version="5.9.0"
node_pkg="node-v${node_version}-"`_dev_os`"-${arch}"
node_pkg_file="${node_pkg}.tar.gz"
node_pkg_url="https://nodejs.org/dist/v${node_version}/${node_pkg_file}"
jsdev_url="https://raw.githubusercontent.com/e5r/dev/${git_branch}/dist/e5r-dev.js"
temp_dir=`mktemp -duq`".e5rinstall"
temp_dir_unziped=${temp_dir}"/unziped"

_dev_find_installation()
{
    if [ ! -d ${dev_home} ]; then
        return 1
    fi

    return 0
}

_dev_get_webfile() {
    local origin="${1}"
    local destination="${2}"

    # TODO: Apply-Proxy
    echo "Downloading ${origin}..."

    if _dev_has "curl"; then
        curl --insecure --silent -o "${destination}" "${origin}"
    elif _dev_has "wget"; then
        wget --no-check-certificate --quiet -O "${destination}" "${origin}"
    elif _dev_has "fetch"; then
        fetch --no-verify-peer --quiet -o "${destination}" "${origin}"
    else
        _dev_show_error "Tool curl, wget or fetch undetected."
    fi
}

_dev_clear()
{
    echo "Cleaning old installation..."
    rm -rf "${dev_home}"
}

_dev_install() {
    echo "Preparing E5R Tools for Development Team Installation..."

    # Make directory structure
    mkdir -p "${dev_tools}"
    mkdir -p "${dev_lib}"

    # Make temporary directory structure
    mkdir -p "${temp_dir}"
    mkdir -p "${temp_dir_unziped}"

    # Download NODEJS binary package
    _dev_get_webfile "${node_pkg_url}" "${temp_dir}/${node_pkg_file}"

    # Extract jsengine
    tar -xf "${temp_dir}/${node_pkg_file}" -C "${temp_dir_unziped}"
    cp "${temp_dir_unziped}/${node_pkg}/bin/node" "${bin_jsengine}"
    chmod a+=x "${bin_jsengine}"
    rm -rf "${temp_dir}"

    # Download "e5r-dev.js" script
    _dev_get_webfile "${jsdev_url}" "${bin_jsdev}"

    # Invoke $> node e5r-dev.js setup
    ${bin_jsengine} "${bin_jsdev}" setup --shell=sh
}

_dev_start()
{
    local found=false

    if _dev_find_installation; then
        found=true
    fi

    if "${found}" = true; then
        _dev_clear
    fi

    _dev_install

    # Update environment from postfile
    if [ -f "${post_file}" ]; then
        echo "log: ----- POST FILE [{$post_file}] -----"
        cat ${post_file}
        echo ""
        echo "log: ---------------------------------------------------"
  
        chmod 0755 ${post_file}
        ${post_file}
        rm -f "$post_file"
    fi
    
    
}

# Read params
while [ ${#} > 0 ]; do
    key=${1}
    
    case ${key} in
        -f|--force)
            force=true
            ;;
        -v|--verbose)
            verbose=true
            ;;
        -b|--branch)
            if [ "${2}" != "" ]; then
                branch=${2}
            fi
            ;;
        *)
            ;;
    esac
        
    if [ "${#}" != "0" ]; then
        shift
    else
        break
    fi
done

# TODO: Try catch and by-pass exit code
_dev_start

exit $?

}