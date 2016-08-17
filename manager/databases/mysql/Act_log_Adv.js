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

var Act_log_Adv = function(options)
{
	var self = this;
	try{
		self.data = options;
	}
	catch(err){
		self.data = {};
	}
}

Act_log_Adv.prototype.data = {};

Act_log_Adv.prototype.save = function(callback){
	var self =this;
	var gce = keystone.get("gameconfigExchange");

	async.waterfall([
		function(cb){
			gce.getQuest(function(quests){
				self.data.Adv_stg_name = quests[self.data.Adv_std_ID];
				cb();
			});
		}
		],function(){
		var conn = new connBase();
		conn.saveMysql(self.data,"Act_log_Adv",callback);
	});

}


exports = module.exports = Act_log_Adv;