/* jshint esnext:true, globalstrict:true */
/* global module, require, console, setTimeout */

'use strict';

const collection = 'words';

class Disappearing {

	constructor(db) {
		this.db = db;
		this.count = 0;
		this.pressure = 0.0;
	}
	
	init () {
		return Promise.all([
			this.db.collection('words')
				.createIndex({'rel':1}),
			this.db.collection('words')
				.createIndex({'expiresAt':1},{expireAfterSeconds:0})
			])
			.then(() => this._update_count())
			.then(() => this);
	}

	_update_count() {
		//need to make it so that this is a running average
		//less susceptable to fluctuation
		//console.log(this.count, this.pressure);
		return this.db.collection('words').count()
				.then(c => { 
					var N = 100;
					this.pressure = (((N-1)*this.pressure) + (c - this.count))/ N;
					this.count = c;
				})
				.catch(err => console.log(err))
				.then(()=> setTimeout(this._update_count.bind(this),2000));
	}

	add_words (words) {
		return this.db.collection(collection)
									.insertOne(words, {w:-1});
	}

	get_words (rel, max) {
		//gets all things that start with rel.
		var regex = new RegExp('^'+escapeRegExp(rel)+'.*');
		var q = (rel)? {rel:regex} : {};
		return this.db.collection(collection)
									.find(q, { ip:0 })
									.sort({ _id:-1 })
									.limit( max || 30)
									.toArray();
	}

	filter(words,ip,origin) {
		var createdAt = new Date();
		var expiresAt = new Date(createdAt);
		//need to fix this
		expiresAt.setSeconds(expiresAt.getSeconds()+this.lifespan(words.words.length));
		var sanitised = {
			createdAt: createdAt,
			expiresAt: expiresAt,
			ip: ip,
			origin:origin,
			name: words.name,
			words: (words.words.length > 3000) ? 
							words.words.substring(0,3000) : 
							words.words,
			rel: words.rel
		};
		return sanitised;
	}

	lifespan(length) {
		var tmax = 60*24*3; // three days
		var tmin = 1;
		var trange = tmax - tmin;
		var l = (length-10) / 2000.0;
		if (l<0) l =0;
		else if (l>1.0) l = 1.0;
		// inverse of pressure
		var p =(this.pressure>1.0)? 0 :
									(this.pressure<0)? 1 :
									 1.0 - this.pressure;
		var c = 1.0 - (this.count / 1000.0); //maximum posts
		if(c<0) c=0;
		else if (c>1) c=1;
		return (tmin + trange*( ((c+p)/2) * (0.1+l*0.9) ))*60;
	}
}

function escapeRegExp(str) {
	return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

/*global exports:true*/
exports = module.exports = {
	Disappearing : Disappearing
};