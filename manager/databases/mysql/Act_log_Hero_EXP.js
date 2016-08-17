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
var gc = keystone.get("gameconfigExchange");
var dbipcountry = new dbipcountryManager();
var vipsMaxGem = "";

var act_log_Hero_EXP = function(options)
{
	var self = this;
	try{
		self.data = options;
	}
	catch(err){
		self.data = {};
	}
}

act_log_Hero_EXP.prototype.data = {};

act_log_Hero_EXP.prototype.save = function(callback){
	var self =this;
	var conn = new connBase();
	conn.saveMysql(self.data,"Act_log_Hero_EXP",callback);
}


exports = module.exports = act_log_Hero_EXP;