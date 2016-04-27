
var io_options = {transports: ['websocket']};
var host = 'http://128.199.109.140';
var iohost = host;

var io = require("socket.io-client");


var c = 0;
while(c++ < 20){
	setTimeout( new_client.bind({c:c}),Math.random()*400);
}

function new_client() {
	client('client_'+this.c, '/this/or/this/and/this',10);
}

// simple client model

function client (name, rel, num) {
	
	var count = num || 100;
	var socket = io.connect(iohost, io_options);

	var focus = {
		listening_to:rel,
		talking_to: rel
	};

	socket.on('connected', function() {
		//if connected make new window.
		socket.emit('focus',focus);
		console.log(name + 'connected');	});

	socket.on('focused', function(words) {
		console.log(name +'fucused recieved ' + words.length + 'messages');
		setTimeout(send_message, delay());
	});

	socket.on('words', function (words) {
		//console.log('recieved new words');
		//console.log(words);
	});

	socket.on('error', function (e) {
		console.log(name + 'error');
		console.log(e);
	});

	function send_message() {
		if(--count >=0) {
			console.log(name+' sent message');
			socket.emit("words", {
				rel:focus.talking_to,
				words: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
				name: name
			});
			setTimeout(send_message, delay());
		} else {
			console.log(name +'disconnected');	
			socket.disconnect();
		}
	}
}

function delay() {
	return 10000 + Math.random()*4000;
}
