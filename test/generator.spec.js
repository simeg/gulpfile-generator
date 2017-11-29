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

    var getEmptyConfig = function() {
        return Object.seal({
            'devServer': false,
            'jsOptions': [],
            'jsDistSource': 'src/javascript',
            'jsDistDest': 'dist/javascript',
            'cssPreProcessorType': 'none',
            'cssOptions': [],
            'cssDistSource': 'src/css',
            'cssDistDest': 'dist/css',
            'otherOptions': [],
            'imageDistSource': 'src/images',
            'imageDistDest': 'dist/images',
            'outputDependencies': false
        });
    };

    var getConfigWithOptions = function() {
        return Object.seal({
            'devServer': false,
            'jsOptions': ['concat'],
            'jsDistSource': 'src/javascript',
            'jsDistDest': 'dist/javascript',
            'cssPreProcessorType': 'none',
            'cssOptions': ['autoprefixer'],
            'cssDistSource': 'src/css',
            'cssDistDest': 'dist/css',
            'otherOptions': ['minifyImage'],
            'imageDistSource': 'src/images',
            'imageDistDest': 'dist/images',
            'outputDependencies': false
        });
    };

    var getConfigWithAllOptions = function() {
        return Object.seal({
            'devServer': true,
            'jsOptions': [
                "coffee",
                "jshint",
                "concat",
                "babel",
                "uglify",
                "browserSync"
            ],
            'jsDistSource': 'src/javascript',
            'jsDistDest': 'dist/javascript',
            'cssPreProcessorType': 'sass',
            'cssOptions': [
                "autoprefixer",
                "minifyCss",
                "browserSync",
                "cssLint"
            ],
            'cssDistSource': 'src/css',
            'cssDistDest': 'dist/css',
            'otherOptions': [
                "minifyImage",
                "cache"
            ],
            'imageDistSource': 'src/images',
            'imageDistDest': 'dist/images',
            'outputDependencies': false
        });
    };

    var getCurrentFileContent = function() {
        return fs.readFileSync('gulpfile.js', 'utf8');
    };

    describe('generates a gulpfile.js', function() {

        var configWithOptions;
        beforeEach(function() {
            fsMock({
                'gulpfile.js': ''
            });

            configWithOptions = getConfigWithOptions();
        });

        var assertUniqueStringOccurrences = function(haystack, strStartingPoint, count, string) {
            var index = 0,
                startingIndex = haystack.indexOf(strStartingPoint);
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

        var assertStringOccurrences = function(haystack, needleArray) {
            var string, result;
            for (var i = 0; i < needleArray.length; i++) {
                string = needleArray[i];
                if (result = (haystack.indexOf(string) === -1))
                    assert.fail(result, true, string + ' occurrence not found');
            }

            assert(true, 'All string occurrences found');
        };

        var assertImports = function(gulpFile, imports) {
            assertStringOccurrences(gulpFile, imports);
        };

        var assertUniqueImports = function(gulpFile) {
            var regex = /\w{3} \w+\s?=\s?require\(\'?.+\'\);/g;
            var AllImports = gulpFile.match(regex);
            var UniqueImports = AllImports.filter(function(item, index) {
                return AllImports.indexOf(item) === index;
            });
            var isUniqe = AllImports.length === UniqueImports.length;
            if(isUniqe) {
                assert(true, 'All imports are unique');
            }
            else {
                assert.fail(isUniqe, true, 'Imports are not unique');
            }
        };

        var assertVariables = function(gulpFile, variables) {
            assertStringOccurrences(gulpFile, variables);
        };

        var generateFileWithOptions = function(jsOptions, cssOptions, otherOptions) {
            var config = getEmptyConfig();
            config.jsOptions = jsOptions || [];
            config.cssOptions = cssOptions || [];
            config.otherOptions = otherOptions || [];
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
                var currentFileContent = getCurrentFileContent();

                if (result = (currentFileContent.indexOf(code) === -1))
                    assert.fail(result, true, code + ' not found');

                assert(true, 'Code for: [' + option + '] found');
            });
        };

        // TODO: See if this can be written using runTestUsingSingleIndex()
        var runTestUsingTwoIndexes = function(type, jsObject, cssObject, imageObject) {
            // TODO: Why separate jsObject from cssObject?
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
                } else if (type === 'image') {
                    generateFileWithOptions(null, null, [firstOption, secondOption]);
                }
                var currentFileContent = getCurrentFileContent();

                if (result = (currentFileContent.indexOf(firstCode) === -1))
                    assert.fail(result, true, firstCode + ' not found');

                if (result = (currentFileContent.indexOf(secondCode) === -1))
                    assert.fail(result, true, secondCode + ' not found');

                assert(true, 'Code for: [' + firstOption + ' and ' + secondOption + '] found');
            });
        };

        describe('using a config with one option of each', function() {
            beforeEach(function() {
                generator.generateFile(configWithOptions);
            });

            describe('and development server enabled', function() {

                beforeEach(function() {
                    var config = getConfigWithOptions();
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
                    var currentFileContent = getCurrentFileContent();
                    assertImports(currentFileContent, correctImports);
                });

                it('generates correct variables', function() {
                    var correctVariables = [
                        "var JS_SOURCE = 'src/javascript'",
                        "var JS_DEST = 'dist/javascript'",
                        "var JS_OUTPUT_FILE = 'main.js'",
                        "var SERVER_BASE_DIR = './';",
                        "var WATCH_FILE_EXTENSIONS = ['*.html'];",
                        "var IMAGE_SOURCE = 'src/images';",
                        "var IMAGE_DEST = 'dist/images';"
                    ];
                    var currentFileContent = getCurrentFileContent();
                    assertVariables(currentFileContent, correctVariables);
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

                    var currentFileContent = getCurrentFileContent();
                    assertStringOccurrences(currentFileContent, taskCodeLines);
                });

                it('generates correct default task', function() {
                    var taskDeclaration = "gulp.task('default', ['browser-sync'], function() {";
                    var nrOfWatchInTask = 2;
                    var searchTerm = '.watch(';

                    var currentFileContent = getCurrentFileContent();

                    assertUniqueStringOccurrences(currentFileContent, taskDeclaration, nrOfWatchInTask, searchTerm);
                });
            });

            it('generates imports', function() {
                // TODO: Add getDefaultImports()
                var imports = [
                    "var gulp = require('gulp');",
                    "var plumber = require('gulp-plumber');",
                    "var rename = require('gulp-rename');"
                ];
                var currentFileContent = getCurrentFileContent();
                assertImports(currentFileContent, imports);
            });

            it('generates variables', function() {
                // TODO: Add getDefaultVariables()
                var variables = [
                    "var JS_SOURCE = 'src/javascript'",
                    "var JS_DEST = 'dist/javascript'",
                    "var JS_OUTPUT_FILE = 'main.js'",
                    "var CSS_SOURCE = 'src/css';",
                    "var CSS_DEST = 'dist/css';",
                    "var IMAGE_SOURCE = 'src/images';",
                    "var IMAGE_DEST = 'dist/images';"
                ];
                var currentFileContent = getCurrentFileContent();
                assertVariables(currentFileContent, variables);
            });

            it('generates task', function() {
                var taskDeclaration = "gulp.task('default', function() {";
                var nrOfWatchInTask = 1;
                var searchTerm = '.watch(';

                var currentFileContent = getCurrentFileContent();

                assertUniqueStringOccurrences(currentFileContent, taskDeclaration, nrOfWatchInTask, searchTerm);
            });

            it('generates JavaScript task', function() {
                var taskDeclaration = "gulp.task('javascript', function() {";
                var nrOfPipelinesInTask = 2;

                var currentFileContent = getCurrentFileContent();

                var result;
                if (result = (currentFileContent.indexOf(taskDeclaration) === -1))
                    assert.fail(result, true, taskDeclaration + ' task not found');

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

                assert(true, 'JavaScript task is ok');
            });

            it('generates CSS task', function() {
                var taskDeclaration = "gulp.task('css', function() {";
                var nrOfPipelinesInTask = 2;

                var currentFileContent = getCurrentFileContent();

                var result;
                if (result = (currentFileContent.indexOf(taskDeclaration) === -1))
                    assert.fail(result, true, taskDeclaration + ' task not found');

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

                assert(true, 'CSS task is ok');
            });

            it('generates image task', function() {
                var taskDeclaration = "gulp.task('images', function() {";
                var nrOfPipelinesInTask = 2;

                var currentFileContent = getCurrentFileContent();

                var result;
                if (result = (currentFileContent.indexOf(taskDeclaration) === -1))
                    assert.fail(result, true, taskDeclaration + ' task not found');

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

                assert(true, 'Image task is ok');
            });
        });
        
        describe('with all options', function() {
            beforeEach(function() {
                var config = getConfigWithAllOptions();
                generator.generateFile(config);
            });
            it('generate unique imports', function() {
                var currentFileContent = getCurrentFileContent();
                assertUniqueImports(currentFileContent);
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
                ".pipe(browserSync.reload({ stream:true }))"
            ];

            it('returns empty JS object 0 options selected', function() {
                var generateNoJsCodeForThisObject = {
                    jsDistSource: 'distSource',
                    jsDistDest: 'distDest',
                    jsOptions: []
                };
                var jsObject = generator.getJsOptions(generateNoJsCodeForThisObject);
                assert.deepEqual(jsObject, {});
            });

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

            // These two arrays match against index, so cssOptions[0]
            // generates code that's in generatedCode[0] and so on
            var cssOptions = [
                "autoprefixer",
                "minifyCss",
                "browserSync",
                "cssLint"
            ];

            var generatedCode = [
                ".pipe(autoprefixer('last 2 versions'))",
                ".pipe(gulp.dest(CSS_DEST + '/'))\n" +
                "    .pipe(rename({suffix: '.min'}))\n" +
                "    .pipe(minifycss())",
                ".pipe(browserSync.reload({ stream:true }))",
                ".pipe(csslint())"
            ];

            it('returns empty CSS object when 0 options and no pre processor selected', function() {
                var generateNoCssCodeForThisObject = {
                    cssDistSource: 'distSource',
                    cssDistDest: 'distDest',
                    cssOptions: [],
                    preProcessorType: 'none'
                };
                var cssObject = generator.getCssOptions(generateNoCssCodeForThisObject);
                assert.deepEqual(cssObject, {});
            });

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
                // TODO: This currently tests options A and B like
                // A + B
                // B + A
                // but it should only test a unique combination once
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
                    var config = getEmptyConfig();
                    config.cssPreProcessorType = type;
                    generator.generateFile(config);
                };

                var runCssPreProcessorTypeTest = function(type, codeScope) {
                    var currentFileContent, result;
                    it(type, function() {
                        generateFileWithCssPreProcessorType(type);

                        currentFileContent = getCurrentFileContent();

                        if (result = (currentFileContent.indexOf(codeScope) === -1))
                            assert.fail(result, true, codeScope + ' not found');

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
                        currentFileContent = getCurrentFileContent();
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

        describe('with other option:', function() {
            describe('image', function() {
                beforeEach(function() {
                    fsMock({
                        'gulpfile.js': ''
                    });
                });

                var type = 'image';

                // These two arrays match against index, so imageOptions[0]
                // generates code that's in generatedCode[0] and so on
                var otherOptions = [
                    "minifyImage",
                    "cache"
                ];

                var generatedCode = [
                    "{ optimizationLevel: 3, progressive: true, interlaced: true })))",
                    ".pipe(cache(imagemin("
                ];
                describe('using combination of options', function() {
                    var imageObject = {
                        indexes: null,
                        options: otherOptions,
                        generatedCode: generatedCode
                    };
                    for (var i = 0; i < otherOptions.length; i++) {
                        for (var j = 0; j < otherOptions.length; j++) {
                            if (j === i)
                                continue;

                            imageObject.indexes = [i, j];
                            runTestUsingTwoIndexes(type, null, imageObject);
                        }
                    }
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

        it('with no options selected', function() {
            var emptyDependenciesConfig = getEmptyConfig();
            emptyDependenciesConfig.outputDependencies = true;
            generator.generateFile(emptyDependenciesConfig);

            var actual = fs.readFileSync('install-dependencies.txt', 'utf8');

            var expect = 'npm install --save-dev gulp gulp-plumber gulp-rename';
            assert.equal(actual, expect);
        });

        it('containing selected options', function() {
            var installDependenciesConfig = getEmptyConfig();
            installDependenciesConfig.jsOptions = ['uglify', 'babel', 'jshint'];
            installDependenciesConfig.outputDependencies = true;
            installDependenciesConfig.devServer = true;
            generator.generateFile(installDependenciesConfig);

            var actual = fs.readFileSync('install-dependencies.txt', 'utf8');

            var expect = 'npm install --save-dev gulp gulp-plumber gulp-rename gulp-jshint ' +
                'gulp-babel gulp-uglify browser-sync';
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
            var config = getEmptyConfig();
            config.jsOptions = ['incorrectOption'];
            generator.generateFile(config);

            assert(console.warn.calledOnce);
            assert(console.warn.calledWith('Option [incorrectOption] is not a valid JS option'));
        });

        it('on incorrect CSS option', function() {
            var config = getEmptyConfig();
            config.cssOptions = ['incorrectOption'];
            generator.generateFile(config);

            assert(console.warn.calledOnce);
            assert(console.warn.calledWith('Option [incorrectOption] is not a valid CSS option'));
        });

        it('on incorrect image option', function() {
            var config = getEmptyConfig();
            config.otherOptions = ['incorrectOption'];
            generator.generateFile(config);

            assert(console.warn.calledOnce);
            assert(console.warn.calledWith('Option [incorrectOption] is not a valid image option'));
        });

        it('on incorrect custom code type', function() {
            var type = 'nonValidType';
            generator.getCustomCode(type);

            assert(console.warn.calledOnce);
            assert(console.warn.calledWith(
                'Type [' + type + '] is not a valid custom code option'));
        });
    });

    describe('sorts', function() {
        beforeEach(function() {
            fsMock({
                'gulpfile.js': ''
            });
        });

        it('JS pipeline tasks', function() {
            var config = getEmptyConfig();
            config.jsOptions = utils.shuffleArray(['jshint', 'concat', 'dest',
                'babel', 'uglify', 'browserSync', 'coffee']);
            config.devServer = true;
            generator.generateFile(config);
            
            var sortOrder = 
                Object.freeze(require('./../source/generator.config.json').sortOrders.js);

            var prevIndex, currIndex,
                currentFileContent = fs.readFileSync('gulpfile.js', 'utf8'),
                startIndex = currentFileContent.indexOf("gulp.task('javascript'"),
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
            var config = getEmptyConfig();
            config.cssOptions =
                utils.shuffleArray(['less', 'stylus', 'autoprefixer',
                    'minifyCss', 'sass', 'browserSync']);
            generator.generateFile(config);

            var sortOrder =
                Object.freeze(require('./../source/generator.config.json').sortOrders.css);

            var prevIndex, currIndex,
                currentFileContent = fs.readFileSync('gulpfile.js', 'utf8'),
                startIndex = currentFileContent.indexOf("gulp.task('css"),
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

        it('Image pipeline tasks [TODO]', function() {
            // TODO: When there's more than one option
        });
    });
});
