module.exports = function(grunt) {
	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		options: {
			src: "./html/src",
			dest: "./html/dist",
			config: grunt.file.readJSON('config.json')
		},
		jshint: {
			files: ['*.js',
							'./**/*.js',
							'!./node_modules/**/*.js',
							'!<%= options.dest %>/**/*',
							'!<%= options.src %>/client/views/**/*.js',
							'!<%= options.src %>/client/libs/*.js'
							],
			options: {
				node: true
			}
		},
		less: {
			files:{
				expand: true,     // Enable dynamic expansion.
				cwd: '<%= options.src %>',
				src: ['./**/*.less', '!./client/css/imports/*.less'], // Actual pattern(s) to match.
				dest: '<%= options.dest %>',   // Destination path prefix.
				ext: '.css',   // Dest filepaths will have this extension.
				extDot: 'first'   // Extensions in filenames begin after the first dot
			 }
		},
		dustc: {
			options: {
				compiler: 'dustc',
				pwd: "<%= options.src %>/client/views/"
			},
			files: {
				src:"<%= options.src %>/client/views/*.dust",
				dest: "<%= options.dest %>/client/views/views.js"
			}
		},
		copy: {
			html: {
				files:[{
					expand: true,     // Enable dynamic expansion.
					cwd: '<%= options.src %>',
					src: ['./**/*', '!./**/*.less','!./**/*.dust','!./client/*.js'], // Actual pattern(s) to match.
					dest: '<%= options.dest %>',
					filter: 'isFile'
			 }]
			},
			clientjs: {
				options: {
					process: function(content, path) {
						return grunt.template.process(content);
					}
				},
				files:[{
					expand: true,     // Enable dynamic expansion.
					cwd: '<%= options.src %>',
					src: ['./client/*.js'], // Actual pattern(s) to match.
					dest: '<%= options.dest %>',
					filter: 'isFile'
			 }]
			}
		}
	});

	// Load the plugins
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-newer');
	//load all tasks in folder grunt-tasks
	grunt.loadTasks('grunt-tasks');
	// Default task(s).
	grunt.registerTask('default', ['jshint', "less","dustc", "newer:copy"]);// 

};