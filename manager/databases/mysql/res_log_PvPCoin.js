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

var vipsMaxGem = "";

var res_log_PvPCoin = function(options)
{
	var self = this;
	try{
		self.data = options;
	}
	catch(err){
		self.data = {};
	}
}

res_log_PvPCoin.prototype.data = {};

res_log_PvPCoin.prototype.save = function(callback){
	var self =this;
	var conn = new connBase();
	conn.saveMysql(self.data,"Res_log_PvPCoin",callback);
}


exports = module.exports = res_log_PvPCoin;