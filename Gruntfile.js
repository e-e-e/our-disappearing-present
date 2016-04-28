module.exports = function(grunt) {
	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		options: {
			src: "./html/src",
			dest: "./html/dist",
			config: grunt.file.readJSON('config.json')
		},
	});

	grunt.loadNpmTasks('grunt-newer');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.config("jshint",{
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
	});

	grunt.loadNpmTasks('grunt-contrib-less');
	var less_theme = {
		options:{
			modifyVars: {
				theme:"<%= grunt.task.current.target %>",
			}
		},
		files:[{
			expand: true,     // Enable dynamic expansion.
			cwd: '<%= options.src %>',
			src: ['./**/*.less', '!./client/css/imports/**/*.less'], // Actual pattern(s) to match.
			dest: '<%= options.dest %>',   // Destination path prefix.
			ext: '<% if(grunt.task.current.target!=="default") { %>.<%= grunt.task.current.target %><% } %>.css',   // Dest filepaths will have this extension.
			extDot: 'first'   // Extensions in filenames begin after the first dot
		}]
	};
	grunt.config("less",{
		default: less_theme,
		hydrogen: less_theme,
	});

	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.config('copy', {
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
	});

	//watch
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.config('watch', {
		html:{
			files: './html/src/**/*',
			tasks: ['newer:jshint', "less","newer:dustc", "newer:copy"]
		}
	});

	//load all tasks in folder grunt-tasks
	grunt.loadTasks('grunt-tasks');
	grunt.config("dustc",{
		options: {
			compiler: 'dustc',
			pwd: "<%= options.src %>/client/views/"
		},
		files: {
			src:"<%= options.src %>/client/views/*.dust",
			dest: "<%= options.dest %>/client/views/views.js"
		}
	});

	// Default tasks.
	grunt.registerTask('default', ['jshint', "less","dustc", "newer:copy"]);// 

};