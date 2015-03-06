'use strict';

var linterPipe = require('gulp-one-guide');

var filesToLint = [
    'lib/**/*.js',
    'test/**/*.js',
    'tools/**/*.js',
    '*.js'
];

var excludeFiles = [
    '**/node_modules/**'
];

module.exports = function (gulp) {
    gulp.task('lint', function () {
        return this.src(filesToLint).pipe(linterPipe({
            root: process.cwd(),
            config: 'yandex-node',
            excludes: excludeFiles
        }));
    });
};
