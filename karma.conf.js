// Karma configuration
// http://karma-runner.github.io/0.10/config/configuration-file.html

module.exports = function(config) {
  config.set({
    // base path, that will be used to resolve files and exclude
    basePath: '',

    // testing framework to use (jasmine/mocha/qunit/...)
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
	  'app/bower_components/jquery/dist/jquery.js',
	
      'app/bower_components/angular/angular.js',
      'app/bower_components/angular-mocks/angular-mocks.js',
      'app/bower_components/angular-resource/angular-resource.js',      
      'app/bower_components/angular-sanitize/angular-sanitize.js',
      'app/bower_components/angular-route/angular-route.js',
	  
	  'app/bower_components/angular-bootstrap/ui-bootstrap.js',
	  'app/bower_components/highcharts/highcharts-all.js',
	  'app/bower_components/highcharts-ng/dist/highcharts-ng.js',
	  'app/bower_components/ng-file-upload/angular-file-upload.min.js',
	  
	  'app/bower_components/spectrum/spectrum.js',
	  'app/bower_components/angular-spectrum-colorpicker/dist/angular-spectrum-colorpicker.min.js',
	  
	  'app/bower_components/angular-translate/angular-translate.min.js',
	  'app/bower_components/angular-translate-loader-static-files/angular-translate-loader-static-files.min.js',
	  
	  'app/bower_components/angular-dynamic-locale/src/tmhDynamicLocale.js',
	  'app/bower_components/angular-touch/angular-touch.js',
	  'app/bower_components/IndexedDBShim/dist/IndexedDBShim.js',
	  'app/bower_components/angular-local-storage/dist/angular-local-storage.min.js',
	  
	  
	  
      'app/scripts/*.js',
      'app/scripts/**/*.js',
      'test/mock/**/*.js',
      'test/spec/**/*.js'
    ],

    // list of files / patterns to exclude
    exclude: [],

    // web server port
    port: 8080,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: ['Chrome'],
	
	reporters: ['progress'],

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false
  });
};
