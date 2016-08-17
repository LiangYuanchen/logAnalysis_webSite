var keystone = require("keystone"),
	async = require('async'),
	_ = require('underscore'),
	innLog = keystone.list("InnLog"),
	guildWar = keystone.list("GuildWar"),
    util = require("util");
var manager = require("./manager");
var _config = keystone.get("_config");
var utils = require("./util/utils");
var winston = require('winston');

var guildWarManager = function(){
	manager.call(this);
	var self = this;
};
util.inherits(guildWarManager,manager);


guildWarManager.prototype.insertLog = function(log,next)
{
	var self =this;
	if(!_.contains(_config.logType.guildWar, log.logType))
	{
		next();
		return;
	}
	var arrMsg = log.message.split(",");
	keystone.list("GuildWar").model.find({ guid:arrMsg[1]}).exec(function(err,datas){
		if(datas[0])
		{
			var theGuildWar = datas[0];
			if(log.logType == "GWRegister2")
			{
				if(!theGuildWar.guildIDs)
					theGuildWar.guildIDs = [];
				theGuildWar.guildIDs.push(arrMsg[0]);
			}
			if(log.logType == "GWMatch")
			{
				if(!theGuildWar.matchs)
				{
					theGuildWar.matchs = [];
				}
				var arrMatchs = arrMsg[0].split(":");
				_.each(arrMatchs,function(match){
					theGuildWar.matchs.push(match);
				});
			}
			if(log.logType == "GWRw")
			{
				if(!theGuildWar.rewards)
				{
					theGuildWar.rewards = [];
				}
				var arrRewards = arrMsg[0].split(":");
				_.each(arrRewards,function(reward){
					theGuildWar.rewards.push(reward);
				});
			}

			theGuildWar.save(function(err){
				utils.showErr(err);
				next();
			});
		}
		else
		{
			var parm = {};
			parm.guid = arrMsg[1];
			parm.firstDate = parm.guid.split("-")[0] || 0;
			parm.lastDate = parm.guid.split("-")[1] || 0;
			parm.timeStamp = Date.now()/1000;
  			var guildWarData = new guildWar.model(parm);
			//console.log("insert user %s,",parm.uid);
			guildWarData.save(function(err){
				if (err) {
					console.error(JSON.stringify(err));
				};
				self.insertLog(log,next);
			});			
		}
	});
}

exports = module.exports = guildWarManager;

