# Our disappearing present... (ODP)

Currently running live at [disappearing.us](http://disappearing.us)

## About 

### In few words:

No profiles.
No surveillance.
No advertisements.
Everything is fleeting.
Our disappearing present… is a parasitic platform that enables conversation and movement across its host websites.

### In many words:

This is a kind of thought experiment, an attempt at constructing an alternative and independent “social media”. This is not a facebook-killer or any kind of replacement for mass corporate-controlled social media. It is rather a humble attempt to fashion infrastructure which enables a different sort of sociality on the the Internet. Our disappearing present… exists parasitically across multiple websites, and as such facilitates conversation and movement across its hosts. There is no surveillance, no logging, no advertisement, and your engagement is not monetised. Content only last a period of time before disappearing forever.

As a prototype and a provisional statement on what social media could be like if it was underpinned by a different kind of politic, Our disappearing present… is intended as a reminder of our own agency. We can build our own communities and our own worlds.

Our disappearing present... premieres as part of [Next Wave Festival 2016](http://2016.nextwave.org.au/).

Our disappearing present was developed for Next Wave Festival 2016, and has been supported by The Margaret Lawrence Bequest.

## Run your own:

### Configuration:

The ODP server is configured by a simple config.json file:

```javascript
{
	"server": /* the host that serves ODP scripts */,
	"port": /* node server port */,
	"block": /* (true|false) does the server use whitelist and automatically (crudely) block bots/spam */,
	"mongodb": {
		"url":/* url for mongodb database*/,
		"options": /* options used by mongodb client when establishing connection */
	}
}
``` 

### Nginx server configuration

```nginx
upstream socket_nodes {
		server localhost:8080;
}

server {
	listen 80 default_server;
	listen [::]:80 default_server ipv6only=on;

	root /home/admin/our-disappearing-present/html/dist/;
	index basic.html;

	server_name *.disappearing.us;
	access_log  /dev/null;

	location ~* \.(eot|ttf|woff|woff2)$ {
		if ($request_method = 'OPTIONS') {
			add_header 'Access-Control-Allow-Origin' '*';
			add_header 'Access-Control-Allow-Credentials' 'true';
			add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
			add_header 'Access-Control-Allow-Headers' 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type';
			add_header 'Access-Control-Max-Age' 1728000;
			add_header 'Content-Type' 'text/plain charset=UTF-8';
			add_header 'Content-Length' 0;
			return 204;
		}
		if ($request_method = 'GET') {
			add_header 'Access-Control-Allow-Origin' '*';
			add_header 'Access-Control-Allow-Credentials' 'true';
			add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
			add_header 'Access-Control-Allow-Headers' 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type';
		}
		expires 365d;
		try_files $uri @node;
	}

	location / {
		try_files $uri @node;
	}
	
	location @node {
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection "upgrade";
		proxy_http_version 1.1;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header Host $host;
		proxy_pass http://socket_nodes;
	}
}
```