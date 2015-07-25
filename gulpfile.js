/*global require */
var gulp = require('gulp');
var gutil = require('gulp-util');
var plumber = require('gulp-plumber');
var concat = require('gulp-concat');
var jshint = require('gulp-jshint');
var order = require('gulp-order');

gulp.task('scripts', function() {
    return gulp.src([
            'src/header.js',
            'src/async.js',
            'src/ajax.js',
            'src/jawa.core.js',
            'src/footer.js'
        ])
        .pipe(plumber(function(error) {
            gutil.log(error.message);
            this.emit('end');
        }))
        .pipe(concat('jawa.js'))
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(gulp.dest('dist'));
});

gulp.task('watch', function() {
    gulp.watch('src/*.js', ['scripts']);
});

gulp.task('default', ['scripts', 'watch']);
