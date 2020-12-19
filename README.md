# gulpfile-generator [![Build Status](https://github.com/simeg/gulpfile-generator/workflows/CI/badge.svg) [![codecov](https://codecov.io/gh/simeg/gulpfile-generator/branch/master/graph/badge.svg)](https://codecov.io/gh/simeg/gulpfile-generator)

Are you tired of always having to manually set up a `gulpfile.js` for every new project? Me too, that's why I've written this small tool that will generate the `gulpfile.js` for you, based on your needs.  

`gulpfile-generator` is an interactive tool to help your create your custom `gulpfile.js`. `gulpfile-generator` is run as an CLI where you will be asked for what tasks you want in your `gulpfile.js`. When it is done it will generate a `gulpfile.js` in the same folder as you are standing in. You can then optionally let it generate a file containing the exact `npm` command to install the dependencies you need for your `gulpfile.js`.

## Installation
Since you probably want to use this tool for multiple projects, it makes sense to let it live in your global `node_modules` folder (hence the `g` flag).
```bash
npm install -g gulpfile-generator
``` 

## Usage
```bash
gulpfile-generator
```
This will start up an interactive interface where you should follow the instructions.

## Supports
* **Development server** using [browser-sync](https://github.com/BrowserSync/browser-sync)
* JavaScript
  * **Minification** using [gulp-uglify](https://github.com/terinjokes/gulp-uglify)
  * **Concatenation** using [gulp-concat](https://github.com/contra/gulp-concat)
  * **JSHint** using [gulp-jshint](https://github.com/spalger/gulp-jshint)
  * **Compiling CoffeeScript** using [gulp-coffee](https://github.com/contra/gulp-coffee)
  * **Converting ES6 to ES5** using [gulp-babel](https://github.com/babel/gulp-babel)
* CSS
  * **LESS** using [gulp-less](https://github.com/plus3network/gulp-less)
  * **Sass** using [gulp-sass](https://github.com/dlmanning/gulp-sass)
  * **Stylus** using [gulp-stylus](https://github.com/stevelacy/gulp-stylus)
  * **Lint** using [gulp-csslint](https://github.com/lazd/gulp-csslint)
  * **Autoprefixer** using [gulp-autoprefixer](https://github.com/sindresorhus/gulp-autoprefixer)
  * **Minification** using _gulp-minify-css_ (will be replaced by [gulp-clean-css](https://github.com/scniro/gulp-clean-css))
* Images
  * **Minification** using [gulp-imagemin](https://github.com/sindresorhus/gulp-imagemin)

## Development
1. Install dependencies and make CLI available in root

    `make install link`

2. Do code changes
3. Run generator with

    `./gulpfile-generator`

4. Run linter and tests

    `make lint test`
