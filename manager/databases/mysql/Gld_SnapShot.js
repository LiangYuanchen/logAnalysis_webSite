var async = require('async'),
    _ = require('underscore');
var keystone = require("keystone");    
var _config = keystone.get("_config");
var winston = require("winston");
var utils = require("../../util/utils");
var connBase = require("./conn");
require("../../util/datetime");
var gameconfigExchange = require("../../GameConfigExchange");
var gameUserManager = require("../../gameUserManager");
var guildManager = require("../../GuildManager");

var vipsMaxGem = "";

var Gld_SnapShot = function(options)
{
	var self = this;

	try{
		self.data.Gld_ID = options.instid;
		self.data.Gld_Server = options.region;
		self.data.Crt_DT = new Date(options.timeStamp*1000).format();
		self.data.gld_Level = 0;
		self.data.Gld_Exp = options.totalpoint;
		self.data.Gld_member = options.member_count;
		self.data.Gld_Quest_stge =options.quest_stage;
		self.data.Gld_btl_win_his = options.war_win_his;
		self.data.Gld_btl_draw_his = options.war_draw_his;
		self.data.Gld_btl_lose_his = options.war_lose_his;
		self.data.Gld_btl_att = options.war_member_count;
		self.data.Gld_btl_win_tms = options.war_wincount;
		self.data.Gld_btl_draw_tms = options.war_drawcount;
		self.data.Gld_btl_lose_tms = options.war_losecount;
		self.data.Gld_btl_win      = options.war_result;
		self.data.Gld_btl_emy_id   = options.war_enemyguild;
	}
	catch(err){
		self.data = {};
	}
}

Gld_SnapShot.prototype.data = {};

Gld_SnapShot.prototype.save = function(callback){
	var gce = keystone.get("gameconfigExchange");
	var self =this;
	async.waterfall([
		function(cb){
			gce.getguildLevels(function(guilds){
				self.data.gld_Level = utils.GetVipLevel(self.data.Gld_Exp,guilds);
				cb();
			});
		},
		function(cb){
			if(self.data.Gld_Quest_stge&&self.data.Gld_Quest_stge.length>0)
			{
				gce.getQuest(function(quests){
					self.data.Gld_Quest_stge = quests[self.data.Gld_Quest_stge];
					cb();
				});				
			}
			else
				cb();

		}
		],function(){
		var conn = new connBase();
		conn.saveMysql(self.data,"Gld_SnapShot",callback);
	});

}

exports = module.exports = Gld_SnapShot;
