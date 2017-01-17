// Copyright (c) E5R Development Team. All rights reserved.
// Licensed under the Apache License, Version 2.0. More license information in LICENSE.txt.

function expandsToGlobal(obj) {
    for (let p in obj) global[p] = obj[p]
}

module.exports.requireGlobal = (m) => {
    if (!Array.isArray(m)) m = [m]

    m.map(moduleName =>
        expandsToGlobal(require('../src/' + moduleName)))

    return module.exports
}

module.exports.ensureNode = () => {
    // NodeJS >= 7.0.0 is required
    if (process.versions.node.split('.')[0] < '7') {
        throw new Error('NodeJS >= 7.0.0 is required!')
    }

    return module.exports
}