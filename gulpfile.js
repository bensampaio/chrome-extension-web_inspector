// Modules
const minify = require('gulp-babel-minify');
const gulp = require('gulp');
const rename = require('gulp-rename');
const path = require('path');
const uglifycss = require('gulp-uglifycss');

// Folders
const cssFolder = path.join(__dirname, 'css');
const jsFolder = path.join(__dirname, 'js');
const distFolder = path.join(__dirname, 'dist');

// Files
const cssSrc = path.join(cssFolder, 'general.css');
const jsBackgroundSrc = path.join(jsFolder, 'background.js');
const jsInitSrc = path.join(jsFolder, 'init.js');

// CSS Tasks

gulp.task('css', () => {
	return gulp.src(cssSrc)
		.pipe(uglifycss())
		.pipe(rename('general.min.css'))
		.pipe(gulp.dest(distFolder));
});

// JS Tasks

gulp.task('js-copy', () => {
	const pathToJQuery = path.join('node_modules', 'jquery', 'dist', 'jquery.min.js');

	return gulp.src(pathToJQuery)
		.pipe(gulp.dest(distFolder));
});

gulp.task('js-background', () => {
	return gulp.src(jsBackgroundSrc)
		.pipe(minify())
		.pipe(rename('background.min.js'))
		.pipe(gulp.dest(distFolder));
});

gulp.task('js-init', () => {
	return gulp.src(jsInitSrc)
		.pipe(minify())
		.pipe(rename('init.min.js'))
		.pipe(gulp.dest(distFolder));
});

gulp.task('js', gulp.parallel('js-copy', 'js-background', 'js-init'));

// Watch Task
gulp.task('watch', () => {
	gulp.watch(cssSrc, gulp.series('css'));
	gulp.watch(jsBackgroundSrc, gulp.series('js-background'));
	gulp.watch(jsInitSrc, gulp.series('js-init'));
});

// Default task
gulp.task('default', gulp.parallel('css', 'js', 'watch'));