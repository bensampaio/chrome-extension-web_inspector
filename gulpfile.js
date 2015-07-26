// Modules
var
	gulp = require('gulp'),
	rename = require('gulp-rename'),
	uglifycss = require('gulp-uglifycss'),
	uglifyjs = require('gulp-uglify');

// Folders
var 
	cssFolder = __dirname + '/css',
	jsFolder = __dirname + '/js',
	distFolder = __dirname + '/dist';

// Files
var
	cssSrc = cssFolder + '/general.css',
	jsBackgroundSrc = jsFolder + '/background.js',
	jsInitSrc = jsFolder + '/init.js';

// Default Task
gulp.task('default', [ 'css', 'js', 'watch' ]);

// CSS Task
gulp.task('css', function() {
	return gulp.src(cssSrc)
		.pipe(uglifycss())
		.pipe(rename('general.min.css'))
		.pipe(gulp.dest(distFolder));
});

// JS Tasks
gulp.task('js', [ 'js-copy', 'js-background', 'js-init' ]);

gulp.task('js-copy', function() {
	return gulp.src('bower_components/jquery/dist/jquery.min.js').pipe(gulp.dest(distFolder));
});

gulp.task('js-background', function() {
	return gulp.src(jsBackgroundSrc)
		.pipe(uglifyjs())
		.pipe(rename('background.min.js'))
		.pipe(gulp.dest(distFolder));
});

gulp.task('js-init', function() {
	return gulp.src(jsInitSrc)
		.pipe(uglifyjs())
		.pipe(rename('init.min.js'))
		.pipe(gulp.dest(distFolder));
});

// Watch Task
gulp.task('watch', function() {
	gulp.watch(cssSrc, [ 'css' ]);
	gulp.watch(jsBackgroundSrc, [ 'js-background' ]);
	gulp.watch(jsInitSrc, [ 'js-init' ]);
});