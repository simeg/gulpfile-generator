# gulpfile-generator [![Build Status](https://travis-ci.org/simeg/gulpfile-generator.svg?branch=master)](https://travis-ci.org/simeg/gulpfile-generator) [![codecov](https://codecov.io/gh/simeg/gulpfile-generator/branch/master/graph/badge.svg)](https://codecov.io/gh/simeg/gulpfile-generator)

`gulpfile-generator` is an interactive tool to help your create your custom `gulpfile.js`. `gulpfile-generator` is run as an CLI where you get to input what tasks you want in your `gulpfile.js`. When it is done it will generate a `gulpfile.js` in the same folder as you are standing in. It can also generate a file containing the exact `npm` command to install the dependencies you need for your `gulpfile.js`.

## Installation
```bash
npm install -g gulpfile-generator
``` 

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
  * _More.. (coming soon)_
* CSS
  * **LESS** using [gulp-less](https://github.com/plus3network/gulp-less)
  * **Sass** using [gulp-sass](https://github.com/dlmanning/gulp-sass)
  * **Stylus** using [gulp-stylus](https://github.com/stevelacy/gulp-stylus)
  * **Autoprefixer** using [gulp-autoprefixer](https://github.com/sindresorhus/gulp-autoprefixer)
  * **Minification** using _gulp-minify-css_ (will be replaced by [gulp-clean-css](https://github.com/scniro/gulp-clean-css))
  * _More.. (coming soon)_
* Images
  * **Minification** using [gulp-imagemin](https://github.com/sindresorhus/gulp-imagemin)
  * _More.. (coming soon)_
