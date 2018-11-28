/*eslint-disable quotes */
'use strict';

var fs = require('fs');
var sortOrders = Object.freeze(require('./generator.config.json').sortOrders);
var moduleNames = Object.freeze(require('./generator.config.json').moduleNames);
var defaultModules = Object.freeze(require('./generator.config.json').defaultModules);

var generator = {
    generateFile: function(options) {
        var g = generator;

        var devServer = options.devServer,
            jsObject = g.getJsOptions(options),
            cssObject = g.getCssOptions(options),
            imageObject = g.getImageOptions(options),
            sortedJsOptions = [],
            sortedCssOptions = [],
            sortedImageOptions = [],
            content,
            totalOptions;

        if (jsObject.options && jsObject.options.length)
            sortedJsOptions = g.sortOptions(jsObject);

        if (cssObject.options && cssObject.options.length)
            sortedCssOptions = g.sortOptions(cssObject);

        if (imageObject.options && imageObject.options.length)
            sortedImageOptions = g.sortOptions(imageObject);

        totalOptions = [].concat(sortedJsOptions, sortedCssOptions, sortedImageOptions);
        // we need to filter for duplicate options
        totalOptions = totalOptions.filter(function(option, index){
            return totalOptions.indexOf(option) === index;
        });

        content = g.getImports(totalOptions);
        content += g.getVariableDeclarations(devServer, jsObject, cssObject, imageObject);

        if (devServer)
            content += "\n" + g.getCustomCode('browserSync');

        content += '\n';

        if (sortedJsOptions && sortedJsOptions.length)
            content += g.getJavascriptTask(sortedJsOptions);

        if (sortedCssOptions && sortedCssOptions.length)
            content += g.getCssTask(sortedCssOptions, cssObject);

        if (sortedImageOptions && sortedImageOptions.length)
            content += g.getImageTask(sortedImageOptions);

        if (cssObject.preProcessorType !== 'none')
            totalOptions.push(cssObject.preProcessorType);

        content += g.getDefaultTask(totalOptions);

        var installInstruction;
        var outputDependenciesIsSuccess;
        if (options.outputDependencies === "toTxtFile") {
            installInstruction = "copy script in install-dependencies.txt and run it";
            outputDependenciesIsSuccess = g.generateDependencyFile(totalOptions);
        }
        else {
            installInstruction = "npm run setup";
            outputDependenciesIsSuccess = g.generateInstallScriptToPackageJson(totalOptions);
        }
        if (outputDependenciesIsSuccess) {
            g.writeToFile('gulpfile.js', content);
            g.showInstruction(installInstruction);
        }
    },
    showInstruction: function(installInstruction) {
        // print instructions after the initialization
        // but make sure we won't print it during test
        if (process.env.NODE_ENV !== 'test') {
            console.log( // eslint-disable-line
                "Your project folder is now ready !\n" +
                "Instructions:\n" +
                "1/ " + installInstruction + "\n" +
                "2/ gulp"
            );
        }
    },
    getJsOptions: function(userSelectedOptions) {
        if (userSelectedOptions.jsOptions.length === 0)
            return {};

        var optionsObj = {};
        optionsObj.options = userSelectedOptions.jsOptions;
        optionsObj.source = userSelectedOptions.jsDistSource;
        optionsObj.dest = userSelectedOptions.jsDistDest;
        optionsObj.sortType = 'js';

        if (userSelectedOptions.devServer)
            optionsObj.options.push('browserSync');
        optionsObj.options.push('dest');

        return optionsObj;
    },
    getCssOptions: function(userSelectedOptions) {
        if ((userSelectedOptions.cssOptions.length === 0) &&
            (userSelectedOptions.preProcessorType === 'none'))
            return {};

        var optionsObj = {};

        optionsObj.options = userSelectedOptions.cssOptions;
        optionsObj.source = userSelectedOptions.cssDistSource;
        optionsObj.dest = userSelectedOptions.cssDistDest;
        optionsObj.preProcessorType = userSelectedOptions.cssPreProcessorType;
        optionsObj.sortType = 'css';

        if (userSelectedOptions.devServer)
            optionsObj.options.push('browserSync');
        optionsObj.options.push('dest');

        if (optionsObj.preProcessorType !== 'none')
            optionsObj.options.push(optionsObj.preProcessorType);

        return optionsObj;
    },
    getImageOptions: function(userSelectedOptions) {
        if (userSelectedOptions.otherOptions.length === 0)
            return {};

        var optionsObj = {};

        optionsObj.options = userSelectedOptions.otherOptions;
        optionsObj.imageSource = userSelectedOptions.imageDistSource;
        optionsObj.imageDest = userSelectedOptions.imageDistDest;
        optionsObj.sortType = 'image';

        if (optionsObj.options.indexOf('minifyImage') !== -1)
            optionsObj.options.push('cache');

        return optionsObj;
    },
    getImports: function(options) {
        var content = '',
            modules = defaultModules.concat(options);

        // Add unique gulp imports (in top of file)
        var tempGulpImports = [];
        for (var j = 0; j < modules.length; j++) {
            var importName = modules[j];
            var gulpImport = generator.getModulePath(importName);
            if (gulpImport && tempGulpImports.indexOf(gulpImport) === -1) {
                tempGulpImports.push(gulpImport);
                content += "var " + importName + " = require('" + gulpImport + "');\n";
            }
        }

        return content;
    },
    getVariableDeclarations: function(devServer, jsOptions, cssOptions, otherOptions) {
        var content;
        content = "\nvar JS_SOURCE = '" + jsOptions.source + "';";
        content += "\nvar JS_DEST = '" + jsOptions.dest + "';";
        content += "\nvar JS_OUTPUT_FILE = 'main.js';";

        content += "\nvar CSS_SOURCE = '" + cssOptions.source + "';";
        content += "\nvar CSS_DEST = '" + cssOptions.dest + "';";

        if (otherOptions.imageSource && otherOptions.imageDest) {
            content += "\nvar IMAGE_SOURCE = '" + otherOptions.imageSource + "';";
            content += "\nvar IMAGE_DEST = '" + otherOptions.imageDest + "';";
        }

        if (devServer) {
            content += "\nvar SERVER_BASE_DIR = './';";
            content += "\nvar WATCH_FILE_EXTENSIONS = ['*.html'];";
        }
        content += "\n";

        return content;
    },
    getJavascriptTask: function(options) {
        var isCoffee = (options.indexOf('coffee') !== -1);
        var scriptExtension = (isCoffee ? '.coffee' : '.js');

        var indentationBase = '  ';
        var i = indentationBase;
        var content = "gulp.task('javascript', function() {\n" +
            i + "return gulp.src(JS_SOURCE + '/**/*" + scriptExtension + "')\n" +
            i + i + ".pipe(plumber({\n" +
            i + i + i + "errorHandler: function(error) {\n" +
            i + i + i + i + "console.log(error.message);\n" +
            i + i + i + i + "generator.emit('end');\n" + i + i + "}}))\n";

        // Add gulp pipeline tasks
        for (var j = 0; j < options.length; j++) {
            var option = options[j];
            var gulpCode = generator.getJsOptionCode(option);
            if (gulpCode)
                content += i + i + gulpCode + "\n";

            if (j === (options.length - 1))
                content += "});\n\n";
        }

        return content;
    },
    getCssTask: function(options, cssObject) {
        var preProcessing,
            type = cssObject.preProcessorType;

        var indentationBase = '  ';
        var i = indentationBase;
        if (type !== 'none') {
            var styleExtension;
            if (type === 'less') {
                styleExtension = '.less';
            } else if (type === 'sass') {
                styleExtension = '.scss';
            } else if (type === 'stylus') {
                styleExtension = '.styl';
            }
            preProcessing = i + "gulp.src(CSS_SOURCE + '/**/*" + styleExtension + "')\n" +
                i + i + ".pipe(plumber({\n" +
                i + i + i + "errorHandler: function(error) {\n" +
                i + i + i + i + "console.log(error.message);\n" +
                i + i + i + i + "generator.emit('end');\n" + i + i + "}}))\n";
        }

        if (type === 'none') {
            var styleExtension = '.css';
            preProcessing = i + "gulp.src(CSS_SOURCE + '/**/*" + styleExtension + "')\n" +
                i + i + ".pipe(plumber({\n" +
                i + i + i + "errorHandler: function(error) {\n" +
                i + i + i + i + "console.log(error.message);\n" +
                i + i + i + i + "generator.emit('end');\n" + i + i + "}}))\n";
        }

        var content = "gulp.task('css', function() {\n" +
            (preProcessing ? preProcessing : '');

        // Add gulp pipeline tasks
        for (var j = 0; j < options.length; j++) {
            var option = options[j];
            var gulpCode = generator.getCssOptionCode(option);
            if (gulpCode)
                content += i + i + gulpCode + "\n";

            if (j === (options.length - 1))
                content += "});\n\n";
        }

        return content;
    },
    getImageTask: function(options) {
        var indentationBase = '  ';
        var i = indentationBase;
        var content = "gulp.task('images', function() {\n" +
            i + "gulp.src(IMAGE_SOURCE + '/**/*')\n";

        // Add gulp pipeline tasks
        for (var j = 0; j < options.length; j++) {
            var option = options[j];
            var gulpCode = generator.getImageOptionCode(option);
            if (gulpCode)
                content += i + i + gulpCode + "\n";

            if (j === (options.length - 1))
                content += "});\n\n";
        }

        return content;
    },
    getDefaultTask: function(allOptions) {
        var indentationBase = '  ';
        var i = indentationBase;

        var isDevServer = (allOptions.indexOf('browserSync') !== -1);

        var isCoffee = (allOptions.indexOf('coffee') !== -1);
        var scriptExtension = (isCoffee ? '.coffee' : '.js');
        var scriptWatchRow =
            i + "gulp.watch(JS_SOURCE + '/**/*" + scriptExtension + "', ['javascript']);" + "\n";

        var styleExtension = null;
        if (allOptions.indexOf('less') !== -1) {
            styleExtension = '.less';
        } else if (allOptions.indexOf('sass') !== -1) {
            styleExtension = '.scss';
        } else if (allOptions.indexOf('stylus') !== -1) {
            styleExtension = '.styl';
        }

        if (styleExtension)
            var styleWatchRow = i + "gulp.watch(CSS_SOURCE + '/**/*" + styleExtension +
                "', ['css']);" + "\n";

        return (
            "gulp.task('default', " + (isDevServer ? "['browser-sync'], " : '') + "function() {\n" +
            scriptWatchRow +
            (styleWatchRow ? styleWatchRow : '') +
            (isDevServer ? (i + "gulp.watch(WATCH_FILE_EXTENSIONS, ['bs-reload']);\n") : '') +
            "});\n");
    },
    getModulePath: function (name) {
        return moduleNames[name] || null;
    },
    getJsOptionCode: function(name) {
        switch (name) {
        case 'babel':
            return ".pipe(babel())";
        case 'browserSync':
            return ".pipe(browserSync.reload({ stream:true }))";
        case 'coffee':
            return ".pipe(coffee({bare: true}))";
        case 'concat':
            return ".pipe(concat(JS_OUTPUT_FILE))";
        case 'dest':
            return ".pipe(gulp.dest(JS_DEST + '/'))";
        case 'jshint':
            return ".pipe(jshint())\n" +
                "    .pipe(jshint.reporter('default'))";
        case 'uglify':
            return ".pipe(gulp.dest(JS_DEST + '/'))\n" +
                "    .pipe(rename({suffix: '.min'}))\n" +
                "    .pipe(uglify())";
        default:
            console.warn('Option [' + name + '] is not a valid JS option'); // eslint-disable-line
            return null;
        }
    },
    getCssOptionCode: function(name) {
        switch (name) {
        case 'autoprefixer':
            return ".pipe(autoprefixer('last 2 versions'))";
        case 'browserSync':
            return ".pipe(browserSync.reload({ stream:true }))";
        case 'cssLint':
            return ".pipe(csslint())\n" +
                "    .pipe(csslint.reporter())";
        case 'dest':
            return ".pipe(gulp.dest(CSS_DEST + '/'))";
        case 'less':
            return ".pipe(less())";
        case 'minifyCss':
            return ".pipe(gulp.dest(CSS_DEST + '/'))\n" +
                "    .pipe(rename({suffix: '.min'}))\n" +
                "    .pipe(minifycss())";
        case 'sass':
            return ".pipe(sass())";
        case 'stylus':
            return ".pipe(stylus())";
        default:
            console.warn('Option [' + name + '] is not a valid CSS option'); // eslint-disable-line
            return null;
        }
    },
    getImageOptionCode: function(name) {
        switch (name) {
        case 'minifyImage':
            return ".pipe(cache(imagemin(" +
                "{ optimizationLevel: 3, progressive: true, interlaced: true })))\n" +
                "    .pipe(gulp.dest(IMAGE_DEST + '/'));";
        case 'cache':
            return '';
        default:
            console.warn('Option [' + name + '] is not a valid image option'); // eslint-disable-line
            return null;
        }
    },
    getCustomCode: function(type) {
        var indentationBase = '  ';
        var i = indentationBase;
        switch (type) {
        case 'browserSync':
            return "gulp.task('browser-sync', function() {\n" +
                i + "browserSync({\n" + i + i + "server: {\n" +
                i + i + i + "baseDir: SERVER_BASE_DIR\n" + i + i + "}\n" +
                i + "});\n" + "});\n\n" +
                "gulp.task('bs-reload', function() {\n" +
                i + "browserSync.reload();\n" + "});\n";
        default:
            console.warn('Type [' + type + '] is not a valid custom code option'); // eslint-disable-line
            return null;
        }
    },
    writeToFile: function(filePath, content) {
        fs.writeFileSync(filePath, content);
    },
    sortOptions: function(object) {
        var order = sortOrders[object.sortType];
        return object.options.sort(function(a, b) {
            return order.indexOf(a) < order.indexOf(b) ? -1 : 1;
        });
    },
    generateDependencyFile: function(options) {
        var allOptions = defaultModules.concat(options);
        // Filter out non-valid dependencies
        var dependencies = allOptions.reduce(function(dependencies, option) {
            var dependency = generator.getModulePath(option);
            if (dependency)
                dependencies.push(dependency);

            return dependencies;
        }, []);
        var uniqueDependencies = dependencies.filter(function(option, index) {
            return dependencies.indexOf(option) === index;
        });
        var npmInstallStr = 'npm install --save-dev ' + uniqueDependencies.join(' ');
        var generateSuccess = true;
        try {
            generator.writeToFile('install-dependencies.txt', npmInstallStr);
        }
        catch (exception) {
            console.warn(exception); // eslint-disable-line
            generateSuccess = false;
        }
        return generateSuccess;
    },
    generateInstallScriptToPackageJson: function(options) {
        var allOptions = defaultModules.concat(options);
        // Filter out non-valid dependencies
        var dependencies = allOptions.reduce(function(dependencies, option) {
            var dependency = generator.getModulePath(option);
            if (dependency)
                dependencies.push(dependency);

            return dependencies;
        }, []);
        var uniqueDependencies = dependencies.filter(function(option, index) {
            return dependencies.indexOf(option) === index;
        });
        var npmInstallStr = 'npm install --save-dev ' + uniqueDependencies.join(' ');
        var generateSuccess = true;
        if (fs.existsSync('package.json')) {
            var packageFileContent = fs.readFileSync('package.json');
            try {
                packageFileContent = JSON.parse(packageFileContent);
            }
            catch (exception) {
                console.warn( // eslint-disable-line
                    "\n\n" +
                    "Error while parsing package.json file" +
                    "Please check your package.json file for any redundant commas" +
                    "\n\n"
                );
                generateSuccess = false;
            }
            // 4 white-space for package.json
            var indentation = 4;
            // create scripts if not exists
            if (packageFileContent.scripts === undefined) {
                packageFileContent.scripts = {};
            }
            // append the install script to scripts in package.json
            packageFileContent.scripts.setup = npmInstallStr;
            var json = JSON.stringify(packageFileContent, null, indentation);
            generator.writeToFile('package.json', json);
        }
        else {
            console.warn( // eslint-disable-line
                "\n\n" +
                "package.json file doesn't exists ! " +
                "Please run npm init first"+
                "\n\n"
            );
            generateSuccess = false;
        }

        return generateSuccess;
    }
};

// Export whole generator object if test build, this
// makes it possible to test private methods
module.exports = process.env.NODE_ENV === 'test' ? generator : generator.generateFile;
