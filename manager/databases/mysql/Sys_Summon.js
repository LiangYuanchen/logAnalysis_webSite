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


var vipsMaxGem = "";

var Sys_Summon = function(options)
{
	var self = this;
	try{
		self.data = options;
	}
	catch(err){
		self.data = {};
	}
}

Sys_Summon.prototype.data = {};

Sys_Summon.prototype.save = function(callback){
	var self =this;
	var gce = keystone.get("gameconfigExchange");
	async.waterfall([
		function(cb){
			var summon_type={
				"0":"normal",
				"1":"elite",
				"2":"legend",
				"3":"10normal",
				"4":"10elite"
			};
			self.data.Sum_type = summon_type[self.data.Sum_type+""];
		}
		],function(){
		var conn = new connBase();
		conn.saveMysql(self.data,"Sys_Summon",callback);
	});

}


exports = module.exports = Sys_Summon;