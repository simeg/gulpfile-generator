/* eslint-disable */ // TODO: REMOVE

'use strict';

var assert = require('assert');
var fs = require('fs');
var fsMock = require('mock-fs');
var generator = Object.freeze(require('./../source/generator.js'));
require('mocha-sinon');
var utils = require('./testUtils.js');

describe('generator', function() {

    after(function() {
        fsMock.restore();
    });

    // TODO: getDefaultConfig()
    // TODO: getCurrentFileContent()

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
                'cssPreProcessorType': 'none',
                'cssOptions': [],
                'cssDistSource': 'src/styles',
                'cssDistDest': 'dist/styles',
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

        var generateFileWithOptions = function(jsOptions, cssOptions) {
            var config = {
                'devServer': false,
                'jsOptions': jsOptions || [],
                'jsDistSource': 'src/scripts',
                'jsDistDest': 'dist/scripts',
                'cssPreProcessorType': 'none',
                'cssOptions': cssOptions || [],
                'cssDistSource': 'src/styles',
                'cssDistDest': 'dist/styles',
                'outputDependencies': false
            };
            generator.generateFile(config);
        };

        var runTestUsingSingleIndex = function(type, jsObject, cssObject) {
            var object = (Object.keys(jsObject).length > 0 ? jsObject : cssObject),
                option = object.options[object.index],
                code = object.generatedCode[object.index],
                result;

            it(option, function() {
                if (type === 'js') {
                    generateFileWithOptions([option], null);
                } else if (type === 'css') {
                    generateFileWithOptions(null, [option]);
                }
                var currentFileContent = fs.readFileSync('gulpfile.js', 'utf8');

                if (result = (currentFileContent.indexOf(code) === -1))
                    assert.fail(result, true, 'Code not found');

                assert(true, 'Code for: [' + option + '] found');
            });
        };

        // TODO: See if this can be written using runTestUsingSingleIndex()
        var runTestUsingTwoIndexes = function(type, jsObject, cssObject) {
            var object = ((jsObject && Object.keys(jsObject).length > 0) ? jsObject : cssObject),
                firstOption = object.options[object.indexes[0]],
                firstCode = object.generatedCode[object.indexes[0]],
                secondOption = object.options[object.indexes[1]],
                secondCode = object.generatedCode[object.indexes[1]],
                result;

            it(firstOption + ' and ' + secondOption, function() {
                if (type === 'js') {
                    generateFileWithOptions([firstOption, secondOption], null);
                } else if (type === 'css') {
                    generateFileWithOptions(null, [firstOption, secondOption]);
                }
                var currentFileContent = fs.readFileSync('gulpfile.js', 'utf8');

                if (result = (currentFileContent.indexOf(firstCode) === -1))
                    assert.fail(result, true, 'Code not found');

                if (result = (currentFileContent.indexOf(secondCode) === -1))
                    assert.fail(result, true, 'Code not found');

                assert(true, 'Code for: [' + firstOption + ' and ' + secondOption + '] found');
            });
        };

        describe('with default configuration', function() {

            beforeEach(function() {
                generator.generateFile(defaultConfig);
            });

            it('generates default imports', function() {
                var defaultImports = [
                    "var gulp = require('gulp');",
                    "var plumber = require('gulp-plumber');",
                    "var rename = require('gulp-rename');"
                ];
                var currentFileContent = fs.readFileSync('gulpfile.js', 'utf8');
                checkImports(currentFileContent, defaultImports);
            });

            it('generates default variables', function() {
                var defaultVariables = [
                    "var JS_SOURCE = 'src/scripts'",
                    "var JS_DEST = 'dist/scripts'",
                    "var JS_OUTPUT_FILE = 'main.js'",
                    "var CSS_SOURCE = 'src/styles';",
                    "var CSS_DEST = 'dist/styles';"
                ];
                var currentFileContent = fs.readFileSync('gulpfile.js', 'utf8');
                checkVariables(currentFileContent, defaultVariables);
            });

            it('generates default task', function() {
                var taskDeclaration = "gulp.task('default', function() {";
                var nrOfWatchInTask = 1;
                var searchTerm = '.watch(';

                var currentFileContent = fs.readFileSync('gulpfile.js', 'utf8');

                checkUniqueStringOccurrences(currentFileContent, taskDeclaration, nrOfWatchInTask, searchTerm);
            });

            it('generates scripts task', function() {
                var taskDeclaration = "gulp.task('scripts', function() {";
                var nrOfPipelinesInTask = 2;

                var currentFileContent = fs.readFileSync('gulpfile.js', 'utf8');

                var result;
                if (result = (currentFileContent.indexOf(taskDeclaration) === -1))
                    assert.fail(result, true, 'Scripts task not found');

                var index = 0,
                    startingIndex = currentFileContent.indexOf(taskDeclaration);
                for (var i = 0; i < nrOfPipelinesInTask; i++) {
                    index = currentFileContent.indexOf('.pipe(', index ? index : startingIndex);
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
                generator.generateFile(config);
            });

            it('generates correct imports', function() {
                var correctImports = [
                    "var gulp = require('gulp');",
                    "var plumber = require('gulp-plumber');",
                    "var rename = require('gulp-rename');",
                    "var browserSync = require('browser-sync');"
                ];
                var currentFileContent = fs.readFileSync('gulpfile.js', 'utf8');
                checkImports(currentFileContent, correctImports);
            });

            it('generates correct variables', function() {
                var correctVariables = [
                    "var JS_SOURCE = 'src/scripts'",
                    "var JS_DEST = 'dist/scripts'",
                    "var JS_OUTPUT_FILE = 'main.js'",
                    "var SERVER_BASE_DIR = './';",
                    "var WATCH_FILE_EXTENSIONS = ['*.html'];"
                ];
                var currentFileContent = fs.readFileSync('gulpfile.js', 'utf8');
                checkVariables(currentFileContent, correctVariables);
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

                var currentFileContent = fs.readFileSync('gulpfile.js', 'utf8');
                checkStringOccurrences(currentFileContent, taskCodeLines);
            });

            it('generates correct default task', function() {
                var taskDeclaration = "gulp.task('default', ['browser-sync'], function() {";
                var nrOfWatchInTask = 2;
                var searchTerm = '.watch(';

                var currentFileContent = fs.readFileSync('gulpfile.js', 'utf8');

                checkUniqueStringOccurrences(currentFileContent, taskDeclaration, nrOfWatchInTask, searchTerm);
            });
        });

        describe('with JavaScript option(s)', function() {
            beforeEach(function() {
                fsMock({
                    'gulpfile.js': ''
                });
            });

            var type = 'js';

            // These two arrays match against index, so jsOptions[0]
            // generates code that's in generatedCode[0] and so on
            var jsOptions = [
                "coffee",
                "jshint",
                "concat",
                "babel",
                "uglify",
                "browserSync"
            ];

            var generatedCode = [
                ".pipe(coffee({bare: true}))",
                ".pipe(jshint())\n" +
                "    .pipe(jshint.reporter('default'))",
                ".pipe(concat(JS_OUTPUT_FILE))",
                ".pipe(babel())",
                ".pipe(gulp.dest(JS_DEST + '/'))\n" +
                "    .pipe(rename({suffix: '.min'}))\n" +
                "    .pipe(uglify())",
                ".pipe(browserSync.reload({stream:true}))"
            ];

            describe('using only one option', function() {
                var jsObject = {
                        index: null,
                        options: jsOptions,
                        generatedCode: generatedCode
                    };
                for (var i = 0; i < jsOptions.length; i++) {
                    jsObject.index = i;
                    runTestUsingSingleIndex(type, jsObject);
                }
            });

            describe('using combination of options', function() {
                var jsObject = {
                        indexes: null,
                        options: jsOptions,
                        generatedCode: generatedCode
                    };
                for (var i = 0; i < jsOptions.length; i++) {
                    for (var j = 0; j < jsOptions.length; j++) {
                        if (j === i)
                            continue;

                        jsObject.indexes = [i, j];
                        runTestUsingTwoIndexes(type, jsObject, null);
                    }
                }
            });
        });

        describe('with CSS option(s)', function() {
            beforeEach(function() {
                fsMock({
                    'gulpfile.js': ''
                });
            });

            var type = 'css';

            // These two arrays match against index, so jsOptions[0]
            // generates code that's in generatedCode[0] and so on
            var cssOptions = [
                "autoprefixer",
                "minifycss",
                "browserSync"
            ];

            var generatedCode = [
                ".pipe(autoprefixer('last 2 versions'))",
                ".pipe(gulp.dest(CSS_DEST + '/'))\n" +
                "    .pipe(rename({suffix: '.min'}))\n" +
                "    .pipe(minifycss())",
                ".pipe(browserSync.reload({stream:true}))"
            ];

            describe('using only one option', function() {
                var cssObject = {
                        index: null,
                        options: cssOptions,
                        generatedCode: generatedCode
                    };
                for (var i = 0; i < cssOptions.length; i++) {
                    cssObject.index = i;
                    runTestUsingSingleIndex(type, cssObject);
                }
            });

            describe('using combination of options', function() {
                var cssObject = {
                        indexes: null,
                        options: cssOptions,
                        generatedCode: generatedCode
                    };
                for (var i = 0; i < cssOptions.length; i++) {
                    for (var j = 0; j < cssOptions.length; j++) {
                        if (j === i)
                            continue;

                        cssObject.indexes = [i, j];
                        runTestUsingTwoIndexes(type, null, cssObject);
                    }
                }
            });

            describe('with pre processor types', function() {
                var generateFileWithCssPreProcessorType = function(type) {
                    var config = {
                        'devServer': false,
                        'jsOptions': [],
                        'jsDistSource': 'src/scripts',
                        'jsDistDest': 'dist/scripts',
                        'cssPreProcessorType': type,
                        'cssOptions': [],
                        'cssDistSource': 'src/styles',
                        'cssDistDest': 'dist/styles',
                        'outputDependencies': false
                    };
                    generator.generateFile(config);
                };

                var runCssPreProcessorTypeTest = function(type, codeScope) {
                    var currentFileContent, result;
                    it(type, function() {
                        generateFileWithCssPreProcessorType(type);

                        currentFileContent = fs.readFileSync('gulpfile.js', 'utf8');

                        if (result = (currentFileContent.indexOf(codeScope) === -1))
                            assert.fail(result, true, 'Code not found');

                        assert(true, 'Code for: [' + type + '] found');
                    });
                };

                var preProcessorTypes = [
                    'less',
                    'sass',
                    'stylus'
                ];

                var generatedCode = [
                    ".pipe(less())",
                    ".pipe(sass())",
                    ".pipe(stylus())"
                ];

                for (var i = 0; i < preProcessorTypes.length; i++) {
                    var type = preProcessorTypes[i],
                        codeScope = generatedCode[i];
                    
                    runCssPreProcessorTypeTest(type, codeScope);
                }

                it('none', function() {
                    var type = 'none',
                        result = false,
                        currentFileContent;
                    generateFileWithCssPreProcessorType(type);
                    
                    // Check to see that there's no sign of any pre-processor
                    for (var i = 0; i < generatedCode.length; i++) {
                        var codeSnippet = generatedCode[i];
                        currentFileContent = fs.readFileSync('gulpfile.js', 'utf8');
                        result = (currentFileContent.indexOf(codeSnippet) === -1);
                        if (!result) {
                            assert.fail(result, false, '[' + codeSnippet + '] is in the code, ' +
                                'it should not be');
                        }
                    }

                    assert.ok(true);
                });

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
                'cssPreProcessorType': 'none',
                'cssOptions': [],
                'cssDistSource': 'src/styles',
                'cssDistDest': 'dist/styles',
                'outputDependencies': true
            });
            generator.generateFile(emptyDependenciesConfig);
            var actual = fs.readFileSync('install-dependencies.txt', 'utf8');
            var expect = 'npm install --save-dev gulp gulp-plumber gulp-rename';
            assert.equal(actual, expect);
        });

        it('containing selected dependencies', function() {
            var installDependenciesConfig = Object.freeze({
                'devServer': true,
                'jsOptions': ['uglify', 'babel', 'jshint'],
                'jsDistSource': 'irrelevantValue',
                'jsDistDest': 'irrelevantValue',
                'cssPreProcessorType': 'none',
                'cssOptions': [],
                'cssDistSource': 'src/styles',
                'cssDistDest': 'dist/styles',
                'outputDependencies': true
            });
            generator.generateFile(installDependenciesConfig);
            var actual = fs.readFileSync('install-dependencies.txt', 'utf8');
            var expect = 'npm install --save-dev gulp gulp-plumber gulp-rename gulp-jshint gulp-babel gulp-uglify browser-sync';
            assert.equal(actual, expect);
        });
    });

    describe('logs', function() {
        beforeEach(function() {
            this.sinon.stub(console, 'warn');

            fsMock({
                'gulpfile.js': ''
            });
        });

        it('on incorrect JS option', function() {
            var config = Object.freeze({
                'devServer': false,
                'jsOptions': ['incorrectOption'],
                'jsDistSource': 'src/scripts',
                'jsDistDest': 'dist/scripts',
                'cssPreProcessorType': 'none',
                'cssOptions': [],
                'cssDistSource': 'src/styles',
                'cssDistDest': 'dist/styles',
                'outputDependencies': false
            });
            generator.generateFile(config);

            assert(console.warn.calledOnce);
            assert(console.warn.calledWith('Option [incorrectOption] is not a valid JS option'));
        });

        it('on incorrect CSS option', function() {
            var config = Object.freeze({
                'devServer': false,
                'jsOptions': [],
                'jsDistSource': 'src/scripts',
                'jsDistDest': 'dist/scripts',
                'cssPreProcessorType': 'none',
                'cssOptions': ['incorrectOption'],
                'cssDistSource': 'src/styles',
                'cssDistDest': 'dist/styles',
                'outputDependencies': false
            });
            generator.generateFile(config);

            assert(console.warn.calledOnce);
            assert(console.warn.calledWith('Option [incorrectOption] is not a valid CSS option'));
        });
    });

    describe('sorts', function() {
        beforeEach(function() {
            fsMock({
                'gulpfile.js': ''
            });
        });

        it('JS pipeline tasks', function() {
            var jsOptions =
                utils.shuffleArray(['jshint', 'concat', 'dest',
                    'babel', 'uglify', 'browserSync', 'coffee']);
            var config = {
                'devServer': false,
                'jsOptions': jsOptions,
                'jsDistSource': 'src/scripts',
                'jsDistDest': 'dist/scripts',
                'cssPreProcessorType': 'none',
                'cssOptions': [],
                'cssDistSource': 'src/styles',
                'cssDistDest': 'dist/styles',
                'outputDependencies': false
            };
            generator.generateFile(config);
            
            var sortOrder = 
                Object.freeze(require('./../source/generator.config.json').sortOrders.js);

            var prevIndex, currIndex,
                currentFileContent = fs.readFileSync('gulpfile.js', 'utf8'),
                startIndex = currentFileContent.indexOf("gulp.task('scripts'"),
                limitIndex = currentFileContent.indexOf("});", startIndex);
            for (var i = 0; i < sortOrder.length; i++) {
                var moduleName = sortOrder[i];
                var moduleCode = generator.getJsOptionCode(moduleName);
                currIndex = currentFileContent.indexOf(moduleCode, startIndex);

                if (i === 0) {
                    prevIndex = currIndex;
                    continue;
                }

                if (currIndex >= limitIndex)
                    assert.fail(null, null,
                        'Limit index reached. JS option [' + moduleName + '] not found ' +
                        'within valid scope');

                if (currIndex < prevIndex) {
                    assert.fail(null, null, 'JS option [' + moduleName + '] is not sorted');
                } else if (currIndex > prevIndex && currIndex < limitIndex) {
                    prevIndex = currIndex;
                }
            }

            assert.ok(true, 'JS options are sorted');
        });

        it('CSS pipeline tasks', function() {
            var cssOptions =
                utils.shuffleArray(['less', 'stylus', 'autoprefixer',
                    'minifycss', 'sass', 'browserSync']);
            var config = {
                'devServer': false,
                'jsOptions': [],
                'jsDistSource': 'src/scripts',
                'jsDistDest': 'dist/scripts',
                'cssPreProcessorType': 'none',
                'cssOptions': cssOptions,
                'cssDistSource': 'src/styles',
                'cssDistDest': 'dist/styles',
                'outputDependencies': false
            };
            generator.generateFile(config);

            var sortOrder =
                Object.freeze(require('./../source/generator.config.json').sortOrders.css);

            var prevIndex, currIndex,
                currentFileContent = fs.readFileSync('gulpfile.js', 'utf8'),
                startIndex = currentFileContent.indexOf("gulp.task('styles'"),
                limitIndex = currentFileContent.indexOf("});", startIndex);
            for (var i = 0; i < sortOrder.length; i++) {
                var moduleName = sortOrder[i];
                var moduleCode = generator.getCssOptionCode(moduleName);
                currIndex = currentFileContent.indexOf(moduleCode, startIndex);

                if (i === 0) {
                    prevIndex = currIndex;
                    continue;
                }

                if (currIndex >= limitIndex)
                    assert.fail(null, null,
                        'Limit index reached. CSS option [' + moduleName + '] not found ' +
                        'within valid scope');

                if (currIndex < prevIndex) {
                    assert.fail(null, null, 'CSS option [' + moduleName + '] is not sorted');
                } else if (currIndex > prevIndex && currIndex < limitIndex) {
                    prevIndex = currIndex;
                }
            }

            assert.ok(true, 'CSS options are sorted');
        });
    });
});
