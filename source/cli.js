#! /usr/bin/env node

var inquirer = require('inquirer');
var generator = require('./generator');

inquirer.prompt([
    {
        type: 'confirm',
        name: 'devServer',
        message: 'Do you want a dev server?'
    },
    {
        type: 'checkbox',
        name: 'jsOptions',
        message: 'What options do you want for JavaScript?',
        choices: [
            {
                name: 'Concat',
                short: 'Concat',
                value: 'concat'
            },
            {
                name: 'Uglify',
                short: 'Uglify',
                value: 'uglify'
            },
            {
                name: 'Hint',
                short: 'Hint',
                value: 'jshint'
            },
            {
                name: 'Convert ES6 -> ES5',
                short: 'ES6->ES5',
                value: 'babel'
            },
            {
                name: 'Compile CoffeeScript',
                short: 'CoffeeScript',
                value: 'coffee'
            }
        ]
    },
    {
        type: 'input',
        name: 'jsScriptsSource',
        message: 'JS source destination?',
        default: 'src/scripts',
        filter: function (val) {
            if (val.charAt(val.length - 1) === '/')
                val = val.substring(0, val.length - 1);
            return val.toLowerCase().trim();
        }
    },
    {
        type: 'input',
        name: 'jsScriptsDest',
        message: 'JS build destination?',
        default: 'dist/scripts',
        filter: function (val) {
            if (val.charAt(val.length - 1) === '/')
                val = val.substring(0, val.length - 1);
            return val.toLowerCase().trim();
        }
    }
]).then(function (answers) {
    generator.generateFile(answers);
});
