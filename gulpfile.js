// ITC Marking: Export Controlled - Created at UTRC-I, ECCN NLR
// Copyright UTRC 2016

'use strict';

// file globs
var outputPath = 'dist/',
    htmlSrcs = ['src/**/*.html'],
    jsSrcs = 'src/**/*.js',
    tsSrcs = ['src/**/*.ts', 'typings/browser/**/*.ts'],
    bowerFolder = 'bower_components',
    resourcesFolder = 'src/resources',
    typingsFolder = 'typings',
    cssSrcs = [
        'src/styles.css',
        bowerFolder + '/bootstrap/dist/css/bootstrap.css',
        resourcesFolder + '/w2ui-1.5/w2ui.min.css'],
    bowerSrcs = "",
    customResources= [resourcesFolder+'/into-cps/**/*']
    ;

// Gulp plugins
var gulp = require('gulp'),
    ts = require('gulp-typescript'),
    sourcemap = require('gulp-sourcemaps'),
    tsProject = ts.createProject('tsconfig.json'),
    del = require('del'),
    mainBowerFiles = require('main-bower-files'),
    filter = require('gulp-filter'),
    debug = require('gulp-debug'),
    typings = require('gulp-typings'),
    bower = require('gulp-bower'),
    merge = require('merge-stream'),
    electron = require('gulp-electron'),
    packager = require('electron-packager'),
    packageJSON = require('./package.json'),
    webpack = require('webpack'),
    htmlhint = require("gulp-htmlhint"),
    runSequence = require('run-sequence'),
    conventionalChangelog = require('gulp-conventional-changelog'),
    conventionalGithubReleaser = require('conventional-github-releaser'),
    bump = require('gulp-bump'),
    gutil = require('gulp-util'),
    git = require('gulp-git'),
    fs = require('fs')
    ;

// Tasks

// Release Management
gulp.task('changelog', function () {
  return gulp.src('CHANGELOG.md', {
    buffer: false
  })
    .pipe(conventionalChangelog({
      preset: 'angular' // Or to any other commit message convention you use.
    }))
    .pipe(gulp.dest('./'));
});

gulp.task('github-release', function(done) {
  conventionalGithubReleaser({
    type: "oauth",
    token: '0126af95c0e2d9b0a7c78738c4c00a860b04acc8' // change this to your own GitHub token or use an environment variable
  }, {
    preset: 'angular' // Or to any other commit message convention you use.
  }, done);
});

gulp.task('bump-version', function () {
// We hardcode the version change type to 'patch' but it may be a good idea to
// use minimist (https://www.npmjs.com/package/minimist) to determine with a
// command argument whether you are doing a 'major', 'minor' or a 'patch' change.
  return gulp.src(['./bower.json', './package.json'])
    .pipe(bump({type: "patch"}).on('error', gutil.log))
    .pipe(gulp.dest('./'));
});

gulp.task('commit-changes', function () {
  return gulp.src('.')
    .pipe(git.add())
    .pipe(git.commit('[Prerelease] Bumped version number'));
});

gulp.task('push-changes', function (cb) {
  git.push('origin', 'master', cb);
});

gulp.task('create-new-tag', function (cb) {
  var version = getPackageJsonVersion();
  git.tag(version, 'Created Tag for version: ' + version, function (error) {
    if (error) {
      return cb(error);
    }
    git.push('origin', 'master', {args: '--tags'}, cb);
  });

  function getPackageJsonVersion () {
    // We parse the json file instead of using require because require caches
    // multiple calls so the version number won't be updated
    return JSON.parse(fs.readFileSync('./package.json', 'utf8')).version;
  };
});

gulp.task('release', function (callback) {
  runSequence(
    'bump-version',
    'changelog',
    'commit-changes',
    'push-changes',
    'create-new-tag',
    'github-release',
    function (error) {
      if (error) {
        console.log(error.message);
      } else {
        console.log('RELEASE FINISHED SUCCESSFULLY');
      }
      callback(error);
    });
});

// Install typings
gulp.task("install-ts-defs", function () {
    gulp.src("./typings.json")
        .pipe(typings());
});

// Install bower components
gulp.task('install-bower-components', function () {
    return bower();
});

// Clean everything!
gulp.task("clean", function () {
    return del([
        outputPath
    ]);
});

// Compile TS->JS with sourcemaps. Also move it into the outputfolder
gulp.task("compile-ts", function () {
    var tsResult = gulp.src(tsSrcs)
        .pipe(sourcemap.init())
        .pipe(ts(tsProject));

    tsResult.dts.pipe(gulp.dest(outputPath));

    return tsResult.js.pipe(sourcemap.write())
        .pipe(gulp.dest(outputPath));
});

// Compile Angular 2 application
gulp.task('compile-ng2', function(callback) {
    webpack(require('./webpack.config.js'), function() {
        callback();
    });
});

// Copy important bower files to destination
// mainBowerFiles does not take jquery-ui and jquery-layout
gulp.task('copy-bower', function () {
    var path1 = gulp.src(mainBowerFiles())
        .pipe(filter('**/*.js'))
        .pipe(gulp.dest(outputPath + bowerFolder));
    var path2 = gulp.src(bowerSrcs).pipe(gulp.dest(outputPath + bowerFolder));
    return merge(path1, path2);
});

// Copy bootstrap fonts to destination
gulp.task('copy-fonts', function () {
    return gulp.src(bowerFolder + '/bootstrap/fonts/**/*').pipe(gulp.dest(outputPath + 'fonts'))
});

// Copy custom resources
gulp.task('copy-custom',function (){
    return gulp.src(customResources)
        .pipe(gulp.dest(outputPath+'resources/into-cps'))
});

// Copy css to app folder
gulp.task('copy-css', function () {
    gulp.src(cssSrcs).pipe(gulp.dest(outputPath + 'css'));
});

// Copy html to app folder
gulp.task('copy-html', function () {
    gulp.src(htmlSrcs)
        .pipe(htmlhint({
            "attr-lowercase": ["*ngIf", "*ngFor", "[(ngModel)]", "[formGroup]", "[formControl]", "(ngSubmit)", "#configForm", "[basePath]", "(pathChange)", "[ngModel]", "(ngModelChange)", "[ngValue]", "[ngModelOptions]"],
            "doctype-first": false
        }))
        .pipe(htmlhint.reporter())
        .pipe(gulp.dest(outputPath));
});

// Copy js to app folder
gulp.task('copy-js', function () {
    gulp.src(jsSrcs)
    // process js here if needed
        .pipe(gulp.dest(outputPath));
});

// Grab non-npm dependencies
gulp.task('init', ['install-ts-defs', 'install-bower-components']);

//Build App
gulp.task('build', ['compile-ts', 'compile-ng2', 'copy-js', 'copy-html', 'copy-css',
  'copy-bower', 'copy-fonts','copy-custom']);

// Package app binaries
gulp.task("package-darwin", function(callback) {
    var options = {
        dir: '.',
        name: packageJSON.name+'-'+packageJSON.version,
        platform: "darwin",
        arch: "x64",
        version: "1.2.1",
        overwrite:true,
        icon: 'src/resources/into-cps/appicon/into-cps-logo.png.icns',
        out: 'pkg',
        "app-version": packageJSON.version,
        "version-string": {
            "CompanyName": packageJSON.author.name,
            "ProductName": packageJSON.productName
        }
    };
    packager(options, function done (err, appPath) {
        if(err) { return console.log(err); }
        callback();
    });
});

gulp.task("package-win32", function(callback) {
    var options = {
        dir: '.',
        name: packageJSON.name+'-'+packageJSON.version,
        platform: "win32",
        arch: "all",
        version: "1.2.1",
        overwrite:true,
        icon: 'src/resources/into-cps/appicon/into-cps-logo.png.ico',
        out: 'pkg',
        "app-version": packageJSON.version,
        "version-string": {
            "CompanyName": packageJSON.author.name,
            "ProductName": packageJSON.productName
        }
    };
    packager(options, function done (err, appPath) {
        if(err) { return console.log(err); }
        callback();
    });
});

gulp.task("package-linux", function(callback) {
    var options = {
        dir: '.',
        name: packageJSON.name+'-'+packageJSON.version,
        platform: "linux",
        arch: "x64",
        version: "1.2.1",
        overwrite:true,
        out: 'pkg',
        "app-version": packageJSON.version,
        "version-string": {
            "CompanyName": packageJSON.author.name,
            "ProductName": packageJSON.productName
        }
    };
    packager(options, function done (err, appPath) {
        if(err) { return console.log(err); }
        callback();
    });
});

gulp.task('package-all',['package-win32','package-darwin','package-linux']);

// Watch for changes and rebuild on the fly
gulp.task('watch', function () {
    gulp.watch(htmlSrcs, ['copy-html']);
    gulp.watch(jsSrcs, ['copy-js']);
    gulp.watch(tsSrcs, ['compile-ts']);
    gulp.watch(cssSrcs, ['copy-css']);
    gulp.watch(customResources, ['copy-custom']);
});

// Default task
gulp.task('default', ['build']);
