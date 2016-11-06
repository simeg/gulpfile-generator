/*eslint-disable quotes */
'use strict';

var fs = require('fs');

module.exports = {
    generateFile: function(options) {
        console.log(JSON.stringify(options, null, '  '));

        var source = options.jsScriptsSource;
        var dest = options.jsScriptsDest;
        var jsOptions = options.jsOptions;
        var devServer = options.devServer;
        if (devServer)
            jsOptions.push('browserSync');
        jsOptions.push('dest');
        jsOptions = this.sortOptions(jsOptions);

        var content;
        content = this.getImports(jsOptions);
        content += this.getVariableDeclarations(source, dest, devServer);

        if (devServer)
            content += "\n" + this.getCustomCode('browserSync');

        content += '\n';
        if (jsOptions && jsOptions.length)
            content += this.getScriptsTask(jsOptions, source, dest);

        content += this.getDefaultTask(jsOptions);

        this.writeToFile('gulpfile.js', content);
    },
    getImports: function(options) {
        var indentationBase = '    ';
        var i = indentationBase;
        var content = "var gulp = require('gulp'),\n" +
            i + "plumber = require('gulp-plumber'),\n" +
            i + "rename = require('gulp-rename');\n";

        // Add gulp imports (in top of file)
        for (var i = 0; i < options.length; i++) {
            var option = options[i];
            var gulpOption = this.getPath(option);
            if (gulpOption)
                content += "var " + option + " = require('" + gulpOption + "');\n";
        }

        return content;
    },
    getVariableDeclarations: function(source, dest, devServer) {
        var content;
        content = "\nvar SOURCE = '" + source + "';";
        content += "\nvar DEST = '" + dest + "';";
        content += "\nvar OUTPUT_FILE = 'main.js';";
        if (devServer) {
            content += "\nvar SERVER_BASE_DIR = './';";
            content += "\nvar WATCH_FILE_EXTENSIONS = ['*.html'];";
        }
        content += "\n";

        return content;
    },
    getScriptsTask: function(options, source, dest) {
        var isCoffee = (options.indexOf('coffee') !== -1);
        var scriptExtension = (isCoffee ? '.coffee' : '.js');

        var indentationBase = '  ';
        var i = indentationBase;
        var content = "gulp.task('scripts', function() {\n" +
            i + "return gulp.src(SOURCE + '/**/*" + scriptExtension + "')\n" +
            i + i + ".pipe(plumber({\n" +
            i + i + i + "errorHandler: function(error) {\n" +
            i + i + i + i + "console.log(error.message);\n" +
            i + i + i + i + "this.emit('end');\n" + i + i + "}}))\n";

        // Add gulp pipeline tasks
        for (var j = 0; j < options.length; j++) {
            var option = options[j];
            var gulpCode = this.getJsOptionCode(option, dest);
            if (gulpCode)
                content += i + i + gulpCode + "\n";

            if (j === (options.length - 1))
                content += "});\n\n";
        }

        return content;
    },
    getDefaultTask: function(options) {
        var isCoffee = (options.indexOf('coffee') !== -1);
        var isDevServer = (options.indexOf('browserSync') !== -1);
        var scriptExtension = (isCoffee ? '.coffee' : '.js');

        var indentationBase = '  ';
        var i = indentationBase;
        return (
            "gulp.task('default', " + (isDevServer ? "['browser-sync'], " : '') + "function() {\n" +
            i + "gulp.watch(SOURCE + '/**/*" + scriptExtension + "', ['scripts']);\n" +
            (isDevServer ? (i + "gulp.watch(WATCH_FILE_EXTENSIONS, ['bs-reload']);\n") : '') +
            "});\n");
    },
    getPath: function (name) {
        switch (name) {
        case 'babel':
            return 'gulp-babel';
        case 'browserSync':
            return 'browser-sync';
        case 'coffee':
            return 'gulp-coffee';
        case 'concat':
            return 'gulp-concat';
        case 'jshint':
            return 'gulp-jshint';
        case 'uglify':
            return 'gulp-uglify';
        default:
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
            return ".pipe(concat(OUTPUT_FILE))";
        case 'dest':
            return ".pipe(gulp.dest(DEST + '/'))";
        case 'jshint':
            return ".pipe(jshint())\n" +
                "    .pipe(jshint.reporter('default'))";
        case 'uglify':
            return ".pipe(gulp.dest(DEST + '/'))\n" +
                "    .pipe(rename({suffix: '.min'}))\n" +
                "    .pipe(uglify())";
        default:
            console.warn('Option [' + name + '] is not a valid option');
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
            console.warn('Type [' + type + '] is not a valid type');
            return null;
        }
    },
    writeToFile: function(filePath, content) {
        fs.writeFileSync(filePath, content);
    },
    sortOptions: function(options) {
        var order = [
            'coffee',
            'jshint',
            'concat',
            'babel',
            'uglify',
            'dest',
            'browserSync'
        ];
        return options.sort(function(a, b){
            return order.indexOf(a) < order.indexOf(b) ? -1 : 1;
        });
    }
};
