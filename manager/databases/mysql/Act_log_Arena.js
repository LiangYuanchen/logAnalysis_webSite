var async = require('async'),
    _ = require('underscore');
var keystone = require("keystone");    
var _config = keystone.get("_config");
var winston = require("winston");
var utils = require("../../util/utils");
var connBase = require("./conn");
require("../../util/datetime");
var gameconfigExchange = require("../../GameConfigExchange");
var dbipcountryManager = require("../../dbipcountryManager");
var gce = keystone.get("gameconfigExchange");
var dbipcountry = new dbipcountryManager();
var vipsMaxGem = "";

var Act_log_Arena = function(options)
{
	var self = this;
	try{
		self.data = options;
	}
	catch(err){
		self.data = {};
	}
}

Act_log_Arena.prototype.data = {};

Act_log_Arena.prototype.save = function(callback){
	var self =this;
	var conn = new connBase();
	conn.saveMysql(self.data,"Act_log_Arena",callback);
}


exports = module.exports = Act_log_Arena;