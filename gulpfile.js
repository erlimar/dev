// Copyright (c) E5R Development Team. All rights reserved.
// Licensed under the Apache License, Version 2.0. More license information in LICENSE.txt.

/* global process, __filename, __dirname */

var gulp = require('gulp'),
    del = require('del'),
    fs = require('fs'),
    os = require('os'),
    path = require('path'),
    concat = require('gulp-concat-util'),
    jsconfig = require('./jsconfig.json'),
    pkg = require('./package.json'),
    headerTxt = fs.readFileSync('./header.txt'),
    bannerTxt = fs.readFileSync('./banner.txt');

var E5R_DIR = '.dev';
var E5R_INSTALL_DIR = path.join(os.homedir(), E5R_DIR, 'lib', 'node_modules');
var E5R_LIB_NAME = 'e5r-dev.js';

gulp.task('clean', function () {
    return del('dist/*');
});

gulp.task('dist', ['clean'], function () {
    gulp.src(jsconfig.files.concat(['!src/globals.js', '!dist/e5r-dev.js']))
        .pipe(concat.header(bannerTxt, { pkg: pkg }))
        .pipe(concat(E5R_LIB_NAME))
        .pipe(concat.header(headerTxt, { pkg: pkg }))
        .pipe(gulp.dest('dist'));
});

gulp.task('install', [], function() {
    gulp.src(jsconfig.files.concat(['!src/globals.js', '!dist/e5r-dev.js']))
        .pipe(concat.header(bannerTxt, { pkg: pkg }))
        .pipe(concat(E5R_LIB_NAME))
        .pipe(concat.header(headerTxt, { pkg: pkg }))
        .pipe(gulp.dest(E5R_INSTALL_DIR));
});
