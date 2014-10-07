module.exports = function (grunt) {

  var saveLicense = require('uglify-save-license');
  // project configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    uglify: {
      my_target: {
        options: {
          preserveComments: saveLicense
        },    
        src: ['magiceye.js'],
        dest: 'magiceye.min.js' 
      }
    }
  });

  // load plugins
  grunt.loadNpmTasks('uglify-save-license');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // default tasks.
  grunt.registerTask('default', [
    'uglify'
  ]);
};
