// Copyright (c) E5R Development Team. All rights reserved.
// Licensed under the Apache License, Version 2.0. More license information in LICENSE.txt.

/* global process, __filename, __dirname */

var gulp = require('gulp'),
    del = require('del'),
    fs = require('fs'),
    concat = require('gulp-concat-util'),
    glob = require('glob'),
    stripCode = require('gulp-strip-code'),
    jsconfig = require('./jsconfig.json'),
    pkg = require('./package.json'),
    headerTxt = fs.readFileSync('./header.txt'),
    footerTxt = fs.readFileSync('./footer.txt'),
    bannerTxt = fs.readFileSync('./banner.txt');

var E5R_LIB_NAME = 'e5r-dev.js',
    STRIPCODE_BEGIN = 'DEVCODE-BEGIN',
    STRIPCODE_END = 'DEVCODE-END';

gulp.task('clean', function () {
    return del(['dist/devcom/**/*', 'dist/**/*']);
});

gulp.task('test', function () { });

gulp.task('devcom-registry', function () {
    return glob('devcom/**/*.{js,cmd,ps1,sh}', {
        cwd: 'src'
    }, function (globError, files) {
        if (globError) throw globError;

        try {
            var stat = fs.statSync('dist/devcom');
            if (!stat.isDirectory()) {
                throw 'dist/devcom is not a directory!';
            }
        } catch (_) {
            fs.mkdirSync('dist/devcom');
        }

        files = files.map(file => file.substring('devcom/'.length));

        fs.writeFile('dist/devcom/registry.lock.json', JSON.stringify(files, null, 4), {
            encoding: 'utf8'
        }, function (writeError) {
            if (writeError) throw writeError;
            console.log('registry.lock.json writed!');
        });
    });
});

gulp.task('dist', ['devcom-registry'], function () {
    // DEVCOM
    gulp.src('src/devcom/**/*')
        .pipe(stripCode({
            start_comment: STRIPCODE_BEGIN,
            end_comment: STRIPCODE_END
        }))
        .pipe(gulp.dest('dist/devcom'));

    // DEVTOOL
    gulp.src(
        jsconfig.files.concat([
            // exclude dev files
            '!src/globals.js',
            '!dist/e5r-dev.js',

            // exclude devcom files
            '!src/devcom/**/*'
        ]))
        .pipe(stripCode({
            start_comment: STRIPCODE_BEGIN,
            end_comment: STRIPCODE_END
        }))
        .pipe(concat.header(bannerTxt, { pkg: pkg }))
        .pipe(concat(E5R_LIB_NAME))
        .pipe(concat.header(headerTxt, { pkg: pkg }))
        .pipe(concat.footer(footerTxt, { pkg: pkg }))
        .pipe(gulp.dest('dist'));
});
