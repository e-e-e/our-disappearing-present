(function() {
	// CONFIG
	var theme;
	try {
		theme = odp_theme || '';
	} catch(e) {}

	var config = {
		host: "<%= options.config.server %>",
		io_host:"<%= options.config.server %>",
		io_options: {
			transports: ['websocket']
		},
		auto_load: {
			js:[//loaded in any order 
				'/socket.io/socket.io.js',
				'/client/libs/dust-core.min.js' 
			],
			last_js:'/client/views/views.js',
			css:[
				'/fonts/font.css',
				'/client/css/odp'+((theme)?'.'+theme:'')+'.css'
			]
		},

	};
	var $;

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
	
	(function preload(host,js_to_load,css_to_load,js_last) {
		var i =0;
		var counter = js_to_load.length;

		for (i = 0; i < css_to_load.length; i++) {
			load_css(host+css_to_load[i], 'odp-css'+((i>0)?i:''));
		}
		for(i = 0; i < js_to_load.length; i++) {
			load_script(host+js_to_load[i], loaded);
		}

		function loaded() {
			if(--counter === 0){
				//check if there is jquery
				if(!$ && jQuery) {
					$ = jQuery;
				} else {
					console.log('Our disappearing present requires jQuery.');
					console.log("Add <script src='"+host+"/client/libs/jquery-1.11.3.js'></script> before the link to Our disappearing present... ");
				}
				//if all other scripts are loaded then load views and init program
				if(js_last) load_script(host+js_last, function(){
						$(document).ready(init); 
					});
				else $(document).ready(init); 
			}
		}
	})(config.host,
		 config.auto_load.js,
		 config.auto_load.css,
		 config.auto_load.last_js);

	// STUPID HACK FOR NEXTWAVE URLS

	var nextwave_urls = {"#event=141":"/events/panel-can-ecosex-save-earth/","#event=155":"/events/a97/","#event=159":"/events/admission-into-the-everyday-sublime/","#event=211":"/events/camel/","#event=212":"/events/mummy-dearest/","#event=213":"/events/sedihsunno/","#event=214":"/events/under-my-skin/","#event=270":"/events/algorthmic-misfits/","#event=271":"/events/angkot-alien/","#event=273":"/events/ua-numi-le-fau/","#event=274":"/events/blaaq-catt/","#event=275":"/events/love-five-feminist-perspectives/","#event=276":"/events/desert-body-creep/","#event=277":"/events/telltale/","#event=278":"/events/still-i-rise/","#event=279":"/events/something-less/","#event=280":"/events/fempress/","#event=281":"/events/sisters-akousmatica/","#event=282":"/events/ground-control/","#event=283":"/events/ships-in-the-night/","#event=284":"/events/the-horse/","#event=285":"/events/shadow-sites/","#event=287":"/events/shadows-on-the-hill/","#event=288":"/events/microlandscapes/","#event=289":"/events/separating-hydrogen-air-primer/","#event=290":"/events/misconceive/","#event=295":"/events/the-second-woman/","#event=296":"/events/one-million-views/","#event=297":"/events/relating-immediate-surroundings-something-im-talking/","#event=298":"/events/passing/","#event=300":"/events/our-disappearing-present/","#event=301":"/events/the-fraud-complex/","#event=302":"/events/voices-joan-arc/","#event=303":"/events/far-from-here/","#event=305":"/events/decolonist/","#event=304":"/events/blaksland-and-lawless/","#event=306":"/events/arrival-of-the-rajah/","#event=453":"/events/truth-symposium-internet-privacy/","#event=563":"/events/shadow-sites-artist-talk-and-walking-tour/","#event=594":"/events/one-million-views-walking-tour/","#event=596":"/events/one-million-views-workshop/","#event=624":"/events/decolonist-artist-talk-meditation-and-workshop/","#event=700":"/events/indigenous-language-workshops/","#event=701":"/events/festival-club/", "#event=133":"/events/ecosexual-bathhouse/"};

	// ----- MAIN -----

	function init() {
		var socket = io.connect(config.io_host, config.io_options);
		var odp = new ODPWindow(socket);

		// erasure.
		socket.on('connected', function() {
			//if no puttons add a round one to the top right hand corner
			if($('div#our-disappearing-present').length === 0) {
				$('<div id="our-disappearing-present" class="round top right"></div>')
					.appendTo('body');
			}
			// start erasure of odp posts
			setInterval(erasure,100);
			// show odp buttons
			reveal_odp();
			//check if query has odp name
			//if so automatically open window and set to relative
			if(queries.odp) {
				var rel;
				if(window.location.hash) {
					rel = nextwave_urls[window.location.hash];
				}
				Cookies.create('odp-handle',decodeURI(queries.odp));
				odp.open(rel);
			} else {
				//peek and notify
				socket.emit('peek');
				if(window.location.pathname!=='/') {
					console.log('sent');
					socket.emit('peek',window.location.pathname);
				}
			}
		});

		socket.on('blocked', function(words) {
			console.log(words,"BLOCKED");
			// notify user...
		});

		socket.on('focused', function(words) {
			if(odp) odp.focused(words);
		});

		socket.on('words', function (words) {
			if(odp) odp.add(words);
		});

		socket.on('update', function(words) {
			if(odp) odp.update(words);
		});

		socket.on('latest', notify );

			// FUNCTION FOR SIMPLE NOTIFICATION OF LATEST MESSAGES

		function notify (data) {
			console.log(data);
			if(data.words.length>0) {
				var words = data.words[0]; 
				var timeout = null;
				var notifications = $('div#odp-notifications');
				if(notifications.length===0) {
					notifications = $('<div id="odp-notifications"></div>').appendTo('body');
				}
				var notify = $('<div class="odp-notify"></div>')
										.appendTo('div#odp-notifications');
				// x left message on y, z minutes ago.
				// on odp - click to open.
				var created = Date.now() - new Date(words.createdAt).getTime();
				var s = Math.floor(created / 1000); //seconds
				var m = Math.floor(s/60);
				var h = Math.floor(m/60);
				var d = Math.floor(h/24);
				var ago = (d)? d + (' day'+((d>1)?'s':'')) :
									(h)? h + (' hour'+((h>1)?'s':'')) :
									(m)? m + (' minute'+((m>1)?'s':'')) :
									(s)? s + (' second'+ ((s>1)?'s':'')) : '';
				ago += ' ago. (click to visit)';
				notify.hide();

				$('<span class="odp-name"></span>').text(words.name).appendTo(notify);
				
				var relation = '';

				if(words.origin !== window.location.host) {
					if(words.rel === window.location.pathname) {
						relation = 'this at '+words.origin;
					} else {
						relation = words.rel +' at '+ words.origin;
					}
				} else if (words.rel === window.location.pathname) {
					relation = 'this page.';
				} else {
					relation = words.rel;
				}

				$('<span><span>').text(' wrote in relation to '+relation).appendTo(notify);
				$('<p></p>').text(ago).appendTo(notify);

				notify.fadeIn(1000);

				timeout = setTimeout(function() {fade(notify);}, 5000);

				notify.click(function(){
					clearTimeout(timeout);
					fade(notify);
					//open new odp window
					if(words.rel!=='/' || words.rel !== window.location.pathname ) {
						// go to location 
						var name = Cookies.read('odp-handle');
						if(!name) 
							name = random_name();
						window.location = words.origin+words.rel+'?odp='+name;
					} else {
						odp.open(words.rel || '/');
					}
				});
			}
			function fade(el) {
				el.fadeOut('slow',function() {
					$(this).remove();
				});
			}
		} 

		function reveal_odp () {

			$('div#our-disappearing-present').not('.active').css({
					display:"inherit"
				}).addClass('active').each(function(){
					var button = $(this);
					if(!button.hasClass('round')){
						if(button.data('odp-rel')) {
							button.text('Join the discussion...');
						} else {
							button.text('Our disappearing present...');
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

	// fading messages

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
		this.is_more = false;
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
		el.find('#odp-notify-bottom').click(this._hide_msg_nofication.bind(this));
		el.find('#odp-notify-bottom').click(this._scroll_to_bottom.bind(this));
		// submit on keypress within textarea input
		el.find(this.ids.input).on('keypress', this._keypress.bind(this));
		// submit form
		el.find('form').submit(this._submit.bind(this));
		// close window event
		if(is_mobile())
			el.find(this.ids.head).click(this.close.bind(this));
		else 
			el.find('.odp-close').click(this.close.bind(this));
		// listen for tab changes
		el.find(this.ids.tabs).click(this.change_tab.bind(this));
		// set user handle from cookie - updated cookie when user changes
		var name = Cookies.read('odp-handle');
		if(!name) {
			name = random_name();
			Cookies.create('odp-handle', name);
		}
		el.find(this.ids.name).val(name);

		el.find(this.ids.name).on('change',function(){
			Cookies.create('odp-handle',$(this).val());
		}).val();
		// scrolling event
		el.find(this.ids.body).on('scroll',this._on_scroll.bind(this));
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

	ODPWindow.prototype._on_scroll =function(e) {
		if(this.is_more) {
			var scrollTop = $(e.target).scrollTop();
			if(scrollTop<=0) {
				//get more
				this.is_more = false;
				$('#odp-getting-more').addClass('active');
				this.socket.emit('more');
				
				//add temporary loader
			}
		}
	};

	ODPWindow.prototype.close = function() {
		$(this.ids.window).slideUp();
		$(this.ids.content).show();
		$(this.ids.info).hide();
		this._hide_msg_nofication();
		this.opened = false;
		//do anything like don't listen for anymore odp messages
	};

	ODPWindow.prototype.change_tab = function(event) {
		// visually shift tabs
		var tab = $( event.target );
		if(!tab.hasClass('active')) {
			this._hide_msg_nofication();
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
		if(words)	{
			this.add(words);
			this.is_more = true;
		} else {
			this.is_more = false;
			//show message that there are currently no messages. Be the first to leave a message.
		}
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
			// clear input
			$(this.ids.input).val('');
			this._scroll_to_bottom();
		}	else {
			//need to alert that they need to write something to comment
			//or if not loaded wait until loaded.
		}
		//unfocus - hide keyboard.
		if(is_mobile()) 
			$(this.ids.input+', '+this.ids.name).blur();
		return false;
	};

	ODPWindow.prototype.add = function (w) {
		//check if at bottom 
		var body = $(this.ids.body);
		var bottom = (body.scrollTop() + body.innerHeight() >= body[0].scrollHeight - 20);

		if(w instanceof Array) {
			for (var i= w.length-1; i>=0; i--) 
				this._render(w[i], true);
		} else { 
			this._render(w, true);
		}
		
		if(bottom) this._scroll_to_bottom();
		else {
			// show alert.
			console.log('NEW MESSAGE');
			this._show_msg_nofication();
		}
	};

	ODPWindow.prototype._show_msg_nofication = function(){
		var notify = $('#odp-notify-bottom');
		var c = notify.data('count');
		if(!c) c = 0;
		c++;
		notify.data('count',c);
		notify.text( c + 'new message '+ ((c)?'s':'') + ' available');
		notify.fadeIn(500);

	};

	ODPWindow.prototype._hide_msg_nofication = function(){
		notify = $('#odp-notify-bottom');
		notify.fadeOut(500);
		notify.data('count',0);
	};

	ODPWindow.prototype.update = function(w) {
		$('#odp-getting-more').removeClass('active');
		if(!w || w.length===0) {
			//no_more to load
			console.log('NO MORE');
			this.is_more = false;
		} else {
			console.log('ADDING ', w.length);
			for (var i= 0; i<w.length; i++) {
				this._render(w[i], false);
			}
			this.is_more = true;
		}
	};

	ODPWindow.prototype._scroll_to_bottom = function () {
		var contents = $(this.ids.content);
		contents.parent().animate({ scrollTop: contents.height() }, "fast");
	};

	ODPWindow.prototype._render = function(w, append) {
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
			}, this._post_render.bind(this, append, w.expiresAt) );
		}
	};

	ODPWindow.prototype._post_render = function(append,expires,err,output) {
		var message = $(output);
		if(append) message.appendTo(this.ids.content);
		else {
			message.prependTo(this.ids.content);
		}
		// alternate colour of posts
		if(!this.even_odd) message.addClass('odp-odd');
		this.even_odd=!this.even_odd;
		// attach event handlers
		this._attach_msg_events(message);
		// add expiration data used to fade out post
		message = message.find('.odp-expires')
						.data('expires',new Date(expires));
		//set intitial fade to avoid jerky begining
		//this is global and probably not good practice
		fade_message(message,new Date(expires).getTime()-Date.now());
		if(!append) {
			var body = $(this.ids.body);
			body.scrollTop(body.scrollTop()+message.outerHeight(true));
		}
	};

	ODPWindow.prototype._attach_msg_events = function (msg) {
		//add event handler to clicking on link
		msg.find('.odp-msg-title a').on('click', follow_link_with_handle );
		//add event handler for handling options menu
		msg.find('div.odp-msg-extra').on('click', function(el) {
			var extra = el.target;
			if(!$(extra).hasClass('active')) {
				$(extra).addClass("active");
				$("body").on('click',null, {target:extra}, deselect_element);
			}
		});
		function deselect_element(e){
			if (e.target !== e.data.target && !$(e.target).parents('div.odp-msg-extra').length) { 
				$(e.data.target).removeClass("active");
				$("body").off('click',deselect_element);
			}
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



	// HELPER FUNCTIONS 

	function follow_link_with_handle (e) {
		var href = e.target.href; 
		window.location = href + '?odp=' +encodeURIComponent($('#odp-n').val());
		return false;
	}

	function sanitise_relation (rel) {
		if(!rel) 
			return rel;
		try {
			var uri_parser = /^(([^:\/?#]+):)?(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;
			var v = rel.match(uri_parser);
			if(v && v.length > 6) {
				return v[5];
			}
		} catch (err) {
			console.log('Error passing relation.');
		}
		return undefined;
	}

	function is_mobile() {
		return ($(window).width()<754);
	}
	// function for generating random user names

	function random_name() {
		var names = ["Song","Ami","Georgiana","Major","Junko","Willian","Robby","Ricki","Scottie","Deneen","Micaela","Kaycee","Faviola","Hang","Nelda","Hyun","Chelsie","Yasuko","Tatum","Meryl","Louvenia","Rachele","Carmel","Emeline","Harris","Dorsey","Venita","Gus","Colby","Indira","Phylicia","Keenan","Brigida","Augustina","Maira","Twyla","Lauren","Boris","Qiana","Yu","Adrian","Adella","Robt","Lia","Mignon","Mari","Thanh","Romona","Renna","Frida","Adele","Marlin","Del","Retta","Treva","Larae","Whitley","Katelynn","Verena","Reatha","Markus","Pandora","Maryln","Makeda","Marry","Cher","Mitch","Donita","Charise","Dalton","Tressa","Patricia","Philomena","Gerri","Fredricka","Kathe","Charles","Leonila","Alisia","Juliana","Creola","Candi","Phoebe","Kelsie","Ellyn","Anastasia","Carolynn","Sharron","Kai","Dennise","Deloise","Dudley","Jessia","Clair","Luann","Jessika","Enriqueta","Charlesetta","Thao","Inga"];
		return names[Math.floor(Math.random()*names.length)];
	}

})();

