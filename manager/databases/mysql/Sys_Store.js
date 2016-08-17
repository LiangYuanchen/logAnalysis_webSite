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

var Sys_Store = function(options)
{
	var self = this;
	try{
		self.data = options;
	}
	catch(err){
		self.data = {};
	}
}

Sys_Store.prototype.data = {};

Sys_Store.prototype.save = function(callback){
	var self =this;
	var gce = keystone.get("gameconfigExchange");
	async.waterfall([
		function(cb){
			gce.getShopTypeName(function(shopnames){
				self.data.Store_Type = shopnames[self.data.Store_Type+""] || self.data.Store_Type;
				self.data.Store_Type = self.data.Store_Type.replace("STORETYPE","");
				cb();
			})
		},
		function(cb){
			gce.getRewardPools(function(rewardpools){
				for(var i=0;i<rewardpools.length;i++){
					var rewardpool = rewardpools[i];
					if(rewardpool.typeId == self.data.Store_itm_id)
					{
						self.data.Store_itm_name = rewardpool.name;
						self.data.Store_itm_amy = rewardpool.amount;
						cb();
						return;
					}
				};
				cb();
			});
		},
		function(cb){
			var currency_type={
				"1000":"advexp",
				"2000":"innExp",
				"3000":"gold",
				"4000":"gem",
				"5000":"energy",
				"6000":"famiexp",
				"7000":"sumenergy",
				"8000":"odycoin",
				"9000":"pvpcoin",
				"10000":"fame",
				"11000":"swptik",
				"12000":"gldpo",
				"13000":"gldco"
			};
			self.data.Store_currency_type = currency_type[self.data.Store_currency_type];
			cb();
		}
		],function(){
		var conn = new connBase();
		conn.saveMysql(self.data,"Sys_Store",callback);		
	})
}


exports = module.exports = Sys_Store;