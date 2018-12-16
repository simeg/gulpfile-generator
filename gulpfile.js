'use strict';

var gulp = require('gulp');
var jsonlint = require('gulp-jsonlint');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var plumber = require('gulp-plumber');

gulp.task('set-test-env', function(cb) {
    process.env.NODE_ENV = 'test';
    cb();
});

gulp.task('lint-json', ['set-test-env'], function(cb) {
    gulp.src(['**/*.json', '!./node_modules/**/*.json'])
        .pipe(jsonlint())
        .pipe(jsonlint.reporter());
    cb();
});

gulp.task('test', ['set-test-env'], function(cb) {
    var mochaErr;

    gulp.src('test/**/*.js')
        .pipe(plumber())
        .pipe(mocha({reporter: 'spec'}))
        .on('error', function(err) {
            mochaErr = err;
        })
        .pipe(istanbul.writeReports())
        .on('end', function() {
            cb(mochaErr);
        });
});

gulp.task('default', ['set-test-env', 'lint-json', 'test']);
