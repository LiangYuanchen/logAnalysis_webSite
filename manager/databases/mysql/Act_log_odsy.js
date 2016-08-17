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

var dbipcountry = new dbipcountryManager();
var vipsMaxGem = "";

var Act_log_odsy = function(options)
{
	var self = this;
	try{
		self.data = options;
	}
	catch(err){
		self.data = {};
	}
}

Act_log_odsy.prototype.data = {};

Act_log_odsy.prototype.save = function(callback){
	var self =this;
	var gce = keystone.get("gameconfigExchange");
	async.waterfall([
		function(cb){
			gce.getodyssey(function(odysseys){
				self.data.Odsy_stg_No = odysseys[self.data.Odsy_Stg_ID+""];
				cb();
			});
		}
		],function(){
		var conn = new connBase();
		conn.saveMysql(self.data,"Act_log_odsy",callback);
	});

}


exports = module.exports = Act_log_odsy;