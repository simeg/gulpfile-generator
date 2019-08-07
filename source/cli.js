#!/usr/bin/env node
'use strict';

var inquirer = require('inquirer');
var list = require('cli-list');
var generator = Object.freeze(require('./generator'));
var questions = Object.freeze(require('./cli.config.json').questions);
var args = list(process.argv.slice(2));

var cliArguments = {};
if (args[0].indexOf('-n') !== -1)
    cliArguments.dryRun = true;

/*
 * - Removes trailing slash
 * - Converts to lower case
 * - Trims
 */
// TODO: Add test for this
var formatString = function (val) {
    if (val.charAt(val.length - 1) === '/')
        val = val.substring(0, val.length - 1);
    return val.toLowerCase().trim();
};

var questionsWithFilter = questions.map(function(question) {
    if (question.filter === 'formatDist') {
        question.filter = formatString;
    }
    return question;
});

var questionsWithWhen = questionsWithFilter.map(function(question) {
    if (question.when === 'otherOptions.minifyImage') {
        question.when = function(answers) {
            return answers.otherOptions.indexOf('minifyImage') !== -1;
        };
    }
    return question;
});

inquirer.prompt(questionsWithWhen).then(function(answers) {
    if (!cliArguments.dryRun)
        generator(answers);
});
