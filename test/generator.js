/* eslint-disable */ // TODO: REMOVE

'use strict';

var assert = require('assert');
var fs = require('fs');
var generator = Object.freeze(require('./../source/generator.js'));
var fsMock = require('mock-fs');

describe('generator', function() {

    after(function() {
        fsMock.restore();
    });

    describe('generates a gulpfile.js', function() {

        var defaultConfig;
        beforeEach(function() {
            fsMock({
                'gulpfile.js': ''
            });

            defaultConfig = Object.seal({
                'devServer': false,
                'jsOptions': [],
                'jsDistSource': 'src/scripts',
                'jsDistDest': 'dist/scripts',
                'outputDependencies': false
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

        describe('with default configuration', function() {

            beforeEach(function() {
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

        describe('with development server enabled and rest of config default', function() {

            beforeEach(function() {
                var config = defaultConfig;
                config.devServer = true;
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

        describe('with JavaScript option(s)', function() {
            beforeEach(function() {
                fsMock({
                    'gulpfile.js': ''
                });
            });

            const generateFile = function(jsOptions) {
                const config = {
                    'devServer': false,
                    'jsOptions': jsOptions,
                    'jsDistSource': 'src/scripts',
                    'jsDistDest': 'dist/scripts',
                    'outputDependencies': false
                };
                generator(config);
            };

            const runTestUsingSingleIndex = function(index) {
                var jsOption = jsOptions[index],
                    code = generatedCode[index],
                    result;

                it(jsOption, function() {
                    generateFile([jsOption]);
                    var stateAfter = fs.readFileSync('gulpfile.js', 'utf8');

                    if (result = (stateAfter.indexOf(code) === -1))
                        assert.fail(result, true, 'Code not found');

                    assert(true, 'Code for: [' + jsOption + '] found');
                });
            };

            // TODO: See if this can be
            const runTestUsingTwoIndexes = function(indexes) {
                var jsOptionOne = jsOptions[indexes[0]],
                    codeOne = generatedCode[indexes[0]],
                    jsOptionTwo = jsOptions[indexes[1]],
                    codeTwo = generatedCode[indexes[1]],
                    result;

                it(jsOptionOne + ' and ' + jsOptionTwo, function() {
                    generateFile([jsOptionOne, jsOptionTwo]);
                    var stateAfter = fs.readFileSync('gulpfile.js', 'utf8');

                    if (result = (stateAfter.indexOf(codeOne) === -1))
                        assert.fail(result, true, 'Code not found');

                    if (result = (stateAfter.indexOf(codeTwo) === -1))
                        assert.fail(result, true, 'Code not found');

                    assert(true, 'Code for: [' + jsOptionOne + ' and ' + jsOptionTwo + '] found');
                });
            };

            // These two arrays match against index, so jsOptions[0]
            // generates code that's in generatedCode[0] and so on
            const jsOptions = [
                "coffee",
                "jshint",
                "concat",
                "babel",
                "uglify"
            ];

            const generatedCode = [
                ".pipe(coffee({bare: true}))",
                ".pipe(jshint())\n" +
                "    .pipe(jshint.reporter('default'))",
                ".pipe(concat(OUTPUT_FILE))",
                ".pipe(babel())",
                ".pipe(gulp.dest(DEST + '/'))\n" +
                "    .pipe(rename({suffix: '.min'}))\n" +
                "    .pipe(uglify())"
            ];

            describe('using only one option', function() {
                for (var i = 0; i < jsOptions.length; i++) {
                    runTestUsingSingleIndex(i);
                }
            });

            describe('using combination of options', function() {
                for (var i = 0; i < jsOptions.length; i++) {
                    for (var j = 0; j < jsOptions.length; j++) {
                        if (j === i)
                            continue;

                        runTestUsingTwoIndexes([i, j]);
                    }
                }
            });
        });
    });

    describe('generates a install-dependencies.txt', function() {
        beforeEach(function() {
            fsMock({
                'install-dependencies.txt': ''
            });
        });

        it('with no dependencies selected', function() {
            var emptyDependenciesConfig = Object.freeze({
                'devServer': false,
                'jsOptions': [],
                'jsDistSource': 'irrelevantValue',
                'jsDistDest': 'irrelevantValue',
                'outputDependencies': true
            });
            generator(emptyDependenciesConfig);
            var actual = fs.readFileSync('install-dependencies.txt', 'utf8');
            var expect = 'npm install --save-dev ';
            assert.equal(actual, expect);
        });

        it('containing selected dependencies', function() {
            var installDependenciesConfig = Object.freeze({
                'devServer': true,
                'jsOptions': ['uglify', 'babel', 'jshint'],
                'jsDistSource': 'irrelevantValue',
                'jsDistDest': 'irrelevantValue',
                'outputDependencies': true
            });
            generator(installDependenciesConfig);
            var actual = fs.readFileSync('install-dependencies.txt', 'utf8');
            var expect = 'npm install --save-dev gulp-jshint gulp-babel gulp-uglify browser-sync';
            assert.equal(actual, expect);
        });
    });

    describe('is sorting properly', function() {
        // TODO: how?
    });
});
