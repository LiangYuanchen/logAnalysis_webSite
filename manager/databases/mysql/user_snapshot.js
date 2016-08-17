var async = require('async'),
    _ = require('underscore');
var keystone = require("keystone");    
var _config = keystone.get("_config");
var winston = require("winston");
var utils = require("../../util/utils");
var connBase = require("./conn");
require("../../util/datetime");
var gameUserManager = require("../../gameUserManager");
var guildManager = require("../../GuildManager");
var gameconfigExchange = require("../../GameConfigExchange");

var vipsMaxGem = "";

var user_snapshot = function(options)
{
	var self = this;
	var top5 = [];

	top5 = gameUserManager.getTop5Adv(options);

	try{
		self.data.User_ID = options.uid;
		self.data.User_DvcID = options.username;
		self.data.User_Server = options.gameid;
		self.data.Crt_DT = new Date(options.lastlogdate*1000).format();
		self.data.region_id = options.region;
		self.data.User_name = options.tavernName;
		self.data.User_Level = options.tavernlevel || 0;
		self.data.User_Gld = options.guildid || 0;
		self.data.User_Gem_Buy = options.gembuytotal || 0;
		self.data.User_Gem_Other = options.gemothertotal || 0;
		self.data.User_Gem_Buy_Now = options.gembuy || 0;
		self.data.User_Gem_Other_Now = options.gemother || 0;
		self.data.User_Vip = 0;
		self.data.User_EXP = options.innExp || 0;
		self.data.User_Energy = options.power || 0;
		self.data.User_Coin = options.gold || 0;
		self.data.User_Odsy_Coin = options.odysseyCoin || 0;
		self.data.User_Gld_Coin = options.guildCoin || 0;
		self.data.User_Swp_Tkt = options.sweepTicket || 0;
		self.data.User_Fame = options.fame || 0;
		self.data.User_M_Card = options.m_card || 0;
		self.data.User_Adv_normal = options.lastQuestTypeId || 0;
		self.data.User_Adv_Hard = options.lastHardQuestTypeId || 0;
		self.data.User_Odsy_Progress = options.lastOdyQuestTypeId || 0;
		self.data.User_Arena_Progress = options.pvp_score || 0;
		self.data.User_PvP_Coin = options.pvpCoin || 0;
		self.data.User_Gld_quest_progress = 0;
		self.data.User_Arena_Rank = options.pvp_rank || 0;
		self.data.User_Eqp_Rating_Avg = gameUserManager.Get_User_Eqp_Rating_Avg(top5);
		self.data.User_Star_Rating_Avg = gameUserManager.Get_User_Star_rating_Avg(top5);
		self.data.User_Lv_Rating_Avg = gameUserManager.Get_User_Lv_Rating_Avg(top5);
		self.data.User_Power_Sum = gameUserManager.Get_User_Power_Sum(top5);
		//console.log("#user_snapshot,options:%s",JSON.stringify(options));
		
	}
	catch(err){
		self.data = {};
		winston.error("#user_snapshot init error");
		utils.showErr(err);
	}

}

user_snapshot.prototype.data = {};

user_snapshot.prototype.save = function(callback){
	var self =this;
	var gce = keystone.get("gameconfigExchange");
	async.waterfall([
		function(cb)
		{
			if(!vipsMaxGem)
			{
				gce.getvipLevels(function(data){
					vipsMaxGem = data;
					cb();
				});
			}
			else
			{
				cb();
			}
		},
		function(cb){
			if((self.data.User_Adv_normal&&self.data.User_Adv_normal.length>0)||(self.data.User_Adv_Hard&&self.data.User_Adv_Hard.length>0))
			{
				gce.getQuest(function(quests){
					if(self.data.User_Adv_normal.length>0)
						self.data.User_Adv_normal = quests[self.data.User_Adv_normal];
					if(self.data.User_Adv_Hard.length>0)
						self.data.User_Adv_Hard = quests[self.data.User_Adv_Hard];
					cb();
				});
			}
			else
				cb();
		},
		function(cb){
			if(self.data.User_Odsy_Progress&&self.data.User_Odsy_Progress.length>0)
			{
				gce.getodyssey(function(odysseys){
					self.data.User_Odsy_Progress = odysseys[self.data.User_Odsy_Progress];
					cb();
				});
			}
			else
				cb();
		},
		function(cb){
			if(!self.data.User_Gld)
			{
				cb();
				return;
			}
			guildManager.getGuild(parseInt(self.data.User_Gld),function(guild){
				if(guild.quest_stage)
					self.data.User_Gld_quest_progress = guild.quest_stage;
				cb();
			});
		},
		function(cb)
		{
			var gembuytotal = self.data.User_Gem_Buy;
			if(isNaN(gembuytotal))
				gembuytotal = 0;
			self.data.User_Vip = utils.GetVipLevel(gembuytotal,vipsMaxGem);
			cb();
		}
		],function(){
			var conn = new connBase();
			conn.saveMysql(self.data,"User_SnapShot",callback);
	});
	
}

exports = module.exports = user_snapshot;
