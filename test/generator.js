/* eslint-disable */ // TODO: REMOVE

'use strict';

var assert = require('assert');
var fsMock = require('mock-fs');
var fs = require('fs');
var generator = Object.freeze(require('./../source/generator.js'));

describe('generator', function() {
    beforeEach(function() {
        fsMock({
            'gulpfile.js': ''
        });
    });

    var checkUniqueStringOccurrences = function(haystack, startingPoint, count, string) {
        var index = 0,
            startingIndex = haystack.indexOf(startingPoint);
        for (var i = 0; i < count; i++) {
            index = haystack.indexOf(string, index ? index : startingIndex);
            if (index === -1) {
                assert.fail(false, true, string + ' is missing in haystack');
            } else {
                // Increment to not find same string again
                index++;
            }
        }

        assert(true, 'All strings found');
    };

    var checkStringOccurrences = function(haystack, needleArray) {
        var string, result;
        for (var i = 0; i < needleArray.length; i++) {
            string = needleArray[i];
            if (result = (haystack.indexOf(string) === -1))
                assert.fail(result, true, 'String occurrence not found');
        }

        assert(true, 'All string occurrences found');
    };

    var checkImports = function(gulpFile, imports) {
        checkStringOccurrences(gulpFile, imports);
    };

    var checkVariables = function(gulpFile, variables) {
        checkStringOccurrences(gulpFile, variables);
    };

    it('generates non-empty file', function() {
        var defaultConfig = {
            'devServer': false,
            'jsOptions': [],
            'jsDistSource': 'src/scripts',
            'jsDistDest': 'dist/scripts'
        };

        var stateBefore = fs.readFileSync('gulpfile.js', 'utf8');
        generator(defaultConfig);
        var stateAfter = fs.readFileSync('gulpfile.js', 'utf8');
        assert.notEqual(stateBefore, stateAfter);
    });

    describe('with default configuration', function() {

        beforeEach(function() {
            var defaultConfig = {
                'devServer': false,
                'jsOptions': [],
                'jsDistSource': 'src/scripts',
                'jsDistDest': 'dist/scripts'
            };
            generator(defaultConfig);
        });

        it('generates default imports', function() {
            var defaultImports = [
                "var gulp = require('gulp'),",
                "plumber = require('gulp-plumber'),",
                "rename = require('gulp-rename');"
            ];
            var stateAfter = fs.readFileSync('gulpfile.js', 'utf8');
            checkImports(stateAfter, defaultImports);
        });

        it('generates default variables', function() {
            var defaultVariables = [
                "var SOURCE = 'src/scripts'",
                "var DEST = 'dist/scripts'",
                "var OUTPUT_FILE = 'main.js'"
            ];
            var stateAfter = fs.readFileSync('gulpfile.js', 'utf8');
            checkVariables(stateAfter, defaultVariables);
        });

        it('generates default task', function() {
            var taskDeclaration = "gulp.task('default', function() {";
            var nrOfWatchInTask = 1;
            var searchTerm = '.watch(';

            var stateAfter = fs.readFileSync('gulpfile.js', 'utf8');

            checkUniqueStringOccurrences(stateAfter, taskDeclaration, nrOfWatchInTask, searchTerm);
        });

        it('generates scripts task', function() {
            var taskDeclaration = "gulp.task('scripts', function() {";
            var nrOfPipelinesInTask = 2;

            var stateAfter = fs.readFileSync('gulpfile.js', 'utf8');

            var result;
            if (result = (stateAfter.indexOf(taskDeclaration) === -1))
                assert.fail(result, true, 'Scripts task not found');

            var index = 0,
                startingIndex = stateAfter.indexOf(taskDeclaration);
            for (var i = 0; i < nrOfPipelinesInTask; i++) {
                index = stateAfter.indexOf('.pipe(', index ? index : startingIndex);
                if (index === -1) {
                    assert.fail(false, true, 'Pipeline missing');
                } else {
                    // Increment to not find same pipeline string again
                    index++;
                }
            }

            assert(true, 'Scripts task looks ok');
        });
    });

    describe('with development server enabled and rest default', function() {

        beforeEach(function() {
            var config = {
                'devServer': true,
                'jsOptions': [],
                'jsDistSource': 'src/scripts',
                'jsDistDest': 'dist/scripts'
            };
            generator(config);
        });

        it('generates correct imports', function() {
            var correctImports = [
                "var gulp = require('gulp'),",
                "plumber = require('gulp-plumber'),",
                "rename = require('gulp-rename');",
                "var browserSync = require('browser-sync');"
            ];
            var stateAfter = fs.readFileSync('gulpfile.js', 'utf8');
            checkImports(stateAfter, correctImports);
        });

        it('generates correct variables', function() {
            var correctVariables = [
                "var SOURCE = 'src/scripts'",
                "var DEST = 'dist/scripts'",
                "var OUTPUT_FILE = 'main.js'",
                "var SERVER_BASE_DIR = './';",
                "var WATCH_FILE_EXTENSIONS = ['*.html'];"
            ];
            var stateAfter = fs.readFileSync('gulpfile.js', 'utf8');
            checkVariables(stateAfter, correctVariables);
        });

        it('generates browser-sync task', function() {
            var taskCodeLines = [
                "gulp.task('browser-sync', function() {",
                "browserSync({",
                "server: {",
                "baseDir: SERVER_BASE_DIR",
                "}",
                "});",
                "});"
            ];

            var stateAfter = fs.readFileSync('gulpfile.js', 'utf8');
            checkStringOccurrences(stateAfter, taskCodeLines);
        });

        it('generates correct default task', function() {
            var taskDeclaration = "gulp.task('default', ['browser-sync'], function() {";
            var nrOfWatchInTask = 2;
            var searchTerm = '.watch(';

            var stateAfter = fs.readFileSync('gulpfile.js', 'utf8');

            checkUniqueStringOccurrences(stateAfter, taskDeclaration, nrOfWatchInTask, searchTerm);
        });
    });

    describe('with JavaScript options', function() {
        // TODO
    });
});
