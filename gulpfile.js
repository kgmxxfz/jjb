var gulp = require('gulp');
var concat = require('gulp-concat');
var cleanCss = require('gulp-clean-css');
var optimizejs = require('gulp-optimize-js');
var watch = require('gulp-watch');
var replace = require('gulp-replace');
var preprocess = require('gulp-preprocess');
var argv = require('minimist')(process.argv.slice(2));

gulp.task('watch', function () {
  // watch many files
  watch([
    'manifest.json', '*.html',
    'static/*.js', 'static/style/*.css'
  ], function () {
    gulp.start('default');
  });
});

gulp.task('pack-popupjs', function () {
  gulp.src([
    'node_modules/jquery/dist/jquery.min.js',
    'node_modules/garlicjs/dist/garlic.min.js',
    'node_modules/tippy.js/dist/tippy.all.js',
    'node_modules/luxon/build/global/luxon.js',
    'node_modules/weui.js/dist/weui.min.js',
    'static/popup.js'
  ])
    .pipe(concat('bundle.js'))
    .pipe(optimizejs({
      sourceMap: true
    }))
    .pipe(replace('{{version}}', argv.version))
    .pipe(gulp.dest('build/static/js'));
  console.log("pack-js task done @", new Date())
    
});

gulp.task('pack-priceChart', function () {
  gulp.src([
    'node_modules/weui.js/dist/weui.min.js',
    'node_modules/@antv/g2/dist/g2.min.js',
    'static/priceChart.js'
  ])
  .pipe(concat('priceChart.js'))
  .pipe(replace('{{version}}', argv.version))
  .pipe(gulp.dest('build/static'));
  console.log("pack-priceChart task done @", new Date())

});

gulp.task('pack-contentjs', function () {
  return gulp.src([
    'node_modules/weui.js/dist/weui.min.js',
    'static/content_script.js'
  ])
  .pipe(concat('content_script.js'))
  .pipe(gulp.dest('build/static'));
});

gulp.task('pack-contentcss', function () {
  return gulp.src(['static/style/weui.min.css', 'static/style/style.css'])
    .pipe(concat('contentstyle.css'))
    .pipe(cleanCss())
    .pipe(gulp.dest('build/static/style'));
});

gulp.task('pack-css', function () {
  return gulp.src(['static/style/weui.min.css', 'static/style/popup.css'])
    .pipe(concat('popupstyle.css'))
    .pipe(cleanCss())
    .pipe(gulp.dest('build/static/style'));
});

gulp.task('move-static', [], function () {
  gulp.src([
    'static/audio/*.*', 'static/image/*.*', 'static/style/*.css'
  ], { base: './' })
    .pipe(gulp.dest('build'));
});

gulp.task('move-js', [], function () {
  gulp.src([
    'static/background.js', 
    'static/start.js',
    'node_modules/art-template/lib/template-web.js',
    'node_modules/jquery/dist/jquery.min.js',
    'node_modules/zepto/dist/zepto.min.js',
    'node_modules/lodash/lodash.min.js',
    'node_modules/logline/dist/logline.min.js',
    'node_modules/dialog-polyfill/dialog-polyfill.js',
    'node_modules/luxon/build/global/luxon.js',
    'node_modules/@sunoj/touchemulator/touch-emulator.js'
  ])
  .pipe(gulp.dest('build/static'));
});

gulp.task('move-file', [], function () {
  gulp.src([
    'manifest.json', '*.html'
  ])
    .pipe(replace('{{version}}', argv.version))
    .pipe(preprocess({
      context: {
        Browser: (argv.browser ? argv.browser : 'chrome')
      }
    }))
    .pipe(gulp.dest('build'));
});

gulp.task('default', ['move-static', 'move-file', 'move-js', 'pack-popupjs', 'pack-priceChart', 'pack-css', 'pack-contentcss', 'pack-contentjs']);

gulp.task('dev', ['default', 'watch']);