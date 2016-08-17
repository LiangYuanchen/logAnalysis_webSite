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

var Payuser_Status_SnapShot = function(options)
{
	var self = this;
	try{
		self.data.User_ID = options.uid;
		self.data.User_DvcID = options.username;
		self.data.User_Server = options.gameid;
		self.data.Crt_DT = new Date(options.lastlogdate*1000).format();
		self.data.region_id = options.region;
		self.data.User_dvc_ID = options.device_id;
		self.data.User_dvc_type = options.device_type;
		self.data.User_OS_ver = options.lastlogin_OS_ver || "";
		self.data.app_ver = options.lastlogin_app_ver || "";
		self.data.User_country = options.country || "";
		self.data.User_lv = options.tavernlevel || 0;
		self.data.user_online = options.activetime || 0;
		self.data.user_pay_amt = options.user_pay_amt || 0;
		self.data.User_pay_times = options.user_pay_times || 0 ;
		self.data.User_pay_all = options.user_pay_all || 0;
		self.data.User_Cost_Fin = options.gembuytotal + options.gemothertotal - options.gembuy - options.gemother;
		self.data.User_Gem_Fin = options.gembuytotal + options.gemothertotal;
		self.data.User_eng_cost = options.eng_gem_cost || 0;
		self.data.User_speed_cost = options.speed_gem_cost || 0;
		self.data.User_fill_cost = options.fill_gem_cost || 0;
		self.data.User_shop_cost = options.shop_gem_cost || 0;
		self.data.User_adv_N_stg = options.lastQuestTypeId || "";
		self.data.User_adv_H_stg = options.lastHardQuestTypeId || "";
		self.data.User_Arena_pt = options.pvp_score || 0;
		self.data.User_arena_rank = options.pvp_rank || 0;
		self.data.User_Arena_Rate =parseFloat( (options.pvp_wincount / options.pvp_totalcount).toFixed(2)) || 0;
	}
	catch(err){
		self.data = {};
		winston.error("#payuser_status_snapshot init error");
		utils.showErr(err);		
	}
}

Payuser_Status_SnapShot.prototype.data = {};

Payuser_Status_SnapShot.prototype.save = function(callback){
	var self =this;
	var conn = new connBase();
	conn.saveMysql(self.data,"Payuser_Status_SnapShot",callback);
}


exports = module.exports = Payuser_Status_SnapShot;