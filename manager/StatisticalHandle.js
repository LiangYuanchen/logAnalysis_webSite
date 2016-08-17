/*
*	大部分功能已经废弃
*/
var keystone = require("keystone"),
	async = require('async'),
	_ = require('underscore'),
	innLog = keystone.list("InnLog"),
	gameUser = keystone.list("GameUser"),
    util = require("util");
    utils = require("./util/utils");
var manager = require("./manager");
///////// for test
var SYNCGameUserManager = require("./SYNCGameUserManager");
/////////
var statistical = require("./statistical");
var _config = keystone.get("_config");
var winston = require("./util/LogsBackup");
var gameconfigExchange = require("./GameConfigExchange");
var syncRetentionManager = require("./SYNCRetentionManager");
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var distinguishCountry = _config.distinguishCountry;
var cachedManager = require("./CachedManager");
var http = require('http');
var innloghandle = require("./innlogHandle");
var gameUserManager =require("./gameUserManager");

var statsCal = require("./statscal/StatsCal");
var countryCal =  require("./statscal/CountryCal");
var pvpInfoCal = require("./statscal/PvPInfoCal");
var gamelogCal = require("./statscal/GameLogCal");
var summaryCal = require("./statscal/SummaryCal");
var dayleftCal = require("./statscal/RetentionCal");
var costCal = require("./statscal/CostCal");
var gemCal = require("./statscal/GemCal");
var tutorialCal = require("./statscal/TutorialCal");
var sweepTicketCal = require("./statscal/SweepTicketCal");
var tavernCal = require("./statscal/TavernCal");
var gce = new gameconfigExchange();
var user_snapshot = require("./databases/mysql/user_snapshot");
var payuser_status_snapshot = require("./databases/mysql/Payuser_Status_SnapShot");
var gld_snapshot = require("./databases/mysql/Gld_SnapShot");
var conn_base = require("./databases/mysql/conn");
// var logTypeFilter = ["QuestFinish","TaskTakeRW","AdvOut","PlayerDailyRw","QuestSweep","QuestRewardFinish","StorageSell","Register","SubGemBuy","SubGemOther","SmithDecompose","MailTake","DishCook","AdvSummon","AdvLearnSkill","CoinShopPurchase"];
// var logTypeFilter_get = ["QuestFinish","TaskTakeRW","AdvOut","PlayerDailyRw","QuestSweep","QuestRewardFinish","StorageSell","Register","SubGemBuy","SubGemOther","SmithDecompose","MailTake"];
// var logTypeFilter_cost =["DishCook","AdvSummon","AdvLearnSkill","CoinShopPurchase"];

var ih = new innloghandle();
require("./util/datetime");

var StatisticalHandle = function(logDate,timezone){
	SYNCGameUserManager.call(this);
	var self = this;
	if(!logDate)
	{
		logDate = new Date()/1000;
		//winston.error("init StatisticalHandle error,logDate is null");
		//return;
	}
	self.basefirstDate = self.showDailyBegin(logDate);			//开始时间
	self.baselastDate = self.showDailyEnd(logDate);				//结束时间

	if(!isNaN(timezone))
	{
		self.firstDate = self.basefirstDate - 12*3600;
		self.lastDate = self.baselastDate + 12*3600;
	}
	else
	{
		self.firstDate = self.basefirstDate;
		self.lastDate = self.baselastDate;
	}
	self.firstDate_prepare = self.firstDate - 60*30;		//读取玩家实时情况准备的开始时间
	self.logDate = logDate;									//记录时间
	self.paiduids= [];										//已付费用户uid
	self.filteruids= [];									//被筛选用户uid
	self.innLevelMaxExps= [];								//酒馆等级经验映射表
	self.countrys= []; 										//国家array
	self.prices = [];										//价格array
	self.gameusers= [];										//玩家info array
	self.users_sync = {};									//玩家实时跑取情况key:uid，value: 最新的log
	self.gcTask = [];							            //task配置
	self.timezone = parseInt(timezone);
	self.tempRunTime ={
		hrtime:process.hrtime()
	};
	// self.logTypeFilter = logTypeFilter;
	// self.logTypeFilter_get = logTypeFilter_get;
	// self.logTypeFilter_cost = logTypeFilter_cost;

	self.tType= "daily";
};
util.inherits(StatisticalHandle,SYNCGameUserManager);

var fillProcesses = function(processes)
{
	var self =this;
	var sType = self.sType;
	if(!isNaN(self.timezone))
	{
		winston.info("fillProcesses only daysleft");
		for(var i=0;i<24;i++)
		{
			var theFirst = self.firstDate + i * 3600;
			var theLast = theFirst + 86400;
			processes.push(new dayleftCal(self,theFirst,theLast,i - 12 ));
		}
	}
	else
	{
		winston.info("fillProcesses for all");
		// processes.push(new statsCal(this,sType.logon,sType.logon_RD,"LogOn"));
		// processes.push(new pvpInfoCal(this));
		// processes.push(new costCal(this));
		processes.push(new summaryCal(this));
		processes.push(new dayleftCal(this,self.firstDate,self.lastDate));
		// processes.push(new countryCal(this,sType.country));
		// processes.push(new gemCal(this));
		// processes.push(new sweepTicketCal(this));
		 //processes.push(new gamelogCal(self));
		processes.push(new tutorialCal(self));
		// processes.push(new tavernCal(self));
	}
}

StatisticalHandle.prototype.handles = {};
StatisticalHandle.prototype.processes = [];
StatisticalHandle.prototype.sType = {
	logon:"104",
	logon_RD:"103",
	country:"190",
	country_RD:"194",
    level_pvp:"191",
    level_pvp_avg:"193",
    playerCount_pvp:"192",
    gold_get:"172",
    gold_cost:"173",
    gold_get_obj:"174",
    gold_cost_obj:"175",
    gem_get:"169",
    gembuy_get:"111",
    gem_cost:"170",
    gem_get_obj:"171",
    gem_cost_obj:"132",
    sweep_get:"176",
    sweep_cost:"177",
    sweep_get_obj:"178",
    sweep_cost_obj:"179",
    odyssey:"165",
    quest:"129",
    questSweep:"157",
    quest_uniq:"143",
    questSweep_uniq:"158",
    task:"130",
    phase:"144",
    task_uniq:"145",
    tutorial:"131",
    playTime:"133",
    playTime_session:"134",
    playTime_online:"189",
    errorType:"135",
    clientlog:"168",
    lastQuest:"167",
	tavernlevel:"195"
}
StatisticalHandle.prototype.set_gameusers= function(gameusers)
{
	this.gameusers = gameusers;
}
StatisticalHandle.prototype.SYNCCurrency= function(uid, key, value)
{
	var self = this;

	if(!self.users_sync[uid])
		self.users_sync[uid]={};
	self.users_sync[uid][key] = value;
	return self.users_sync[uid];
}
StatisticalHandle.prototype.getCountryBylog = function(log)
{
	var self =this;
	var theuser = _.find(self.gameusers,function(user){
		return user.uid == log.uid;
	});
	if(theuser&&theuser.country)
	{
		return theuser.country;
	}
	else
	{
		winston.debug("#StatisticalHandle#getCountryBylog# can't get country by gameusers,uid:%s",log.uid);
		if(typeof log.country=="string")
			return log.country;
		else
			return "";
	}
}

StatisticalHandle.prototype.dailyStatistical_onlyStepTrack = function(next){
	//LogOn
	//Country
	var self =this;
	var processes = [];
	processes.push(new tutorialCal(self));
	async.waterfall([
		function(cb){
			var sql = {timeStamp:{$gte:self.firstDate,$lt:self.lastDate},logType:{$in:["QuestFinish","Tutorial"]}};
			keystone.list("InnLog").model.find(sql).count(function(err,count){
				cb(null,count);
			});
		},
		function(logcount,cb){
			winston.info("calculate");
			var i=0;
			var parm = {timeStamp:{$gte:self.firstDate,$lt:self.lastDate},logType:{$in:["QuestFinish","Tutorial"]}};

			var stream = keystone.list("InnLog").model.find(parm).sort({timeStamp:1}).stream();
		    stream.on('data',function(item){
		    	_.each(processes, function(process){
			    	var options = {};
					if(_.contains(self.paiduids, item.uid))
						options.onlypaid=true;
		    		process.process(item, options);
		    	});
		    	++i;
		    	if(i%10000==0)
		    	{
		    		winston.info("over cal %d / %d",i,logcount);
		    	}
		    });
		    stream.on('end',function(){ //console.log('query ended');
		     }
		    	);
		    stream.on('close',function(){ //console.log('query closed');
				cb();
		     });
		},
		function(cb){
			winston.info("save");
			var results = [];
			var summarys = [];
			var retentions = [];
			var status = self.getBaseStats("daily");
			//var rc = _.find(processes,function(process){return process.CalType&&process.CalType == "RetentionCal"});
			//winston.debug("rc data:%s",JSON.stringify(rc.data));

			processes[0].save(status,function(){
				cb();
			});
		    //winston.info("results:" + JSON.stringify(results));
		}
		],function(err){
			winston.info("over test,TutorialCal_dailyStatistical!,firstDate:%s,lastDate:%s",self.firstDate,self.lastDate);
			next();
	});		
}
StatisticalHandle.prototype.dailyStatistical_onlySummary = function(next){
	//LogOn
	//Country
	var self =this;
	var processes = [];
	processes.push(new summaryCal(this));
	async.waterfall([
		function(cb){
			winston.info("handle StatisticalHandle get gameusers");

			keystone.list("InnLog").model.find({logType:{$in:["Register","LogOn"]},timeStamp:{$gte:self.firstDate,$lt:self.lastDate}}).distinct("uid").exec(function(err,uids){
				keystone.list("GameUser").model.find({uid:{$in:uids}}).select("_id uid region country registerdate lastQuest timezone innExp").exec(function(err,results){
					_.each(results,function(user){
						self.gameusers.push(user);
					});
					cb();
				});
			});
		},
		function(cb){
			var sql = {timeStamp:{$gte:self.firstDate,$lt:self.lastDate},logType:{$in:["Register","TavernBuyGem","LogOn"]}};
			keystone.list("InnLog").model.find(sql).count(function(err,count){
				cb(null,count);
			});
		},
		function(logcount,cb){
			//self.tempRunTime["EndHandle"] = process.hrtime(self.tempRunTime["BeginHandle"]);
			winston.info("calculate");
			var i=0;
			var parm = {timeStamp:{$gte:self.firstDate,$lt:self.lastDate},logType:{$in:["Register","TavernBuyGem","LogOn"]}};
			var stream = keystone.list("InnLog").model.find(parm).sort({timeStamp:1}).stream();
		    stream.on('data',function(item){
		   //  	if(item.timeStamp<self.firstDate)
		   //  	{
					// self.SYNCCurrency(item.uid,"gold",item.gold);
		   //  		return;
		   //  	}
		    	_.each(processes, function(process){
			    	var options = {};
					if(_.contains(self.paiduids, item.uid))
						options.onlypaid=true;
		    		process.process(item, options);
		    	});
		    	++i;
		    	if(i%10000==0)
		    	{
		    		winston.info("over cal %d / %d",i,logcount);
		    	}
		    	// if(item.logType=="LogOn")
		    	// {
		    	// 	self.SYNCCurrency(item.uid,"gold",item.gold);
		    	// }
		    });
		    stream.on('end',function(){ //console.log('query ended');
		     }
		    	);
		    stream.on('close',function(){ //console.log('query closed');
				cb();
		     });
		},
		function(cb){
			var willDel = false;
			for(var i=0;i<processes.length;i++)
			{
				if(processes[i].CalType == "CostCal")
				{
					willDel = true;
					break;
				}
			}
			if(willDel)
			{
		    		keystone.list("Statistical").model.find({firstDate:self.basefirstDate,lastDate:self.baselastDate}).remove(function(){
		    			cb();
		    		});
			}
			else
			{
				cb();
			}
		},
		function(cb){
			//self.tempRunTime["EndCalculate"] = process.hrtime(self.tempRunTime["EndHandle"]);
			winston.info("save");
			var results = [];
			var summarys = [];
			var retentions = [];
			var status = self.getBaseStats("daily");
			//var rc = _.find(processes,function(process){return process.CalType&&process.CalType == "RetentionCal"});
			//winston.debug("rc data:%s",JSON.stringify(rc.data));
			_.each(processes, function(process){
				if(!_.contains(["SummaryCal","RetentionCal","TutorialCal"],process.CalType))
		    		self.batchInsertStatistical(process.save(status),function(){});
		    	else if(process.CalType == "SummaryCal")
		    		summarys = _.union(summarys, process.save(status));
		    	else if(process.CalType == "RetentionCal")
		    		retentions = _.union(retentions,process.save(status));
		    	else if(process.CalType == "TutorialCal")
		    		process.save(status,function(){});
		    	else
		    		winston.error("null calType");
		    });
		    
		    async.waterfall([
		    	function(ccb){
		    		if(!isNaN(self.timezone))
		    		{
		    			ccb();
		    			return;
		    		}
		    		if(summarys.length==0)
		    		{
		    			ccb();
		    			return;
		    		}

		    		keystone.list("Summary").model.find({firstDate:self.firstDate,lastDate:self.lastDate}).remove(function(){
					    self.batchInsertAnyCollection("Summary",summarys,function(){
					    	//getLTV
							ih.getLTV_v2(self.firstDate,self.lastDate,"","",function(){
								ccb();
							});
					    	//ccb();
					    });
		    		});
		    	}
		    	],function(err){
		    		//self.tempRunTime["EndSaveData"] = process.hrtime(self.tempRunTime["EndCalculate"]);
		    	cb();
		    });
		    //winston.info("results:" + JSON.stringify(results));
		}
		],function(err){
			winston.info("over test,dailyStatistical!,firstDate:%s,lastDate:%s",self.firstDate,self.lastDate);
			console.log(JSON.stringify(self.tempRunTime));
			var siteStateBase = keystone.list("SiteState").model;
			var ss = new siteStateBase({lastSYNCAt:Date.now()/1000,hrtimeData:JSON.stringify(self.tempRunTime)});
			ss.save(function(){});
			next();
	});
}
StatisticalHandle.prototype.dailyStatistical_onlyRetention = function(next){
	//LogOn
	//Country
	var self =this;
	var processes = [];
	processes.push(new dayleftCal(this,self.firstDate,self.lastDate));
	async.waterfall([
		function(cb){
			winston.info("handle StatisticalHandle get gameusers");

			keystone.list("InnLog").model.find({logType:{$in:["Register","LogOn"]},timeStamp:{$gte:self.firstDate,$lt:self.lastDate}}).distinct("uid").exec(function(err,uids){
				keystone.list("GameUser").model.find({uid:{$in:uids}}).select("_id uid region country registerdate lastQuest timezone innExp").exec(function(err,results){
					_.each(results,function(user){
						self.gameusers.push(user);
					});
					cb();
				});
			});
		},
		function(cb){
			var sql = {timeStamp:{$gte:self.firstDate,$lt:self.lastDate},logType:{$in:["Register","LogOn"]}};
			keystone.list("InnLog").model.find(sql).count(function(err,count){
				cb(null,count);
			});
		},
		function(logcount,cb){
			winston.info("calculate");
			var i=0;
			var parm = {timeStamp:{$gte:self.firstDate,$lt:self.lastDate},logType:{$in:["Register","LogOn"]}};

			var stream = keystone.list("InnLog").model.find(parm).sort({timeStamp:1}).stream();
		    stream.on('data',function(item){
		    	_.each(processes, function(process){
			    	var options = {};
					if(_.contains(self.paiduids, item.uid))
						options.onlypaid=true;
		    		process.process(item, options);
		    	});
		    	++i;
		    	if(i%10000==0)
		    	{
		    		winston.info("over cal %d / %d",i,logcount);
		    	}
		    });
		    stream.on('end',function(){ //console.log('query ended');
		     }
		    	);
		    stream.on('close',function(){ //console.log('query closed');
				cb();
		     });
		},
		function(cb){
			winston.info("save");
			var results = [];
			var summarys = [];
			var retentions = [];
			var status = self.getBaseStats("daily");
			//var rc = _.find(processes,function(process){return process.CalType&&process.CalType == "RetentionCal"});
			//winston.debug("rc data:%s",JSON.stringify(rc.data));
			_.each(processes, function(process){
				retentions = _.union(retentions,process.save(status));
		    });
		    
		    async.waterfall([
		    	function(ccb){
		    		if(retentions.length==0)
		    		{
		    			ccb();
		    			return;
		    		}
		    		var sql = {logDate:self.basefirstDate};
		    		if(!isNaN(self.timezone))
		    			sql.timezone = {$exists:true};
		    		else
		    			sql.timezone = {$exists:false};

					var rc = _.filter(processes,function(process){return process.CalType&&process.CalType == "RetentionCal"});
					if(rc.length == 0 )
					{
						winston.error("retentionCal can not found");
						ccb();
						return;
					}

		    		keystone.list("DaysLeft").model.find(sql).remove(function(){
		    			ccb();
		    		});
		    	},
		    	function(ccb){
	    			self.batchInsertAnyCollection("DaysLeft",retentions,function(){
				    	var rc = _.find(processes,function(process){return process.CalType&&process.CalType == "RetentionCal"});
				    	if(rc.length == 0 )
				    	{
				    		winston.error("retentionCal can not found");
				    		ccb();
				    		return;
				    	}
						rc.getRetention(ccb);
				    });
		    	}
		    	],function(err){
		    		
		    	cb();
		    });
		    //winston.info("results:" + JSON.stringify(results));
		}
		],function(err){
			winston.info("over test,RetentionCal_dailyStatistical!,firstDate:%s,lastDate:%s",self.firstDate,self.lastDate);
			
			
			next();
	});	
}
StatisticalHandle.prototype.set_gameusers = function(gameusers)
{
	this.gameusers = gameusers;
}
StatisticalHandle.prototype.dailyStatistical_Save_RealTime = function(firstDate){
	var self = this;
	var keys = _.keys(self.handles);
	var handle =null;
	for(var i=0;i<keys.length;i++)
	{
		var parm = self.handles[keys[i]];
		if(parm.firstDate!=firstDate&&parm.isfinish==false)
		{
			handle = self.handles[firstDate];
			break;
		}
	}
	// _.each(keys,function(key){
	// 	if(key!=firstDate)
	// 	{
	// 		handle = self.handles[firstDate];
	// 	}
	// });
	if(handle)
	{
		handle.isfinish = true;
		handle.save_RealTime({},function(){
			var keys = _.keys(self.handles);
			var parms = {};
			for(var i=0;i<keys.length;i++)
			{
				var parm = self.handles[keys[i]];
				if(!parm.isfinish)
				{
					parms[keys[i]] = parm;
				}
				else
				{
					parm = null;
				}
			}
			self.handles = parms;
		});
	}
}
StatisticalHandle.prototype.dailyStatistical_RealTime = function(log,next){
	var self = this;
	var firstDate = self.showDailyBegin(log.timeStamp);
	async.waterfall([
		function(cb){
			if(!self.handles[firstDate]||self.handles[firstDate]==null)
			{
				self.handles[firstDate] = new StatisticalHandle(log.timeStamp);
				var handle = self.handles[firstDate];
				handle.init_RealTime({},function(){
					cb(null,handle);
				});
				winston.debug("#StatisticalHandle#create new handle,firstDate:%s",new Date(firstDate));
				self.dailyStatistical_Save_RealTime(firstDate);
			}
			else
			{
				var handle = self.handles[firstDate];
				cb(null,handle);
			}
		},
		function(handle,cb){
			handle.push_data_RealTime(log);
			cb();
		}
		],function(){
			next();
	});
}
StatisticalHandle.prototype.init_RealTime = function(options,next)
{
	var self = this;
	self.processes = [];
	self.i_logs=0;
	self.isfinish = false;

	fillProcesses.call(self,self.processes);
	async.waterfall([
		function(cb){
			winston.info("handle preice");
			if(self.prices.length==0)
			{
				gce.getgemprice(function(datas){
					self.prices = datas;
					cb();
				});
			}
			else
			{
				cb();
			}
		},	
		function(cb){
			winston.info("handle innLevelMaxExps");
			winston.debug("innelvel:%d",self.innLevelMaxExps.length);
			if(self.innLevelMaxExps.length==0)
			{
				gce.gettavernlevel(function(datas){
					self.innLevelMaxExps = datas;
					cb();
				});
			}
			else
			{
				cb();
			}
		},
		function(cb){
			winston.info("handle StatisticalHandle get task");
			gce.gettask(function(datas){
				self.gcTask = datas;
				cb();
			})
		}
		],function(){
			next();
	});
}
StatisticalHandle.prototype.push_data_RealTime = function(log)
{
	//paiduser
	//gameusers
	var self = this;
	if(log.logType=="TavernBuyGem")
	{
		self.paiduser.push(log.uid);
	}
	if(log.logType=="Register"||log.logType=="LogOn")
	{
		self.gameusers.push(log.uid);
	}
	var options = {};
	if(_.contains(self.paiduids, item.uid))
		options.onlypaid=true;
	_.each(processes, function(process){
		process.process(log, options);
	});
	self.i_logs++;
	if(self.i_logs%10000==0)
	{
		winston.info("#StatisticalHandle# push_data %s,date:%s",self.i_logs,self.firstDate);
	}
}
StatisticalHandle.prototype.save_RealTime = function(options,next)
{
	var self = this;
	async.waterfall([
		function(cb){
			keystone.list("GameUser").model.find({uid:{$in:self.gameusers}}).select("_id uid region country registerdate lastQuest timezone innExp").exec(function(err,results){
				if(err)
				{
					winston.error("#StatisticalHandle# error realtime get gameusers");
				}
				self.gameusers = results;
				cb();
			});
		},
		function(cb){
			var willDel = false;
			for(var i=0;i<processes.length;i++)
			{
				if(processes[i].CalType == "CostCal")
				{
					willDel = true;
					break;
				}
			}
			if(willDel)
			{
		    		keystone.list("Statistical").model.find({firstDate:self.basefirstDate,lastDate:self.baselastDate}).remove(function(){
		    			cb();
		    		});
			}
			else
			{
				cb();
			}
		},
		function(cb){
			self.tempRunTime["EndCalculate"] = process.hrtime(self.tempRunTime["EndHandle"]);
			winston.info("save");
			var results = [];
			var summarys = [];
			var retentions = [];
			var status = self.getBaseStats("daily");
			//var rc = _.find(processes,function(process){return process.CalType&&process.CalType == "RetentionCal"});
			//winston.debug("rc data:%s",JSON.stringify(rc.data));
			_.each(processes, function(process){
				if(!_.contains(["SummaryCal","RetentionCal","TutorialCal"],process.CalType))
		    		self.batchInsertStatistical(process.save(status),function(){});
		    	else if(process.CalType == "SummaryCal")
		    		summarys = _.union(summarys, process.save(status));
		    	else if(process.CalType == "RetentionCal")
		    		retentions = _.union(retentions,process.save(status));
		    	else if(process.CalType == "TutorialCal")
		    		process.save(status,function(){});
		    	else
		    		winston.error("null calType");
		    });
		    
		    async.waterfall([
		    	function(ccb){
		    		if(!isNaN(self.timezone))
		    		{
		    			ccb();
		    			return;
		    		}
		    		if(summarys.length==0)
		    		{
		    			ccb();
		    			return;
		    		}

		    		keystone.list("Summary").model.find({firstDate:self.firstDate,lastDate:self.lastDate}).remove(function(){
					    self.batchInsertAnyCollection("Summary",summarys,function(){
					    	//getLTV
							// ih.getLTV_v2(self.firstDate,self.lastDate,"","",function(){
							// 	ccb();
							// });
					    	ccb();
					    });
		    		});
		    	},
		    	function(ccb){
			    		if(retentions.length==0)
			    		{
			    			ccb();
			    			return;
			    		}
			    		var sql = {logDate:self.basefirstDate};
			    		if(!isNaN(self.timezone))
			    			sql.timezone = {$exists:true};
			    		else
			    			sql.timezone = {$exists:false};

						var rc = _.filter(processes,function(process){return process.CalType&&process.CalType == "RetentionCal"});
						if(rc.length == 0 )
						{
							winston.error("retentionCal can not found");
							ccb();
							return;
						}

			    		keystone.list("DaysLeft").model.find(sql).remove(function(){
			    			ccb();
			    		});
			    },
			    function(ccb){
		    		if(retentions.length==0)
		    		{
		    			ccb();
		    			return;
		    		}
	    			self.batchInsertAnyCollection("DaysLeft",retentions,function(){
				    	var rc = _.find(processes,function(process){return process.CalType&&process.CalType == "RetentionCal"});
				    	if(rc.length == 0 )
				    	{
				    		winston.error("retentionCal can not found");
				    		ccb();
				    		return;
				    	}
				    	rc.getRetention(ccb);
				    });
			    }
		    	],function(err){
		    		self.tempRunTime["EndSaveData"] = process.hrtime(self.tempRunTime["EndCalculate"]);
		    	cb();
		    	});
		    }	    
		],function(){
			winston.info("#StatisticalHandle# over dailyStatistical data");
			next();	
	});
}

StatisticalHandle.prototype.dailyStatistical = function(next){
	//LogOn
	//Country
	var self =this;
	var processes = [];
	fillProcesses.call(self,processes);
	async.waterfall([
		function(cb)
		{
			winston.info("handle,data :"+self.firstDate);
			self.tempRunTime["BeginHandle"] = process.hrtime(self.tempRunTime.hrtime);
			self.handle({logDate:self.logDate},cb);
		},
		function(cb){
			var sql = {timeStamp:{$gte:self.firstDate,$lt:self.lastDate},logType:{$in:["QuestFinish","Tutorial","Register","LogOn","TavernBuyGem"]}};
			keystone.list("InnLog").model.find(sql).count(function(err,count){
				cb(null,count);
			});
		},
		function(logcount,cb){
			self.tempRunTime["EndHandle"] = process.hrtime(self.tempRunTime["BeginHandle"]);
			winston.info("calculate");
			var i=0;
			var parm = {timeStamp:{$gte:self.firstDate,$lt:self.lastDate},logType:{$in:["QuestFinish","Tutorial","Register","LogOn","TavernBuyGem"]}};
			var stream = keystone.list("InnLog").model.find(parm).sort({timeStamp:1}).stream();
		    stream.on('data',function(item){
		   //  	if(item.timeStamp<self.firstDate)
		   //  	{
					// self.SYNCCurrency(item.uid,"gold",item.gold);
		   //  		return;
		   //  	}
		    	_.each(processes, function(process){
			    	var options = {};
					if(_.contains(self.paiduids, item.uid))
						options.onlypaid=true;
		    		process.process(item, options);
		    	});
		    	++i;
		    	if(i%10000==0)
		    	{
		    		winston.info("over cal %d / %d",i,logcount);
		    	}
		    	// if(item.logType=="LogOn")
		    	// {
		    	// 	self.SYNCCurrency(item.uid,"gold",item.gold);
		    	// }

		    });
		    stream.on('end',function(){ //console.log('query ended');
		     }
		    	);
		    stream.on('close',function(){ //console.log('query closed');
				cb();
		     });
		},
		function(cb){
			var willDel = false;
			for(var i=0;i<processes.length;i++)
			{
				if(processes[i].CalType == "GameLogCal")
				{
					willDel = true;
					break;
				}
			}
			if(willDel)
			{
		    		keystone.list("Statistical").model.find({firstDate:self.basefirstDate,lastDate:self.baselastDate}).remove(function(){
		    			cb();
		    		});
			}
			else
			{
				cb();
			}
		},
		function(cb){
			self.tempRunTime["EndCalculate"] = process.hrtime(self.tempRunTime["EndHandle"]);
			winston.info("save");
			var results = [];
			var summarys = [];
			var retentions = [];
			var status = self.getBaseStats("daily");
			//var rc = _.find(processes,function(process){return process.CalType&&process.CalType == "RetentionCal"});
			//winston.debug("rc data:%s",JSON.stringify(rc.data));
			_.each(processes, function(process){
				if(!_.contains(["SummaryCal","RetentionCal","TutorialCal"],process.CalType))
		    		self.batchInsertStatistical(process.save(status),function(){});
		    	else if(process.CalType == "SummaryCal")
		    		summarys = _.union(summarys, process.save(status));
		    	else if(process.CalType == "RetentionCal")
		    		retentions = _.union(retentions,process.save(status));
		    	else if(process.CalType == "TutorialCal")
		    		process.save(status,function(){});
		    	else
		    		winston.error("null calType");
		    });
		    console.log("retentions's length:%s",retentions.length);
		    async.waterfall([
		    	function(ccb){
		    		if(!isNaN(self.timezone))
		    		{
		    			ccb();
		    			return;
		    		}
		    		if(summarys.length==0)
		    		{
		    			ccb();
		    			return;
		    		}
		    		keystone.list("Summary").model.find({firstDate:self.firstDate,lastDate:self.lastDate}).remove(function(){
					    self.batchInsertAnyCollection("Summary",summarys,function(){
					    	//getLTV
							ih.getLTV_v2(self.firstDate,self.lastDate,"","",function(){
								ccb();
							});
					    	//ccb();
					    });
		    		});
		    	},
		    	function(ccb){
			    		if(retentions.length==0)
			    		{
			    			ccb();
			    			return;
			    		}
			    		var sql = {logDate:self.basefirstDate};
			    		if(!isNaN(self.timezone))
			    			sql.timezone = {$exists:true};
			    		else
			    			sql.timezone = {$exists:false};

						var rc = _.filter(processes,function(process){return process.CalType&&process.CalType == "RetentionCal"});
						if(rc.length == 0)
						{
							winston.error("retentionCal can not found");
							ccb();
							return;
						}

			    		keystone.list("DaysLeft").model.find(sql).remove(function(){
			    			ccb();
			    		});
			    },
			    function(ccb){
		    		if(retentions.length==0)
		    		{
		    			ccb();
		    			return;
		    		}
	    			self.batchInsertAnyCollection("DaysLeft",retentions,function(){
				    	var rc = _.find(processes,function(process){return process.CalType&&process.CalType == "RetentionCal"});
				    	if(rc.length == 0 )
				    	{
				    		winston.error("retentionCal can not found");
				    		ccb();
				    		return;
				    	}
				    	rc.getRetention(ccb);
				    });
			    }
		    	],function(err){
		    		self.tempRunTime["EndSaveData"] = process.hrtime(self.tempRunTime["EndCalculate"]);
		    	cb();
		    });
		    //winston.info("results:" + JSON.stringify(results));
		}
		],function(err){
			winston.info("over test,dailyStatistical!,firstDate:%s,lastDate:%s,logDate:%s",self.firstDate,self.lastDate,Date.now());
			console.log(JSON.stringify(self.tempRunTime));
			var siteStateBase = keystone.list("SiteState").model;
			var ss = new siteStateBase({lastSYNCAt:Date.now()/1000,hrtimeData:JSON.stringify(self.tempRunTime)});
			ss.save(function(){});
			next();
	});
}
StatisticalHandle.prototype.initPayingInfo = function(log){
	var self =this;
	var payingInfo = keystone.list("PayingInfo");
	if(!log)
	{
		winston.error("#manager#insertPayingInfo error,log:%s",JSON.stringify(log));
		return undefined;
	}
	if(!log.subType||log.subType!="buygem")
	{
		winston.error("#manager#insertPayingInfo error, log's subtype is not buygem,log:%s",JSON.stringify(log));
		return undefined;
	}
	if(!self.gameusers||self.gameusers.length==0)
	{
		winston.error("#manager#insertPayingInfo error,the gameusers error.gamesuers:%s",JSON.stringify(self.gameusers));
		return undefined;
	}
	var arrMsg = log.message.split(",");
	var innlogid=log._id;
	var gem = parseInt(log.R1);
	var orderid = arrMsg[2];
	var uid = log.uid;
	var region = log.R2;
	if(isNaN(log.R2))
		region=1;
	if(!orderid)
	{
		winston.error("#manager#insertPayingInfo error,the TavernBuyGem message error,log:%s",JSON.stringify(log));
	}
	if(orderid&&orderid.length<=8)
	{
		try{
			orderid = JSON.parse( arrMsg[5]+"}").orderId;
		}
		catch(err){
			try{
				orderid = JSON.parse( arrMsg[2]+"}").orderId;
			}
			catch(err)
			{
				try{
					orderid = JSON.parse( arrMsg[4]+"}").orderId;
				}
				catch(err)
				{
					try{
						orderid = JSON.parse( arrMsg[3]+"}").orderId;
					}
					catch(err)
					{
						self.showError(err);
						winston.error("#StatisticalHandle#insertPayingInfo error,err:%s,the message:%s",arrMsg[5]+"\"}",log.message);
						return undefined;						
					}
				}
			}
		}
	}

	//var money = ih.getPriceWithExcelChanged(log,self.prices);
	var money = utils.GetProduct_Price("2",log.message);
	if(money==0)
	{

	}
	var gameuser = _.find(self.gameusers,function(user){return user.uid==log.uid});
	var gameuserid = "55cd86fd189fddaf0638bf4c";
	if(gameuser)
		gameuserid = gameuser._id;
	var newPayingInfo = {
		timeStamp : log.timeStamp,
		orderId:orderid,
		gamer:gameuserid,
		innlog:innlogid,
		gem:gem,
		money:money,
		uid:uid,
		region:region
	};
	return newPayingInfo;
}
StatisticalHandle.prototype.Handle_temp = function(options,next)
{
	var self =this;
	var tempUid_Country = {};
	async.waterfall([
		function(cb){
			keystone.list("GameUser").model.update({country:""},{$unset:{country:1}},function(err){
				utils.showErr(err);
				cb();
			});
		},
		function(cb){
			keystone.list("InnLog").model.update({country:"",timeStamp:{$gte:self.firstDate,$lt:self.lastDate}},{$unset:{country:1}},function(err){
				utils.showErr(err);
				cb();
			});
		},
		function(cb){
			var gm =new gameUserManager();
		      gm.updateAll_Country(function(){
		         winston.info("over updateUser_Country");
		         cb();
		      });
		}
		],function(err){
			utils.showErr(err);
			next();
	});
}
StatisticalHandle.prototype.handle_sync = function(options,next)
{
	var self = this;
	async.waterfall([
		
		],function(){

	});
}
StatisticalHandle.prototype.handleOnlyMysql = function(options,next){
	var self = this;
	async.waterfall([
		// function(cb){
		// 	if(_config.mysql.isopen)
		// 	{
		// 		winston.info("##StatisticalHandle#handleOnlyMysql#delete User_SnapShot");
		// 		var conn = new conn_base();
		// 		conn.deleteByCrt_DT(self.basefirstDate,"User_SnapShot",cb);
		// 	}
		// 	else
		// 	{
		// 		cb();
		// 	}
		// },
		// function(cb){
		// 	if(_config.mysql.isopen)
		// 	{
		// 		winston.info("##StatisticalHandle#handleOnlyMysql#delete Payuser_Status_SnapShot");
		// 		var conn = new conn_base();
		// 		conn.deleteByCrt_DT(self.basefirstDate,"Payuser_Status_SnapShot",cb);
		// 	}
		// 	else
		// 	{
		// 		cb();
		// 	}
		// },
		// function(cb){
		// 	if(_config.mysql.isopen)
		// 	{
		// 		winston.info("##StatisticalHandle#handleOnlyMysql#delete Gld_SnapShot");
		// 		var conn = new conn_base();
		// 		conn.deleteByCrt_DT(self.basefirstDate,"Gld_SnapShot",cb);

		// 	}
		// 	else
		// 		cb();
		// },
		function(cb){
			keystone.list("Guild").model.find({timeStamp:{$gte:self.basefirstDate,$lt:self.baselastDate}}).exec(function(err,datas){
				winston.info("##StatisticalHandle#handleOnlyMysql#Guild insert");
				var i = 0;
				if(!datas||!datas.length||datas.length==0)
				{
					cb();
					return;
				}
				async.whilst(
					function(){return i<datas.length},
					function(callback){
						var guild = datas[i];
						var the_guild = new gld_snapshot(guild);
						the_guild.save(function(){
							i++;
							callback();
						});
					},
					function(){
						cb();
					}
				);
			});
		},
		function(cb){
			//winston.info("handle StatisticalHandle get gameusers");
			if(!_config.mysql.isopen)
			{
				cb();
				return;
			}
			if(self.gameusers.length==0)
			{
				keystone.list("InnLog").model.find({logType:{$in:["Register","LogOn","LogOut"]},timeStamp:{$gte:self.firstDate,$lt:self.lastDate}}).distinct("uid").exec(function(err,uids){
					keystone.list("GameUser").model.find({uid:{$in:uids}}).select("_id uid lastlogdate region country registerdate lastQuest timezone innExp").exec(function(err,results){
						var i=0;
						async.whilst(function(){
							return i< results.length;
						},
						function(callback){
							var user = results[i];
							self.gameusers.push(user);

							i++;
							callback();			
						},
						function(){
							cb();
						}
						);
					});
				});
			}
			else{
				cb();
			}
		},
		function(cb){
			if(_config.mysql.isopen)
			{
				winston.info("##StatisticalHandle#handleOnlyMysql#user insert");
				var i  = 0;
				var results =self.gameusers;
				async.whilst(function(){
					return i< results.length;
				},
				function(callback){
					var user = results[i];
					
					async.waterfall([
						function(cbb){
							user.lastlogdate = self.basefirstDate;
							var the_user_snapshot = new user_snapshot(user);
							the_user_snapshot.save(cbb);
						},
						function(cbb){
							var payuser_snapshot =  new payuser_status_snapshot(user);
							payuser_snapshot.save(cbb);
						}
						],function(){
						i++;
						//console.log("over saved user_snapshot:%s",i);
						callback();
					});		
				},
				function(){
					cb();
				}
				);				
			}
			else
			{
				cb();
			}			
		}
		],function(err){
			winston.info("over handle mysql");
			next();
	});	
}
StatisticalHandle.prototype.handle = function(options,next)
{
	var self = this;
	async.waterfall([
		function(cb){
			winston.info("handle StatisticalHandle get gameusers");

			keystone.list("InnLog").model.find({logType:{$in:["Register","LogOn"]},timeStamp:{$gte:self.firstDate,$lt:self.lastDate}}).distinct("uid").exec(function(err,uids){
				keystone.list("GameUser").model.find({uid:{$in:uids}}).select("_id uid region country registerdate lastQuest timezone innExp").exec(function(err,results){
					_.each(results,function(user){
						self.gameusers.push(user);
					});
					cb();
				});
			});
		},
		// function(cb){
		// 	self.Handle_temp(options,cb);
		// },
		function(cb){
			winston.info("handle preice");
			if(self.prices.length==0)
			{
				gce.getgemprice(function(datas){
					self.prices = datas;
					cb();
				});
			}
			else
			{
				cb();
			}
		},	
		function(cb){
			winston.info("handle innLevelMaxExps");
			winston.debug("innelvel:%d",self.innLevelMaxExps.length);
			if(self.innLevelMaxExps.length==0)
			{
				gce.gettavernlevel(function(datas){
					self.innLevelMaxExps = datas;
					cb();
				});
			}
			else
			{
				cb();
			}
		},
		function(cb){
			winston.info("handle StatisticalHandle get task");
			gce.gettask(function(datas){
				self.gcTask = datas;
				cb();
			})
		},
		// function(cb){
		// 	self.addSignCountryOfInnLog(self.firstDate,self.lastDate,cb);
		// 	winston.info("addSignCountryOfInnLog");
		// },
		function(cb){
			winston.info("handle payingInfo");
			keystone.list("PayingInfo").model.find({timeStamp:{$gte:self.firstDate,$lt:self.lastDate}}).remove(function(err){
				keystone.list("InnLog").model.find({timeStamp:{$gte:self.firstDate,$lt:self.lastDate},logType:"TavernBuyGem",subType:"buygem"}).exec(function(err,results){
					if(err)
					{
						winston.info("#StatisticalHandle#handle error");
						utils.showErr(err);
					}
					
					var payinginfos = [];
					_.each(results,function(log){
						var result = self.initPayingInfo(log);
						if(result!=undefined)
							payinginfos.push(result);
					});
					if(payinginfos.length>0){
						self.batchInsertAnyCollection("PayingInfo",payinginfos,function(err){
							if(err)
							{
								winston.info("#StatisticalHandle#handle error2");
								utils.showErr(err);
							}
							cb(null,payinginfos);
						});
					}
					else
					{
						cb(null,payinginfos);
					}
				});
			});
			winston.info("getAdvInsertPayingInfo");
		},
		function(payinginfos,cb){
			var payinginfo_uids = [];
			_.each(payinginfos,function(info){
				if(!_.contains(payinginfo_uids,info.uid))
					payinginfo_uids.push(info.uid);
			});
			keystone.list("GameUser").model.find({uid:{$in:payinginfo_uids}}).exec(function(err,results){
				if(err)
				{
					winston.error("#StatisticalHandle# erroo handle 3");
					utils.showErr(err);
				}
				if(!results||results.length==0)
				{
					cb();
					return;
				}
				var i = 0;
				async.whilst(
					function(){
						return i < results.length;
					},
					function(callback){
						var user = results[i];
						if(!user.firstpaydate)
						{
							var payinginfo = _.find(payinginfos,function(parm){ return parm.uid = user.uid });
							user.firstpaydate = payinginfo.timeStamp;
							user.save(function(){
								i++;
								callback();
							});
						}
						else
						{
							i++;
							callback();
						}
					},
					function(){
						cb();
					}
				);
			});
			winston.info("getGameUserFirstpaydate");
		},
		function(cb){
			winston.info("handle paiduids");
			if(self.paiduids.length==0)
			{
			//	winston.debug("begin get paidMan");
				keystone.list("GameUser").model.find({firstpaydate:{$lt:self.lastDate}}).distinct("uid").exec(function(err,results){
					self.paiduids=results;
					cb();
				});
			}
			else
			{
				cb();
			}
		}
		],function(err){
			winston.info("over handle");
			next();
	});
}


StatisticalHandle.prototype.getBaseStats = function(dType){
    var statisticalJSON = {firstDate:this.firstDate, lastDate:this.lastDate, logDate:this.logDate};

	switch(dType){
		case "daily":
			statisticalJSON.tType=1;
		break;
		case "weekly":
			statisticalJSON.tType=2;
		break;
		case "monthly":
			statisticalJSON.tType=3;
		break;
		default:
		break;
	}
	return statisticalJSON;
}
exports = module.exports = StatisticalHandle;
