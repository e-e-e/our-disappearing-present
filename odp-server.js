/* jshint esnext:true, globalstrict:true */
/* global require, module, console, __dirname */

'use strict';

var Disappearing = require('./model.js').Disappearing;

/*global exports:true*/
exports = module.exports = function (io, db, block) {
	var odp = new Disappearing(db);
	return odp.init()
						.then(db => setup(db,io,block));
};

function setup(odp,io, block) {
	// force websockets for server efficiency no polling
	io.set('transports', ['websocket']);
	//private global variables
	//do we need to keep count of those connected
	io.on('connection', init_connection );

	function init_connection(socket) {		
		var origin = socket.request.headers.origin;
		var ip = socket.handshake.headers['x-forwarded-for'] || socket.request.connection.remoteAddress;
		// console.log("connecting ",socket.handshake.headers['x-forwarded-for'],"or", socket.request.connection.remoteAddress);
		// need to check if origin is within whitelist and ip not within blocked list.
		if(block) {
			odp.is_whitelisted(origin).then( result => {
				console.log('is '+origin+' whitelisted?');
				if(result !== null) { // host on whitelist but is ip ok?
					return odp.is_blocked(ip);
				} else throw new Error('Not on whitelist');
			}).then( result => {
				console.log('is '+ ip + ' blocked?');
				if(result === null) {
					//else continue processing
					manage_connection(socket,origin,ip);
				} else throw new Error('IP is blocked.');
			}).catch( err => {
				console.log(err);
				// should let client know reason that they are disconnect. 
				socket.emit('kicked',{err:err});
				socket.disconnect();
			});
		} else {
			console.log('non-blocking connection to:', ip);
			manage_connection(socket,origin,ip);
		}
	}

	function manage_connection(socket, origin, ip) {
		var last_words = null;
		var last_messaged = Date.now();
		var kill_count = 0;
		var listening = '/';
		var talking;
		var talking_to = [];
		var last_id;

		// notify client of connection accepted
		socket.emit('connected', { stats:'ok'} );

		// should send info to construct neccessary 
		// need to send info on latest posts on the system - how many in the day
		// - most happening at - last post here was ... - how long ago. 
		// – Latest post was ...
		// this can be achieved by client peeking at the odp db

		socket.on('peek', (url,number) => {
			odp.get_words(url,number||1)
				.then(words => socket.emit('latest', { url:url, words:words}))
				.catch(err => socket.emit('err', err));
		});

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
				.then(words => {
					socket.emit('focused', words);
					last_id = (words.length>0)? words[words.length-1]._id : undefined;
				})
				.catch(err => socket.emit('err', err));
		});

		socket.on('more', () => {
			if(last_id) {
				odp.get_words(listening,10,last_id)
					.then(words => {
						console.log("more of "+last_id);
						socket.emit('update',words, last_id);
						last_id = (words.length>0)? words[words.length-1]._id : undefined;
					}).catch(err => socket.emit('err', err));
			}
			else socket.emit('update',[]);
		});

		socket.on('words', data => {
			// check posts per minute?
			var now = Date.now();
			var elapsed = now - last_messaged;
			last_messaged = now;
			var violations = 0;

			if(block){
				// violation if repeating and/or typing too quick 
				if (elapsed < 500) 
					violations++;
				if( last_words!==null && last_words.name === data.name && 
						last_words.words===data.words)
					violations++;
			}
			// validate data
			var words = odp.filter(data,ip,origin);

			if(block && violations) { // if > 0 
				// does not send to database if violated
				kill_count+= violations;
				if(kill_count>5) { // kills connection if repeated violoations 
					odp.block(ip);
					socket.emit('blocked',"Your IP has been blocked.");
					socket.disconnect();
				}
			} else {
				last_words = data;
				if( kill_count>0 ) kill_count--;
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
			}
			//send back to itself the words it just added.
			socket.emit('words',words);
		});

		// nothing to happen on disconnect so don't worry
		// socket.on('disconnect', () => console.log('disconnected'));

	}
}