/* jshint esnext:true, globalstrict:true */
/* global require, console, __dirname */

"use strict";

// libraries need for serving content
var fs = require('fs');
var express	= require('express');
var MongoClient = require('mongodb').MongoClient;

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

//middle ware to handle cors locally.
app.use((req, res, next)=>{
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

app.use('/', express.static('./html/dist/'));
app.use('/', (req,res)=> res.sendFile(__dirname + '/html/dist/basic.html'));
app.use('/:room', (req,res)=> res.sendFile(__dirname + '/html/dist/basic.html'));

MongoClient.connect(config.mongodb.url,config.mongodb.options)
	.then( db => odp_server(io, db, config.block) )
	.then(() => {
		server.listen(port, () => {
			console.log('Express server listening on port ' + port);
		});
	}).catch(err => {
		console.log('FAILED TO LOAD OUR DISAPPEARING PRESENT', err, err.stack);
	});
	