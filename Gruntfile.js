module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		jshint: {
			files: ['Gruntfile.js', 
							'*.js', './**/*.js',
							'!./node_modules/**/*.js', 
							'!./public/client/views/*.js',
							'!./public/client/libs/*.js'
							],
			options: {
				node: true
			}
		},
		less: {
			files:{
				expand: true,     // Enable dynamic expansion.
				src: ['./public/**/*.less', '!./public/client/css/mixin.less'], // Actual pattern(s) to match.
				dest: '.',   // Destination path prefix.
				ext: '.css',   // Dest filepaths will have this extension.
				extDot: 'first'   // Extensions in filenames begin after the first dot
			 }
		},
		dustc: {
			options: {
				compiler: 'dustc',
				pwd: "./public/client/views/"
			},
			files: {
				src:"./public/client/views/*.dust",
				dest: "./public/client/views/views.js"
			}
		}
	});

	// Load the plugins
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-less');
	//load all tasks in folder grunt-tasks
	grunt.loadTasks('grunt-tasks');
	// Default task(s).
	grunt.registerTask('default', ['jshint', "less","dustc"]);// 

};