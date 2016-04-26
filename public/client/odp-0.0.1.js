(function() {
//	"use strict";
	// CONFIG
	var io_options = {transports: ['websocket']};
	var host = 'http://128.199.109.140';//http://localhost:8080';//
	var iohost = host;

	// ----- simple query variables -----

	var queries = (function(a) {
		if (a === "") return {};
		var b = {};
		for (var i = 0; i < a.length; ++i) {
			var p=a[i].split('=', 2);
			if (p.length == 1)
				b[p[0]] = "";
			else
				b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
		}
		return b;
	})(window.location.search.substr(1).split('&'));

	// ----- cookie functions -----

	var Cookies = {
		create: function (name,value,days) {
			var expires = "";
			if (days) {
				var date = new Date();
				date.setTime(date.getTime()+(days*24*60*60*1000));
				expires = "; expires="+date.toGMTString();
			}
			document.cookie = name+"="+value+expires+"; path=/";
		},
		read: function (name) {
			var nameEQ = name + "=";
			var ca = document.cookie.split(';');
			for(var i=0;i < ca.length;i++) {
				var c = ca[i];
				while (c.charAt(0)==' ') c = c.substring(1,c.length);
				if (c.indexOf(nameEQ) === 0) 
					return c.substring(nameEQ.length,c.length);
			}
			return null;
		},
		erase: function (name) {
			this.create(name,"",-1);
		}
	};
	// ----- preloading functions -----

	function load_script(url, fn) {
		var script = document.createElement('script');
		script.type = 'text/javascript';
		//script.async = false;
		script.src = url;
		var done = false;
		script.onload = script.onreadystatechange = function() {
			if ( !done && (!this.readyState ||
				this.readyState === "loaded" || 
				this.readyState === "complete") ) 
			{
				done = true;
				fn();
					// Handle memory leak in IE
				script.onload = script.onreadystatechange = null;
				if ( head && script.parentNode ) {
					head.removeChild( script );
				}
			}
		};
		var head = document.getElementsByTagName("head")[0] || document.documentElement;
		head.insertBefore(script, head.firstChild);
	}

	function load_css (file,css_id) {
		var cssId = css_id || 'o-d-p-css';
		if (!document.getElementById(cssId))
		{
			var head  = document.getElementsByTagName('head')[0];
			var link  = document.createElement('link');
			link.id   = cssId;
			link.rel  = 'stylesheet';
			link.type = 'text/css';
			link.href = file;
			link.media = 'all';
			head.insertBefore(link, head.firstChild);
		}
	}

	// ----- BEGIN -----

	var to_load = [ '/client/libs/jquery-1.11.3.js',
									'/socket.io/socket.io.js',
									'/client/libs/dust-core.min.js' ];
	
	(function preload(to_load) {
		
		var counter = to_load.length;
		load_css(host+'/client/css/odp.css');
		for(var i=0; i<to_load.length; i++) {
			load_script(host+to_load[i], loaded);
		}

		function loaded() { 
			if(--counter === 0){
				//if all other scripts are loaded then load views and init program
				load_script(host+'/client/views/views.js', function(){
					$(document).ready(init); 
				});
			}
		}
	})(to_load);

	// ----- MAIN -----

	function init() {

		var socket = io.connect(iohost, io_options);
		var odp = new ODPWindow(socket);

		// erasure.
		setInterval(erasure,100);

		socket.on('connected', function() {
			//if connected make new window.
			reveal_odp();
			//check if query has odp name
			//if so open window and set to relative
			if(queries.odp) {
				Cookies.create('odp-handle',decodeURI(queries.odp));
				odp.open();
			}
		});

		socket.on('focused', function(words) {
			if(odp) odp.focused(words);
		});

		socket.on('words', function (words) {
			if(odp) odp.add(words);
		});

		function reveal_odp () {
			$('div#our-disappearing-present').not('.active').css({
					display:"inherit"
				}).addClass('active').each(function(){
					var button = $(this);
					if(!button.hasClass('round')){
						if(button.data('odp-rel')) {
							button.text('comment');
						} else {
							button.text('our disappearing present...');
						}
					}
				}).click(function() {
					//open window and focus on rel
					var rel =$(this).data("odp-rel");
					//filter odp-relation data.
					odp.open( sanitise_relation(rel));
				});
		}

		function erasure () {
			reveal_odp();
			var now = Date.now();
			$('.odp-expires').each(function (i,e){
				var el = $(this);
				var expires = el.data('expires').getTime()-now;
				fade_message(el,expires);
			});
		}
	}

	function fade_message(msg,expires) {

		if(expires<=0) {
			msg.closest('li').slideUp('slow',function(){ $(this).remove();});
		} if (expires < 60000) {
			msg.closest('li').css('opacity',expires/60000.0);
		}
		var seconds = Math.ceil(expires/1000);
		var minutes = Math.floor(seconds/60);
		var hours = Math.floor(minutes/60);

		msg.text( ((hours>0)? hours +'h ' :'') + 
							((minutes>0)? minutes%60 +'m ' :'') +
							seconds%60 +'s' );
	}

	// CLASS FOR MANAGING ODP INTERFACE

	function ODPWindow(socket) {
		this.ids = {
			window:'#odp-popup',
			input: 'textarea#odp-m',
			name: 'input#odp-n',
			head: '#odp-head',
			body: '#odp-body',
			content: '#odp-msgs',
			focus: '#odp-focus',
			listening_to: '#odp-listening-to',
			talking_to: '#odp-talking-to',
			tabs: '#odp-tabs > span',
			info: '#odp-info',
			popup: '#odp-popup'
		};

		this.socket = socket;
		this.focus = {
			listening_to: '',
			talking_to: undefined
		};
		this.opened = false;
		this.loading = false;
		this.even_odd = false;
	}

	ODPWindow.prototype.open = function open(rel) {
		var popup = document.getElementById('odp-popup');
		// set talking_to via data attribute or as pathname
		var tmp_rel = (rel) ? rel : this._get_pathname() ;
		if(!this.focus.talking_to || (tmp_rel && tmp_rel!=='/')) {
			this.focus.talking_to = tmp_rel;
		}

		if (!popup) {
			//make popup first;
			dust.render('o-d-p-popup',{}, this._after_open.bind(this));
		}
		// set active tab.
		$('div#odp-tabs > span').removeClass('active');
		// use tmp_rel if we want that everything is chosen when odp button
		// without a data-attribute is clicked.
		if(this.focus.talking_to !== '/') {
			$('div#odp-tabs span.relative').addClass('active');
		} else {
			//should probably hide relative tab as this is then equivilent
			$('div#odp-tabs span.everything').addClass('active');
		}
		$(this.ids.info).hide();
		$(this.ids.content).show();
		$(this.ids.popup).css({left:($(window).width()-$('#odp-popup').width())/2}).slideDown('fast');
		// focus on the current relation.
		this.focus_on(this.focus.talking_to);
		this.opened = true;
	};

	//append to body and setup event handlers after popup has been rendered
	ODPWindow.prototype._after_open = function(err,output) {
		if(err) { 
			console.log(err);
			return;
		}
		//make popup and attach to body
		var el = $(output);
		el.hide().appendTo('body');
		// attach event handers
		// submit on keypress within textarea input
		el.find(this.ids.input).on('keypress', this._keypress.bind(this));
		// submit form
		el.find('form').submit(this._submit.bind(this));
		// close window
		el.find('.odp-close').click(this.close.bind(this));
		// listen for tab changes
		el.find(this.ids.tabs).click(this.change_tab.bind(this));
		// set user handle from cookie - updated cookie when user changes
		el.find(this.ids.name).on('change',function(){
			Cookies.create('odp-handle',$(this).val());
		}).val(Cookies.read('odp-handle') || 'anonymous');
		// attach handler for dragging
		el.find(this.ids.head).on('mousedown',function(e){
			e.preventDefault();
			var parent = $(this).parent();
			var parentOffset = parent.offset();
			var relX = e.pageX - parentOffset.left;
			var relY = e.pageY - parentOffset.top;
			$(this).addClass('odp-dragging');
			$('body').on('mousemove',function(e) {
					parent.offset({
						top: e.pageY - relY,
						left: e.pageX - relX
					});
					e.preventDefault();
					return false;
				});
			return false;
		}).on('mouseup',function() {
			$('body').off('mousemove');
			$(this).removeClass('odp-dragging');
		});
	};

	ODPWindow.prototype._get_pathname = function () {
		return window.location.pathname;
	};

	ODPWindow.prototype.close = function() {
		$(this.ids.window).hide();
		$(this.ids.content).show();
		$(this.ids.info).hide();
		
		this.opened = false;
		//do anything like don't listen for anymore odp messages
	};

	ODPWindow.prototype.change_tab = function(event) {
		// visually shift tabs
		var tab = $( event.target );
		if(!tab.hasClass('active')) {
			$(this.ids.tabs).removeClass('active');
			var rel = tab.data('odp-tab');
			tab.addClass('active');
			//do anything like don't listen for anymore odp messages
			if(rel==='everything') {
				$(this.ids.info).hide();
				$(this.ids.content).show();
				this.focus_on();
			} else if (rel === 'relative') {
				$(this.ids.info).hide();
				$(this.ids.content).show();
				this.focus_on(this.focus.talking_to);
			} else {
				$(this.ids.info).show();
				$(this.ids.content).hide();
				$(this.ids.info).parent().scrollTop(0);
			}
		}
	};

	ODPWindow.prototype.focus_on = function (rel) {
		//what to do when focused on a relation
		if(!rel || rel ==='/') {
			//make rel = base
			rel = '';
		}
		this.focus.listening_to = rel;
		// focus on means listen to:
		this.socket.emit('focus',this.focus);
		this._loading();
		
	};

	ODPWindow.prototype._loading = function () {
		this.loading = true;
		$(this.ids.content).empty();
		$(this.ids.body).addClass('loading');
		//$(this.ids.focus).text('loading...');
	};

	ODPWindow.prototype._loaded = function () {
		this.loading = false;
		$(this.ids.content).empty();
		$(this.ids.body).removeClass('loading');
	};

	ODPWindow.prototype.focused = function (words) {
		this._loaded();
		$(this.ids.listening_to).text('listening to ' + (this.focus.listening_to || 'everything'));
		$(this.ids.talking_to).text('talking to ' + (this.focus.talking_to || 'everything'));
		this.add(words);
	};

	ODPWindow.prototype._keypress = function (e){
		if(e.which===13 && !e.shiftKey) {
			return this._submit(e);
		}
	};

	ODPWindow.prototype._submit = function (e) {
		if(e) e.preventDefault();
		var words = {
			rel:this.focus.talking_to,
			words: $(this.ids.input).val(),
			name: $(this.ids.name).val()
		};
		//broadcast message
		if( !this.loading && words.words ) {
			this.socket.emit('words', words);
			$(this.ids.input).val('');
		}	else {
			//need to alert that they need to write something to comment
			//or if not loaded wait until loaded.
		}
		// clear input
		return false;
	};

	ODPWindow.prototype.add = function (w) {

		//check if at bottom 
		var body = $("#odp-body");
		var bottom = (body.scrollTop() + body.innerHeight() >= body[0].scrollHeight - 20);

		if(w instanceof Array) {
			for (var i= w.length-1; i>=0; i--) 
				this._append_message(w[i]);
		} else { 
			this._append_message(w);
		}
		
		if(bottom)
			$(this.ids.content).parent().animate({ scrollTop: $(this.ids.content).height() }, "fast");
		else {
			console.log('NEW MESSAGE');
		}
	};

	ODPWindow.prototype._append_message = function (w) {
		var countdown = new Date(w.expiresAt).getTime() - Date.now();
		if(countdown>200) {
			dust.render('message',{
				_id: w._id,
				words:w.words.split('\n'), 
				name:w.name,
				rel:w.rel,
				origin: w.origin,
				date: this._pretty_date( w.createdAt),
				expires: countdown
			}, cb.bind(this) );
		}
		function cb(err, output) {
			var message = $(output).appendTo(this.ids.content);
			//alternate colour of posts
			if(!this.even_odd) message.addClass('odp-odd');
			this.even_odd=!this.even_odd;
			//add event handler to clicking on link
			message.find('.odp-msg-title a').on('click', follow_link_with_handle );
			//add expiration data used to fade out post
			message = message.find('.odp-expires')
							.data('expires',new Date(w.expiresAt));
			//set intitial fade to avoid jerky begining
			fade_message(message,new Date(w.expiresAt).getTime()-Date.now());
		}
	};

	ODPWindow.prototype._pretty_date = function (d) {
		var date = new Date(d);
		return ('0' + date.getHours()).slice(-2) + ':' +
					 ('0' + date.getMinutes()).slice(-2) + ' ' +
					 ('0' + date.getDate()).slice(-2) + '/' +
					 ('0' + (date.getMonth()+1)).slice(-2) + '/' + 
					 date.getFullYear();
	};

	function follow_link_with_handle (e) {
		var href = e.target.href; 
		//console.log('?odp=' + $('#odp-n').val());
		window.location = href + '?odp=' +encodeURIComponent($('#odp-n').val());
		return false;
	}

	function sanitise_relation (rel) {
		if(!rel) 
			return rel;
		var uri_parser = /^(([^:\/?#]+):)?(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;
		var v = rel.match(uri_parser);
		if(v && v.length > 6) {
			return v[5];
		}
		return undefined;
	}

})();

