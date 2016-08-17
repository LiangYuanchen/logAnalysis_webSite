

var keystone = require("keystone");
var _ = require("underscore");
var _config = keystone.get("_config");
var winston = require("winston");
var StatsDClient = require('node-statsd-client').Client;
var client = new StatsDClient(_config.statsd.host, _config.statsd.port);
var utils_statsd = module.exports;
var prefix=_config.statsd.prefix;
var arrS = ["login","new_device","pve_start","pvp_start","server_err","odyssey_start","guild_pve_start","guild_pvp_start","explore_start","gems_purchase","gems_consumption","gold_purchase","energy_purchase","gold_consumption","energy_consumption"];

var hasInit = false;
var mapping_currency = {
	"IE":"innExp",
	"GB":"gembuy",
	"GO":"gemother",
	"GD":"gold",
	"PW":"power",
	"PC":"pvpCoin",
	"OC":"odysseyCoin",
	"ST":"sweepTicket",
	"GT":"gembuytotal",
	"GL":"gemothertotal",
	"GC":"guildCoin",
	"FM":"fame"};
if(!hasInit)
{
	for(var j=0;j<arrS.length;j++)
	{
		client.count(prefix+arrS[j],0);	
	}
	hasInit = true;
}

var sendCount = function(name)
{
	if(_.contains(arrS,name))
		client.increment(prefix+name);
	else
		winston.error("send statd count data %s,but not init",name);
}

utils_statsd.sendStatsdData = function(log)
{
	if(log.logType == "Register")
	{
		sendCount("new_device");
	}
	else if(log.logType == "LogOn")
	{
		sendCount("login");
	}
	else if(log.logType == "QuestStart")
	{
		sendCount("pve_start");
	}
	else if(log.logType == "PvP")
	{
		sendCount("pvp_start");
	}
	else if(log.logType == "MgrErr" || log.logType == "HandlerErr")
	{
		sendCount("server_err");
	}
	else if(log.logType == "QuestEliteStart")
	{
		sendCount("odyssey_start");
	}
	else if(log.logType == "GuildQStart2")
	{
		sendCount("guild_pve_start");
	}
	else if(log.logType == "GWStart2")
	{
		sendCount("guild_pvp_start");
	}
	else if(log.logType == "ExploreStart")
	{
		sendCount("explore_start");
	}
	if((log.code&4) == 4 )//log.logType=="TavernBuyGem"
	{
		client.gauge(prefix+"gems_purchase",parseInt(log.R1));
		client.count(prefix+"gems_purchase",parseInt(log.R1));
	}
	if((log.code&2) == 2)
	{
		client.gauge(prefix+"gems_consumption",parseInt(log.R1));
		client.count(prefix+"gems_consumption",parseInt(log.R1));
	}
	if(log.R3&&log.R3.length>0)
	{
		var r3arr = log.R3.split(":");
		var arrCurrency = {};
		for(var i=0;i<r3arr.length;i++)
		{
			var pR3 = r3arr[i].split("_");
			if(pR3[0]&&pR3[1])
				arrCurrency[pR3[0]] = pR3[1];
		}
		if(arrCurrency["GD"])
		{
			client.gauge(prefix+"gold_purchase",parseInt(arrCurrency["GD"]));
			client.count(prefix+"gold_purchase",parseInt(arrCurrency["GD"]));
		}
		if(arrCurrency["PW"])
		{
			client.gauge(prefix+"energy_purchase",parseInt(arrCurrency["PW"]));
			client.count(prefix+"energy_purchase",parseInt(arrCurrency["PW"]));
		}
	}
	if(log.R4&&log.R4.length>0)
	{
		var r4arr = log.R4.split(":");
		var arrCurrency = {};
		for(var i=0;i<r4arr.length;i++)
		{
			var pR4 = r4arr[i].split("_");
			if(pR4[0]&&pR4[1])
				arrCurrency[pR4[0]] = pR4[1];
		}
		if(arrCurrency["GD"])
		{
			client.gauge(prefix+"gold_consumption",parseInt(arrCurrency["GD"]));
			client.count(prefix+"gold_consumption",parseInt(arrCurrency["GD"]));
		}
		if(arrCurrency["PW"])
		{
			client.gauge(prefix+"energy_consumption",parseInt(arrCurrency["PW"]));
			client.count(prefix+"energy_consumption",parseInt(arrCurrency["PW"]));
		}
	}
	//console.log("sendStatsdData check over,log.logtype:%s",log.logType);
}



//需要加上title bgnip,endip,country

