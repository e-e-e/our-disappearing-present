/* jshint esnext:true, globalstrict:true */
/* global module, require, console, setTimeout */

'use strict';

var ObjectId = require('mongodb').ObjectId;

const whitelist = 'whitelist';
const blocked_ips = 'blocked';
const collection = 'words';

class AdminDisappearing {
	
	constructor(db) {
		this.db = db;
	}

	find (id) {
		var _id = ObjectId(id);
		return this.db.collection(collection)
									.find({_id:_id})
									.limit(1)
									.next();
	}

	delete (id) {
		var _id = ObjectId(id);
		return this.db.collection(collection)
									.find({_id:_id})
									.limit(1)
									.next()
									.then(data=>{
										Promise.all( [
											this.db.collection(collection)
														 .remove({_id:_id}, {w:1}),
											this.db.collection(blocked_ips)
														 .insertOne({
																ip:data.ip,
																createdAt: new Date()
															})
											]);
									});
	}
}

class Disappearing {

	constructor(db) {
		this.db = db;
		this.count = 0;
		this.pressure = undefined;
		this.max_msgs = 1000;
		this.max_msg_length = 2000;
		this.max_life = 60*24*3; // three days
		this.min_life = 1; // one minute
		this.lifespan_range = this.max_life - this.min_life;
	}
	
	init () {
		return Promise.all([
			this.db.collection(collection) // make index on relation of messages and expires
				.createIndex({'_id':1,'rel':1, 'expiresAt': 1}),
			this.db.collection(collection) // make index on relation of messages and expires
				.createIndex({'rel':1, 'expiresAt': 1}),
			this.db.collection(collection) // set messages to expire at date field
				.createIndex({'expiresAt':1},{expireAfterSeconds:0}),
			this.db.collection(whitelist) // make index for whitelist of hosts
				.createIndex({host:1},{unique: true}),
			this.db.collection(blocked_ips)
				.createIndex({ "ip": 1},{unique: true}), // make index for ip addresses blocked
			this.db.collection(blocked_ips) // set ips to expire after 2 hours
				.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 7200 })
			])
			.then(() => this._update_count())
			.then(() => this);
	}

	block(ip) {
		return this.db.collection(blocked_ips)
									.insertOne({
										ip:ip,
										createdAt: new Date()
									});
	}

	is_blocked(ip) {
		return this.db.collection(blocked_ips)
									.find({ip:ip})
									.limit(1)
									.next();
	}

	is_whitelisted(host) {
		return this.db.collection(whitelist)
									.find({host:host})
									.limit(1)
									.next();
	}

	add_words (words) {
		return this.db.collection(collection)
									.insertOne(words, {w:-1});
	}

	get_words (rel, max, last_id) {
		//gets all things that start with rel.
		var regex = new RegExp('^'+escapeRegExp(rel)+'.*');
		var q = (rel)? {rel:regex, expiresAt:{$gt: new Date()}} : 
									 {expiresAt:{$gt: new Date()}};
		if(last_id!==undefined) q._id = {$lt:last_id};
		return this.db.collection(collection)
									.find(q, { ip:0 })
									.sort({ _id:-1 })
									.limit( max || 10)
									.toArray();
	}

	filter(words,ip,origin) {
		var createdAt = new Date();
		var expiresAt = new Date(createdAt);
		expiresAt.setSeconds(expiresAt.getSeconds()+this._lifespan(words.words.length));
		var sanitised = {
			createdAt: createdAt,
			expiresAt: expiresAt,
			ip: ip,
			origin:origin,
			name: words.name,
			words: (words.words.length > this.max_msg_length) ? 
							words.words.substring(0,this.max_msg_length) : 
							words.words,
			rel: words.rel
		};
		return sanitised;
	}

	_lifespan(length) {
		var l = (length-10) / this.max_msg_length;
		if (l<0) l =0;
		else if (l>1.0) l = 1.0;
		// inverse of pressure
		var p =(this.pressure>1.0)? 0 :
									(this.pressure<0)? 1 :
									 1.0 - this.pressure;
		var c = 1.0 - (this.count / this.max_msgs); //maximum msgs
		if(c<0) c=0;
		else if (c>1) c=1;
		return (this.min_life + this.lifespan_range*( ((c+p)/2) * (0.1+l*0.9) ))*60;
	}

	_update_count() {
		// need to factor into the descrepancy of time between execution
		// otherwise speed of retrieval also impacts message lifespan
		//console.log(this.count, this.pressure);
		return this.db.collection(collection).count()
				.then(c => { 
					var N = 100;
					if(this.pressure === undefined) this.pressure= 0.0;
					else this.pressure = (((N-1)*this.pressure) + (c - this.count))/ N;
					this.count = c;
				})
				.catch(err => console.log(err))
				.then(()=> setTimeout(this._update_count.bind(this),2000));
	}
}

function escapeRegExp(str) {
	return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

/*global exports:true*/
exports = module.exports = {
	Disappearing : Disappearing,
	AdminDisappearing: AdminDisappearing
};