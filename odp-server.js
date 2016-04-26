/* jshint esnext:true, globalstrict:true */
/* global require, module, console, __dirname */

'use strict';

var Disappearing = require('./model.js').Disappearing;
var MongoClient = require('mongodb').MongoClient;

/*global exports:true*/
exports = module.exports = function (io, mongo_url, mongo_options) {
	return MongoClient.connect(mongo_url,mongo_options)
				.then(db => {
					var odp = new Disappearing(db);
					return odp.init();
				})
				.then(db => setup(db,io));
};

function setup(odp,io) {
	// force websockets for server efficiency
	io.set('transports', ['websocket']);
	//private global variables
	//do we need to keep count of those connected

	io.on('connection', function (socket) {
		//var ref = socket.request.headers.referer;
		var listening = '/';
		var talking;
		var talking_to = [];
		var origin = socket.request.headers.origin;
		var ip = socket.handshake.headers['x-forwarded-for'] || socket.request.connection.remoteAddress;

		//notify client of connection accepted
		//should send info to construct neccessary 
		socket.emit('connected', { stats:'ok'} );

		socket.on('focus',focus => {
			//set relation that client listens to
			//if ending with / listen to rel without trailing /
			socket.leave(listening);
			listening = ( (focus.listening_to.endsWith('/')) ? 
									focus.listening_to.slice(0,-1) : 
									focus.listening_to ) || '/';
			socket.join(listening);
			console.log('listening to:' + listening);

			if(focus.talking_to != talking) {
				talking = focus.talking_to;
				//set the channels that client talks to
				talking_to = ['/'];
				talking.split('/')
					.reduce((p, c, i) => {
						var v = p+'/'+c;
						if(c) talking_to.push(v);
						else return p;
						return v;
					}, '');
				talking_to.reverse();
			}

			// get and return words with relation
			odp.get_words(listening)
				.then(words => socket.emit('focused', words))
				.catch(err => socket.emit('err', err));
		});

		socket.on('words', data => {
			// check posts per minute?
			// validate data
			// calculate time to live
			var words = odp.filter(data,ip,origin);
			// add to db
			odp.add_words(words)
				//.then(r => console.log(r) )
				.catch(e => console.log(e,e.stack));
			
			words.ip = '';

			// broadcast to all listening
			// eg /, /this, /this/and_this/
			talking_to.forEach( r => {
				//console.log("emited to:", r);
				socket.broadcast.to(r).emit('words',words);
			});
			//send back to itself the words it jsut added.
			socket.emit('words',words);
		});

		socket.on('disconnect', () => console.log('disconnected'));

	});

}