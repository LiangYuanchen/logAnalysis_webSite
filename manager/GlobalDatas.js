
var keystone = require('keystone');
var _ = require("underscore");
var _config = keystone.get("_config");

var util = require('util');
var winston = require("winston");
var isServer = _config.isServer;

var GlobalDatas = {};

exports = module.exports = GlobalDatas;
//
GlobalDatas.get_uid_countrys = function(options){
	var uid_countrys = keystone.get("uid_countrys");
	if(!uid_countrys)
	{
		winston.error("uid_countrys not init",options);
		return;
	}
	return uid_countrys;	
}

GlobalDatas.push_country = function(options){
	var uid_countrys = keystone.get("uid_countrys");
	if(!uid_countrys)
	{
		winston.error("uid_countrys not init",options);
		return;
	}
	if(!uid_countrys[options.uid] && options.country.length > 0)
		uid_countrys[options.uid] = options.country;
}

GlobalDatas.initArrUserCountry = function(next){
	var self = this;
	var uid_countrys = {};
	keystone.list("GameUser").model.find().select("uid country").exec(function(err,results){
		_.each(results,function(result){
			if(!uid_countrys[result.uid] && result.country&&result.country.length > 0)
				uid_countrys[result.uid] = result.country;
		});
		if(typeof next == "function")
			next();
	})

    keystone.set("uid_countrys",uid_countrys);
}