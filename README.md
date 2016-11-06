# gulpfile-generator [![Build Status](https://travis-ci.org/simeg/gulpfile-generator.svg?branch=master)](https://travis-ci.org/simeg/gulpfile-generator) [![codecov](https://codecov.io/gh/simeg/gulpfile-generator/branch/master/graph/badge.svg)](https://codecov.io/gh/simeg/gulpfile-generator)

`gulpfile-generator` is an interactive tool to help your create your custom `gulpfile.js`. `gulpfile-generator` is run as an CLI where you get to input what tasks you want in your `gulpfile.js`. When it is done it will generate a `gulpfile.js` in the same folder as you are standing in. 

## Installation
```bash
npm install -g gulpfile-generator
```
`gulpfile-generator` only has one external dependency (not counting `node`), so you won't clogger your global `node_modules` folder for this small tool. 

## Usage
```bash
gulpfile-generator
```
This will start up an interactive interface where you get to select what tasks you want to be in your configuration file.

## Supports
* **Development server** using [browser-sync](https://github.com/BrowserSync/browser-sync)
* JavaScript
  * **Minification** using [gulp-uglify](https://github.com/terinjokes/gulp-uglify)
  * **Concatenation** using [gulp-concat](https://github.com/contra/gulp-concat)
  * **JSHint** using [gulp-jshint](https://github.com/spalger/gulp-jshint)
  * **Compiling CoffeeScript** using [gulp-coffee](https://github.com/contra/gulp-coffee)
  * **Converting ES6 to ES5** using [gulp-babel](https://github.com/babel/gulp-babel)
  * _More.. (coming soon!)_
* CSS/SASS/LESS (_coming soon!_)
* Images (_coming soon!_)
