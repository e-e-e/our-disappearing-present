/* jshint esnext:true, globalstrict:true */
/* global require, console, __dirname */

"use strict";

// libraries need for serving content
var fs = require('fs');
var express	= require('express');

var config = require('./config.json');

var port = config.port;
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var helmet	= require('helmet');
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');

var odp_server = require("./odp-server.js");

app.use(helmet());
app.use(helmet.noCache());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(errorHandler());
app.use('/', express.static('./public'));
app.use('/', (req,res)=> res.sendFile(__dirname + '/public/basic.html'));
app.use('/:room', (req,res)=> res.sendFile(__dirname + '/public/basic.html'));

odp_server(io, config.mongodb.url,config.mongodb.options).then( ()=> {
	server.listen(port, () => {
	  console.log('Express server listening on port ' + port);
	});
}).catch(err => {
	console.log('FAILED TO LOAD OUR DISAPPEARING PRESENT', err, err.stack);
});