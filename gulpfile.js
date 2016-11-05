var gulp = require('gulp'),
    plumber = require('gulp-plumber'),
    rename = require('gulp-rename');
var coffee = require('gulp-coffee');
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var babel = require('gulp-babel');
var uglify = require('gulp-uglify');
var browserSync = require('browser-sync');

var SOURCE = 'src/scripts';
var DEST = 'dist/scripts';
var OUTPUT_FILE = 'main.js';
var SERVER_BASE_DIR = './';
var WATCH_FILE_EXTENSIONS = ['*.html'];

gulp.task('browser-sync', function() {
  browserSync({
    server: {
      baseDir: SERVER_BASE_DIR
    }
  });
});

gulp.task('bs-reload', function() {
  browserSync.reload();
});

gulp.task('scripts', function() {
  return gulp.src(SOURCE + '/**/*.coffee')
    .pipe(plumber({
      errorHandler: function(error) {
        console.log(error.message);
        this.emit('end');
    }}))
    .pipe(coffee({bare: true}))
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(concat(OUTPUT_FILE))
    .pipe(babel())
    .pipe(gulp.dest(DEST + '/'))
    .pipe(rename({suffix: '.min'}))
    .pipe(uglify())
    .pipe(gulp.dest(DEST + '/'))
    .pipe(browserSync.reload({stream:true}))
});

gulp.task('default', ['browser-sync'], function() {
  gulp.watch(SOURCE + '/**/*.coffee', ['scripts']);
  gulp.watch(WATCH_FILE_EXTENSIONS, ['bs-reload']);
});
