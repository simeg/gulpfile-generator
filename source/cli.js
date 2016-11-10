#! /usr/bin/env node
'use strict';

var inquirer = require('inquirer');
var generator = Object.freeze(require('./generator'));
var questions = Object.freeze(require('./cli.config.json').questions);

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

var questionsWithFilter = questions.map(function(questionsObj) {
    if (questionsObj.filter === 'formatDist') {
        questionsObj.filter = formatString;
    }
    return questionsObj;
});

inquirer.prompt(questionsWithFilter).then(function(answers) {
    generator(answers);
});
