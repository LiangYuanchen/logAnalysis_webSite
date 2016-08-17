var keystone = require("keystone"),
	async = require('async'),
	_ = require('underscore'),
	innLog = keystone.list("InnLog"),
    util = require("util");
var manager = require("./manager");
var statistical = require("./statistical");
var _config = keystone.get("_config");
var whois = require("./util/whois");
var guildModel = keystone.list("Guild");
var fs = require("fs");
var utils = require("./util/utils");
var winston = require('winston');
var guildModel = keystone.list("Guild");


var dbipcountryManager = require("./dbipcountryManager");


var guilds = {};
var willsaved = [];

var GuildManager = function(){
	manager.call(this);
	var self = this;
};
util.inherits(GuildManager,manager);


exports = module.exports = GuildManager;
GuildManager.prototype.updateGuild_GwReward = function(log,next){
	if(log.logType!="GlobalGWReward")
	{
		next();
		return;
	}
	var arrParm = log.message.split("-");
	var i =0;
	async.whilst(
		function(){
			return i<arrParm.length;
		},
		function(callback){
			var arrTheone = arrParm[i].split("_");
			var instid = parseInt(arrTheone[0]);
			var enemyid = parseInt(arrTheone[3]);
			var warstar = parseInt(arrTheone[1]) || 0;
			var enemystar = parseInt(arrTheone[4]) || 0;
			var sql ={};
			if(isNaN(instid)||!instid)
			{
				i++;
				callback();
				winston.info("#guildManager#guild get error,log:%s",JSON.stringify(log));
				return;
			}
			if(arrTheone[2]=="w")
			{
				sql = {$inc:{"war_win_his":1},$set:{"war_star":warstar,"war_enemystar":enemystar,"war_enemyguild":enemyid}};
			}
			else if(arrTheone[2]=="l")
			{
				sql = {$inc:{"war_lose_his":1},$set:{"war_star":warstar,"war_enemystar":enemystar,"war_enemyguild":enemyid}};
			}
			else
			{
				sql = {$inc:{"war_draw_his":1},$set:{"war_star":warstar,"war_enemystar":enemystar,"war_enemyguild":enemyid}};
			}

			guildModel.model.update({instid:instid},sql,function(err,result){
				if(err)
				{
					winston.info("#guildManager#updateGuild_GwReward update error");
					utils.showErr(err);
				}
				i++;
				callback();
			});	
		},
		function()
		{
			next();
		}
		);
}
GuildManager.prototype.insertGuild = function(log,next)
{
	if(log.logType!="GuildStatistical")
	{
		if(log.logType=="GlobalGWReward")
		{
			this.updateGuild_GwReward(log,next);
		}
		else
		{
			next();
		}
		return;
	}
	var jsonParm = {};
	try{
		 jsonParm = JSON.parse(log.message.substring(0,log.message.length-2));
	}
	catch(err){
		utils.showErr(err);
		winston.info("#GuileManager#insertGuild#error json.parse,%s",log.message);
		next();
		return;
	}
	if(!jsonParm.instid)
	{
		next();
		return;
	}
	
	keystone.list("Guild").model.find({instid:jsonParm.instid}).exec(function(err,datas){
		if(datas[0])
		{
			var guild = datas[0];
			guild.crt_dt = new Date(jsonParm.crt_dt);
			guild.current_quests = jsonParm.current_quests;
			guild.member_count = jsonParm.member_count;
			guild.name = jsonParm.name;
			guild.point = jsonParm.point;
			guild.quest_stage = jsonParm.quest_stage;
			guild.timeStamp = log.timeStamp;
			guild.totalpoint = jsonParm.totalpoint;
			guild.region = jsonParm.region;
			guild.isregister = jsonParm.guildwar.isregister;
			if(jsonParm.guildwar.isregister)
			{
				guild.war_enemyguild = jsonParm.guildwar.enemyguild;
				guild.war_timeStamp = log.timeStamp;
				guild.war_enemyguildregion = jsonParm.guildwar.enemyguildregion;
				guild.war_member_count = jsonParm.guildwar.member_count;
				guild.war_wincount = jsonParm.guildwar.wincount;
				guild.war_losecount = jsonParm.guildwar.losecount;
				guild.war_drawcount = jsonParm.guildwar.drawcount;
				if(jsonParm.guildwar.result)
					guild.war_result = jsonParm.guildwar.result;
			}
			guild.save(function(err){
				if(err)
					winston.info("#guildmanager#insert error");
				utils.showErr(err);
				next();
			})
		}
		else
		{
			var guild ={};
			guild.crt_dt = new Date(jsonParm.crt_dt);
			guild.current_quests = jsonParm.current_quests;
			guild.member_count = jsonParm.member_count;
			guild.name = jsonParm.name;
			guild.point = jsonParm.point;
			guild.quest_stage = jsonParm.quest_stage;
			guild.timeStamp = log.timeStamp;
			guild.totalpoint = jsonParm.totalpoint;
			guild.region = jsonParm.region;
			guild.isregister = jsonParm.guildwar.isregister;
			if(jsonParm.guildwar.isregister)
			{
				guild.war_enemyguild = jsonParm.guildwar.enemyguild;
				guild.war_timeStamp = log.timeStamp;
				guild.war_enemyguildregion = jsonParm.guildwar.enemyguildregion;
				guild.war_member_count = jsonParm.guildwar.member_count;
				guild.war_wincount = jsonParm.guildwar.wincount;
				guild.war_losecount = jsonParm.guildwar.losecount;
				guild.war_drawcount = jsonParm.guildwar.drawcount;
			}

			var guildData = new guildModel.model(guild);
			//console.log("insert user %s,",parm.uid);

			guildData.save(function(err,guild){
				if(err)
					winston.info("#guildmanager#insert error2");
				utils.showErr(err);
				guilds[guild.instid] = {instid:guild.instid,_id:guild._id,quest_stage:guild.quest_stage};
				next();
			});
		}
	});
}
module.exports.getGuild = function(instid,next){
	var guild = {};
	async.waterfall([
		function(cb){
			if(guilds[instid])
			{
				guild = guilds[instid];
				cb();
				return;
			}
			keystone.list("Guild").model.find({instid:instid}).exec(function(err,data){
				if(!data)
				{
					cb();
					return;
				}
				guild = _.pick(data[0],"instid","quest_stage","_id");
				
				guilds[instid] = guild;
				cb();
			});
		}
		],function(err){
		next(guild);
	});
}

