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
if ! _dev_has "uname"; then
    _dev_show_error "Unix uname is required"
    exit 1
fi

if [ ! `_dev_os` = "linux" ] && [ ! `_dev_os` = "darwin" ]; then
    _dev_show_error "OS "`_dev_os`" is not supported"
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

git_branch="develop"
dev_home="${HOME}/.dev"
dev_tools="${dev_home}/tools"
dev_bin="${dev_home}/bin"

# # HACK: All libraries are installed in "/lib" or "/lib/cmd". So when these libraries
# #       use "require('e5r-dev')" will always find the file "dist/e5r-dev.js" as a module,
# #       as is the standard way of resolving NodeJS dependencies.
dev_lib="${dev_home}/lib/node_modules"

bin_jsengine="${dev_tools}/jsengine"
bin_jsdev="${dev_lib}/e5r-dev.js"
post_file="${dev_tools}/dev-envvars.sh"
node_version="7.4.0"
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

    # @todo: Apply-Proxy
    echo "Downloading ${origin}..."

    if _dev_has "curl"; then
        curl --insecure --silent -o "${destination}" "${origin}"
        return $?
    elif _dev_has "wget"; then
        wget --no-check-certificate --quiet -O "${destination}" "${origin}"
        return $?
    elif _dev_has "fetch"; then
        fetch --no-verify-peer --quiet -o "${destination}" "${origin}"
        return $?
    else
        _dev_show_error "Tool curl, wget or fetch undetected."
        return 1
    fi
}

_dev_clear()
{
    if [ -d ${dev_home} ]; then
        rm -rf "${dev_home}"
    fi

    if [ -d ${temp_dir} ]; then
        rm -rf "${temp_dir}"
    fi
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
    if ! _dev_get_webfile "${node_pkg_url}" "${temp_dir}/${node_pkg_file}"; then
        _dev_show_error "On download NODEJS binary package"
        return 1
    fi

    # Extract JSENGINE
    if ! tar -xf "${temp_dir}/${node_pkg_file}" -C "${temp_dir_unziped}"; then
        _dev_show_error "On extract JSENGINE"
        return 1
    fi

    cp "${temp_dir_unziped}/${node_pkg}/bin/node" "${bin_jsengine}"
    chmod a+=x "${bin_jsengine}"
    rm -rf "${temp_dir}"

    # Download "e5r-dev.js" script
    if ! _dev_get_webfile "${jsdev_url}" "${bin_jsdev}"; then
        _dev_show_error "On download e5r-dev.js script"
        return 1
    fi

    # Invoke $> node e5r-dev.js setup
    if ! ${bin_jsengine} "${bin_jsdev}" setup --shell=sh; then
        _dev_show_error "On executing e5r-dev.js setup"
        return 1
    fi

    _dev_add_dev_to_path
}

_dev_add_dev_to_path()
{
    if [ -f ${post_file} ]; then
        if _dev_has "source"; then
            source ${post_file}
        fi
        cat ${post_file} >> "${HOME}/.bash_profile"
    fi
}

_dev_start()
{
    local found=false

    if _dev_find_installation; then
        found=true
    fi

    if "${found}" = true; then
        echo "Cleaning old installation..."
        _dev_clear
    fi

    if ! _dev_install; then
        _dev_clear
    fi

    return 0
}

_dev_start

exit $?

}
