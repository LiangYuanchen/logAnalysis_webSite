var keystone = require("keystone");

var async = require('async'),
	_ = require('underscore'),
	innLog = keystone.list("InnLog"),
	gameUser = keystone.list("GameUser"),
    util = require("util");

var manager = require("./manager");
var _config = keystone.get("_config");
var fs = require("fs");
var utils = require("./util/utils");
var winston = require('winston');
var dbipcountryManager = require("./dbipcountryManager");
var	nMemcached = require( 'memcached' ),
	memcached;

// connect to our memcached server on host 10.211.55.5, port 11211
//memcached = new nMemcached( _config.memcacheq );
// memcached.on("issue",function(details){winston.error("Server " + details.server + "went down due to: " + details.messages.join( '' ));});
// memcached.on("reconnecting",function(details){winston.error("Total downtime caused by server " + details.server + " :" + details.totalDownTime + "ms");});
// memcached.on("failure",function(details){winston.error("memcacheq Server "+details.server+" failure," +" "+details.messages.join(''));});
// memcached.on("remove",function(details){winston.error("memcacheq Server "+details.server+" removed")});
var CachedManager = function(){
	manager.call(this);
	var self = this;
};
util.inherits(CachedManager,manager);

CachedManager.prototype.RTUser = function(option,next){
	var self = this;
	memcached = new nMemcached( _config.memcacheq );
	if(typeof option == "object")
	{
		memcached.set( "a", option, 10000, function( err, result ){
			self.showError(err);
			next(result);
			//winston.debug(result);
			//console.dir( result );
			memcached.end(); // as we are 100% certain we are not going to use the connection again, we are going to end it
		});		
	}
	else
	{
		memcached.get( "a", function( err, result ){
			self.showError(err);
			//winston.debug(result);
			next(result);
			//console.dir( result );
			if(result==undefined||result=="undefined")
			{
				memcached.del( "a", function( err, result ){
					//if( err ) console.error( err );
					
					//console.info( result );
					memcached.end(); // as we are 100% certain we are not going to use the connection again, we are going to end it
				});				
			}
			else
				memcached.end(); // as we are 100% certain we are not going to use the connection again, we are going to end it
		});
	}
}

exports = module.exports = CachedManager;
