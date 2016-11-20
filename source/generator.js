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
            cssObject = g.getCssOptions(options);

        var sortedJsOptions = g.sortOptions(jsObject);
        var sortedCssOptions = g.sortOptions(cssObject);

        var content;
        var totalOptions = sortedJsOptions.concat(sortedCssOptions);

        content = g.getImports(totalOptions);
        content += g.getVariableDeclarations(devServer, jsObject, cssObject);

        if (devServer)
            content += "\n" + g.getCustomCode('browserSync');

        content += '\n';

        if (sortedJsOptions && sortedJsOptions.length)
            content += g.getScriptsTask(sortedJsOptions, jsObject);

        if (sortedCssOptions && sortedCssOptions.length)
            content += g.getStylesTask(sortedCssOptions, cssObject);

        totalOptions.push(cssObject.preProcessorType);
        content += g.getDefaultTask(totalOptions);

        if (options.outputDependencies)
            g.generateDependencyFile(sortedJsOptions);

        g.writeToFile('gulpfile.js', content);
    },
    getJsOptions: function(userSelectedOptions) {
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
    getImports: function(options) {
        var content = '',
            modules = defaultModules.concat(options);

        // Add gulp imports (in top of file)
        for (var j = 0; j < modules.length; j++) {
            var importName = modules[j];
            var gulpImport = generator.getModulePath(importName);
            if (gulpImport)
                content += "var " + importName + " = require('" + gulpImport + "');\n";
        }

        return content;
    },
    getVariableDeclarations: function(devServer, jsOptions, cssOptions) {
        var content;
        content = "\nvar JS_SOURCE = '" + jsOptions.source + "';";
        content += "\nvar JS_DEST = '" + jsOptions.dest + "';";
        content += "\nvar JS_OUTPUT_FILE = 'main.js';";

        content += "\nvar CSS_SOURCE = '" + cssOptions.source + "';";
        content += "\nvar CSS_DEST = '" + cssOptions.dest + "';";
        if (devServer) {
            content += "\nvar SERVER_BASE_DIR = './';";
            content += "\nvar WATCH_FILE_EXTENSIONS = ['*.html'];";
        }
        content += "\n";

        return content;
    },
    getStylesTask: function(options, cssObject) {
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

        var content = "gulp.task('styles', function() {\n" +
            (preProcessing ? preProcessing : '');

        // Add gulp pipeline tasks
        for (var j = 0; j < options.length; j++) {
            var option = options[j];
            var gulpCode = generator.getCssOptionCode(option, cssObject.dest);
            if (gulpCode)
                content += i + i + gulpCode + "\n";

            if (j === (options.length - 1))
                content += "});\n\n";
        }

        return content;
    },
    getScriptsTask: function(options, jsObject) {
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
            var gulpCode = generator.getJsOptionCode(option, jsObject.dest);
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
                "', ['styles']);" + "\n";

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
    getCssOptionCode: function(name) {
        switch (name) {
        case 'autoprefixer':
            return ".pipe(autoprefixer('last 2 versions'))";
        case 'browserSync':
            return ".pipe(browserSync.reload({stream:true}))";
        case 'dest':
            return ".pipe(gulp.dest(CSS_DEST + '/'))";
        case 'less':
            return ".pipe(less())";
        case 'minifycss':
            return ".pipe(gulp.dest(CSS_DEST + '/'))\n" +
                "    .pipe(rename({suffix: '.min'}))\n" +
                "    .pipe(minifycss())";
        case 'sass':
            return ".pipe(sass())";
        case 'stylus':
            return ".pipe(stylus())";
        default:
            console.warn('Option [' + name + '] is not a valid CSS option');
            return null;
        }
    },
    getJsOptionCode: function(name) {
        switch (name) {
        case 'babel':
            return ".pipe(babel())";
        case 'browserSync':
            return ".pipe(browserSync.reload({stream:true}))";
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
            console.warn('Option [' + name + '] is not a valid JS option');
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
            console.warn('Type [' + type + '] is not a valid custom code option');
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
        var npmInstallStr = 'npm install --save-dev ' + dependencies.join(' ');
        generator.writeToFile('install-dependencies.txt', npmInstallStr);
    }
};

// Export whole generator object if test build, this
// makes it possible to test private methods
module.exports = process.env.NODE_ENV === 'test' ? generator : generator.generateFile;
