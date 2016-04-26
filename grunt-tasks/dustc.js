/* jshint node: true, strict: false, esnext: true*/
/* globals module, require */
'use strict';

var execFile = require('child_process').execFile;
var path = require('path');

module.exports = function(grunt) {

	grunt.registerMultiTask('dustc', 'compile dust templates', function(){
	
	var options = this.options({
		compiler:'./node_modules/dustjs-linkedin/bin/dustc',
		pwd:'.'

		});

	var done = this.async();
	var count = 0;
	var expected = this.files.length;
	this.files.forEach( f => {

		var srcs = f.src.filter( fp => {
			if (!grunt.file.exists(fp)) {
				grunt.log.warn('Source file ' +fp + ' not found.');
				return false;
			} else return true;
		});

		if (srcs.length === 0) {
			grunt.log.warn('Destination ' + f.dest + ' not written because src files were empty.');
			done(false);
			return;
		}

		var folder = path.dirname(f.dest);
		if(!grunt.file.exists(folder) || !grunt.file.isDir(folder)) {
			grunt.file.mkdir(folder);
			grunt.log.writeln('made folder: '+folder );
		}

		execFile( options.compiler, ['--output', f.dest, '--pwd', options.pwd].concat(srcs),
			(error, stdout, stderr) => {
				if(stdout) grunt.log.writeln(stdout);
				if(stderr) grunt.log.writeln('stderr: ' + stderr);
				if (error !== null) {
					grunt.log.warn('exec error: ' + error);
					done(false);
				} else {
					grunt.log.writeln('successfully compiled');
					grunt.log.write('srcs:\t');
					grunt.log.writeln(srcs.join(',\n\t'));
					grunt.log.write('dest:\t');
					grunt.log.writeln(f.dest);
				}
				count++;
				if(count>=expected) done();
			});
		});

	});
	
};
