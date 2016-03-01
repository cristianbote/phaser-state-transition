// Karma configuration
// Generated on Sun Feb 28 2016 00:41:45 GMT+0200 (GTB Standard Time)

module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['browserify', 'jasmine'],
    files: [
      'test/mocks/**/*.js',
      'test/unit/**/*.spec.js'
    ],
    preprocessors: {
      'test/unit/**/.js': ['browserify']
    },
    reporters: ['spec'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ['PhantomJS'],
    singleRun: true,
    concurrency: Infinity,
    browserify: {
      debug: true
    }
  })
};
