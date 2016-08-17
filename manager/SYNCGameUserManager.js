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
var ih = new innloghandle();
require("./util/datetime");

var SYNCGameUserManager = function(){
	statistical.call(this);
	var self = this;
	self.logs=[];
	self.users={};
	self.paiduids=[];
	self.filteruids=[];
	self.countrys=[];
	self.prices =[];
	self.temp = new temp();
	self.alllogs=[];
	self.logs_region={};	
	self.gameusers=[];
};
var temp = function(){
	this.uids_logon={all:[]};
	this.uids_logon_onlypaid={all:[]};
}
temp.prototype.set_uids_logon = function(log)
{
	if(!this.uids_login["Not_CN"])
		this.uids_logon["Not_CN"]=[];
	if(log.country.toUpperCase()!="CN")
		this.uids_logon["Not_CN"].push(log.uid);	
	if(!log.country)
		this.uids_logon["all"].push(log.uid);
	else
	{
		if(!this.uids_logon[log.country]) 
			this.uids_logon[log.country] = [];
		this.uids_logon[log.country].push(log.uid);		
	}
}
temp.prototype.set_uids_logon_onlypaid = function(log)
{
	if(!this.uids_login_onlypaid["Not_CN"])
		this.uids_login_onlypaid["Not_CN"]=[];
	if(log.country.toUpperCase()!="CN")
		this.uids_login["Not_CN"].push(log.uid);	
	if(!log.country)
		this.uids_logon_onlypaid["all"].push(log.uid);
	else
	{
		if(!this.uids_logon_onlypaid[log.country])
			this.uids_logon_onlypaid[log.country] = [];

		this.uids_logon_onlypaid[log.country].push(log.uid);		
	}
}
SYNCGameUserManager.prototype.uids_logon = {};
SYNCGameUserManager.prototype.uids_logon_onlypaid = {};
util.inherits(SYNCGameUserManager,statistical);
var logTypeFilter = ["QuestFinish","TaskTakeRW","AdvOut","PlayerDailyRw","QuestSweep","QuestRewardFinish","StorageSell","Register","SubGemBuy","SubGemOther","SmithDecompose","MailTake","DishCook","AdvSummon","AdvLearnSkill","CoinShopPurchase"];
var logTypeFilter_get = ["QuestFinish","TaskTakeRW","AdvOut","PlayerDailyRw","QuestSweep","QuestRewardFinish","StorageSell","Register","SubGemBuy","SubGemOther","SmithDecompose","MailTake"];
var logTypeFilter_cost =["DishCook","AdvSummon","AdvLearnSkill","CoinShopPurchase"];
SYNCGameUserManager.prototype.logs=[];
SYNCGameUserManager.prototype.users={};
SYNCGameUserManager.prototype.alllogs=[];
SYNCGameUserManager.prototype.logs_region={};
SYNCGameUserManager.prototype.filteruids=[];
SYNCGameUserManager.prototype.paiduids=[];
SYNCGameUserManager.prototype.countrys=[];
SYNCGameUserManager.prototype.prices=[];
SYNCGameUserManager.prototype.innLevelMaxExps=[];
SYNCGameUserManager.prototype.gameusers = [];
SYNCGameUserManager.prototype.viplevels=[];
SYNCGameUserManager.prototype.getInnLevelByExp = function(exp){
	var self =this;
	var values = _.values(self.innLevelMaxExps);
	for(var i=0;i<values.length;i++)
	{
		if(parseInt(values[i])>parseInt(exp))
		{
			return (i + 1);
		}
	}
	return 0;
	winston.error("getInnLevelByExp error,exp:%d,self.innLevelMaxExps:%s",exp,JSON.stringify(self.innLevelMaxExps));
}
SYNCGameUserManager.prototype.getVipLevelByGemBuyTotal = function(gembuytotal,next)
{
	var self =this;
	var viplevel = 0;
	async.waterfall([
		function(cb){
			if(self.viplevels.length==0)
			{
				var gc = new gameconfigExchange();
				gc.getHistoryExchange({table:"vipLevels",typeid:"typeId",value:"maxGem",firstDate:dateInfo.firstDate},function(data){
					self.viplevels = data;
					winston.debug("viplevels:%s",JSON.stringify(self.viplevels))
					cb();
				});				
			}
			else
				cb();
		},
		function(cb){
			var keys=_.keys(self.vipLevels);
			for(var i=0;i<keys.length;i++)
			{
				var value =parseInt( self.viplevels[keys[i]]);
				if(gembuytotal<value)
					viplevel = key;
			}
		}
		],function(err){
		next(viplevel);

	});
}
SYNCGameUserManager.prototype.dataBind=function(options,next){
	var self = this;
	
	var statisticalJSON = self.initStatisticalJSON("daily",options.logDate,"");
	var sql={timeStamp:{$gte:statisticalJSON.firstDate,$lt:statisticalJSON.lastDate}};
	winston.debug("dataBind logDate:%s,the sql:%s",options.logDate, utils.stringify(sql));
	var doIt = function(logArr,callback)
	{
		// var i=0;
		// while(i<10)
		// {
			_.each(logArr,function(parm){
				if(_.contains(self.filteruids,parm.uid))
				{
					return;
				}
				if(parm.timeStamp>=statisticalJSON.firstDate&&parm.timeStamp<statisticalJSON.lastDate)
				{
					var p = _.pick(parm,"R1","message","uid","gold","logType","timeStamp","power","country","subType","gemother","gembuy","R2","innExp");
					if(!isNaN( parm.R2))
					{
						if(!self.logs_region[parm.R2])
						{
							self.logs_region[parm.R2]=[];
						}	
						self.logs_region[parm.R2].push(p);				
					}
					self.alllogs.push(p);
					self.logs.push(p);
				}
			});		
			//i++;	
		//}

		winston.debug("logArr gets,currentlength:%d",self.logs.length);
		callback();
	}
	self.selectByStream(sql,doIt,next);
}
function getGroupAndSum(arr){
	var datas = _.groupBy(arr,function(num){return num});
	var keys = _.keys(datas);
	for (var i = keys.length - 1; i >= 0; i--) {
		datas[keys[i]] = datas[keys[i]].length;
	};
	return JSON.stringify(datas);
}
SYNCGameUserManager.prototype.RTStatistical = function(firstDate,lastDate,next)
{
	var self = this;
	self.logs=[];
	var logDate = Date.now()/1000;
	var rt = new cachedManager();
	//sdebugger;
	async.waterfall([
		function(cb){
			winston.info("begin get RTStatistical ");
			var getIt = function(callback){
				rt.RTUser("",function(result){
					if(result)
					{
						self.logs.push(result);
						setImmediate(getIt,callback);
					}
					else
						callback();
				});
			}
			setImmediate(getIt,cb);
		},
		function(cb){
			winston.info("Get RTStatistical length:%d",self.logs.length);
			var parms={};

			_.each(self.logs,function(log){

				if(!parms[log.R2])
				{
					parms[log.R2]={uids:[],sessions:0,paidusers:0,registers:0,msgerrs:0,handleerrs:0};
				}
				var parm = parms[log.R2];
				parm.sessions++;
				if(log.logType=="Register")
					parm.registers++;
				if(log.subType=="buygem")
					parm.paidusers++;
				if(log.logType=="HandlerErr")
					parm.handleerrs++;
				if(log.MgrErr=="MgrErr")
					parm.msgerrs++;
				if(!_.contains(parm.uids,log.uid))
					parm.uids.push(log.uid);
			});
			cb(null,parms);
		},
		function(parms,cb)
		{
			var statisticalJSONs =[];
			var keys = _.keys(parms);
			
			var totaluids=0;
			var totalsessions=0;
			var totalregisters=0;
			var totalmsgerrs = 0;
			var totalhandleerrs=0;
			var totalpaidusers=0;
			_.each(keys,function(key){
				var parm = parms[key];
				var statisticalJSON_online = {region:parseInt(key), logDate:logDate,firstDate:firstDate,lastDate:lastDate,sType:"1",count:parm.uids.length}; 			
				statisticalJSONs.push(statisticalJSON_online);
				var statisticalJSON_session={region:parseInt(key),logDate:logDate,firstDate:firstDate,lastDate:lastDate,sType:"4",count:parm.sessions}; 			
				statisticalJSONs.push(statisticalJSON_session);
				var statisticalJSON_register={region:parseInt(key),logDate:logDate,firstDate:firstDate,lastDate:lastDate,sType:"5",count:parm.registers};
				statisticalJSONs.push(statisticalJSON_register);
				var statisticalJSON_msgerr = {region:parseInt(key),logDate:logDate,firstDate:firstDate,lastDate:lastDate,sType:"9",count:parm.msgerrs};
				statisticalJSONs.push(statisticalJSON_msgerr);
				var statisticalJSON_handleerr ={region:parseInt(key),logDate:logDate,firstDate:firstDate,lastDate:lastDate,sType:"10",count:parm.handleerrs};
				statisticalJSONs.push(statisticalJSON_handleerr);
				var statisticalJSON_paiduser = {region:parseInt(key),logDate:logDate,firstDate:firstDate,lastDate:lastDate,sType:"11",count:parm.paidusers};
				statisticalJSONs.push(statisticalJSON_paiduser);
				totaluids+=parm.uids.length;
				totalsessions+=parm.sessions;
				totalregisters+=parm.registers;
				totalpaidusers+=parm.paidusers;
				totalmsgerrs+=parm.msgerrs;
				totalhandleerrs+=parm.handleerrs;
			});
				var statisticalJSON_online = {logDate:logDate,firstDate:firstDate,lastDate:lastDate,sType:"1",count:totaluids}; 			
				statisticalJSONs.push(statisticalJSON_online);
				var statisticalJSON_session={logDate:logDate,firstDate:firstDate,lastDate:lastDate,sType:"4",count:totalsessions}; 			
				statisticalJSONs.push(statisticalJSON_session);
				var statisticalJSON_register={logDate:logDate,firstDate:firstDate,lastDate:lastDate,sType:"5",count:totalregisters};
				statisticalJSONs.push(statisticalJSON_register);
				var statisticalJSON_msgerr = {logDate:logDate,firstDate:firstDate,lastDate:lastDate,sType:"9",count:totalmsgerrs};
				statisticalJSONs.push(statisticalJSON_msgerr);
				var statisticalJSON_handleerr ={logDate:logDate,firstDate:firstDate,lastDate:lastDate,sType:"10",count:totalhandleerrs};
				statisticalJSONs.push(statisticalJSON_handleerr);
				var statisticalJSON_paiduser = {logDate:logDate,firstDate:firstDate,lastDate:lastDate,sType:"11",count:totalpaidusers};
				statisticalJSONs.push(statisticalJSON_paiduser);					
	
			self.batchInsertStatistical(statisticalJSONs,cb);
		}
		],function(err){
			//winston.info("over RTStatistical")
			next();
	});
}
SYNCGameUserManager.prototype.getFilterUids = function(logDate,next){
	var self = this;
	async.waterfall([
		function(cb){
			keystone.list("SiteLog").model.find({postType:"/tavernedit",timeStamp:{$lte:logDate}}).select("message").exec(function(err,results){
				var clearUids=self.filteruids;
				_.each(results,function(msg){
					try{
						var objMsg=JSON.parse(msg.message);
						if(objMsg.uid)
						{
							clearUids.push(objMsg.uid);
						}
					}
					catch(err){
						winston.info("error,Sitelog message is not json,%s",msg.message);
					}
				});
				clearUids = _.uniq(clearUids);
				cb();
			});			
		}
		],function(){
			next();
	});
}
SYNCGameUserManager.prototype.clusterDemo = function(next){
	if (cluster.isMaster) {
	  // Fork workers.
	  for (var i = 0; i < numCPUs; i++) {
	    cluster.fork();
	  }

	  cluster.on('exit', function(worker, code, signal) {
	    console.log('worker ' + worker.process.pid + ' died');
	  });
	} else {
		winston.info("lalala");
	}
}
SYNCGameUserManager.prototype.Linshi_getRetention = function(logDate,next)
{
	var sType = "daily";
		var self = this;
		var syncDayleft ;
		var baseS= self.initStatisticalJSON("daily",logDate,"");
		async.waterfall([	
		function(cb){
			var dateInfo = self.initStatisticalJSON("daily",logDate,"");
			keystone.list("DaysLeft").model.find({logDate:dateInfo.firstDate}).remove(function(err){
				cb();
			});
		},	
		function(cb){
			winston.info("getHandle"+Date.now());
			self.handle({logDate:logDate},cb);			
		},
		function(cb){
			var keys = _.keys(self.logs_region);
			winston.info("begin calculate_Linshi,keys:%s",JSON.stringify(keys));
			var i=0;
			async.whilst(function(){
				return i<keys.length;
			},
			function(callback){
				self.logs=[];
				var currentKey = keys[i]+"";
				self.logs=self.logs_region[currentKey];
				i++;
				self.calculate_retention({logDate:logDate,region:parseInt(currentKey)},callback);
			},
			function(err){
				self.logs = [];
				self.logs = self.alllogs;
				self.calculate_Linshi({logDate:logDate},cb);
			});
		},
			],function(err){
				winston.info("SYNCGameUserManager getSummary over"+Date.now());
				next();
		});		
}
SYNCGameUserManager.prototype.Linshi_getSummary = function(logDate,next){
var sType = "daily";
	var self = this;
	var syncDayleft ;
	var baseS= self.initStatisticalJSON("daily",logDate,"");
	async.waterfall([	
		function(cb){
			winston.info("getHandle"+Date.now());
			self.handle({logDate:logDate},cb);			
		},
		function(cb){
			self.countrys = ["CN","Not_CN"];
			var keys = ["1","2"];
			winston.info("begin getSummary,keys:%s",JSON.stringify(keys));
			var i=0;
			async.whilst(function(){
				return i<keys.length;
			},
			function(callback){
				var currentKey = keys[i]+"";
				i++;
				self.getSummary({logDate:logDate,region:parseInt(currentKey)},callback);
			},
			function(err){
				self.logs = [];
				self.logs = self.alllogs;
				self.getSummary({logDate:logDate},cb);
			});
		}
		],function(err){
			winston.info("SYNCGameUserManager getSummary over"+Date.now());
			next();
	});	
}
SYNCGameUserManager.prototype.Linshi_Gold = function(logDate,next){
	var sType = "daily";
	var self = this;
	var syncDayleft ;
	var baseS= self.initStatisticalJSON("daily",logDate,"");
	async.waterfall([	
		function(cb){
			var dateInfo = self.initStatisticalJSON("daily",logDate,"");
			keystone.list("PayingInfo").model.find({timeStamp:{$gte:dateInfo.firstDate,$lt:dateInfo.lastDate}}).remove(function(err){
				cb();
			});
		},
		function(cb){
			var dateInfo = self.initStatisticalJSON("daily",logDate,"");
			keystone.list("DaysLeft").model.find({logDate:dateInfo.firstDate}).remove(function(err){
				cb();
			});
		},
		function(cb){
			keystone.list("Statistical").model.find({logDate:{$gte:baseS.firstDate,$lt:baseS.lastDate}}).remove(function(){
				cb();
			});
			winston.info("deleteCurrentStatistical"+Date.now());
		},			
		//老计算，随时准备更新
		function(cb){
			//self.phaseStatistical(sType,logDate,cb);
			winston.info("phaseStatistical"+(new Date()).format("hh:mm:ss:S"));
		},		
		function(cb){
			winston.info("getFilterUids"+Date.now());
			self.getFilterUids({logDate:logDate},cb);
		},		
		function(cb){
			self.addSignCountryOfInnLog(baseS.firstDate,baseS.lastDate,cb);
			console.log("addSignCountryOfInnLog"+Date.now());
		},
		// function(cb){
		// 	self.updateAdvCurrent(sType,logDate,cb);
		// 	console.log("updateAdvCurrent");
		// },
		function(cb){
			if(distinguishCountry)
			{
				if(_config.countrys.length>0)
				{
					self.countrys = _config.countrys;
					cb();
				}
				else
				{
					winston.info("getCountry");
					self.getCountry({logDate:logDate},cb);
				}
			}
			else
				cb();
		},
		// function(cb){
		// 	self.updateBuyGemOther(sType,logDate,cb);
		// 	console.log("begin updateBuyGemOther"+Date.now());
		// },		

		function(cb)
		{
			winston.info("getGameUserFirstpaydate"+Date.now());
			self.getGameUserFirstpaydate({logDate:logDate,onlypaid:true},cb);//onlypaid前置方法
		},		
		function(cb){
			winston.info("getHandle"+Date.now());
			self.handle({logDate:logDate},cb);			
		},			
		//计算
		function(cb){
			winston.info("GetAndInsertPayingInfo"+(new Date()).format("hh:mm:ss:S"));
			self.GetAndInsertPayingInfo({logDate:logDate},cb);
		},		
		function(cb){
			var keys = _.keys(self.logs_region);
			winston.info("begin calculate_Linshi,keys:%s",JSON.stringify(keys));
			var i=0;
			async.whilst(function(){
				return i<keys.length;
			},
			function(callback){
				self.logs=[];
				var currentKey = keys[i]+"";
				self.logs=self.logs_region[currentKey];
				i++;
				self.calculate_Linshi({logDate:logDate,region:parseInt(currentKey)},callback);
			},
			function(err){
				self.logs = [];
				self.logs = self.alllogs;
				self.calculate_Linshi({logDate:logDate},cb);
			});
		}
		],function(err){
			winston.info("SYNCGameUserManager dailyStatistical over"+Date.now());
			var siteStateBase = keystone.list("SiteState").model;
			var ss = new siteStateBase({lastSYNCAt:Date.now()/1000});
			ss.save(function(){});
			next();
	});
}
SYNCGameUserManager.prototype.calculate_retention = function(options,next)
{
	var logDate=options.logDate;
	var self= this;
	
	async.waterfall([
		function(cb){			
			winston.info("getRetention"+Date.now());
			self.getAllRetention(options,cb);
		},
		function(cb){
			winston.info("getRegion onlyPaidMan"+Date.now());
			var theOptions = _.clone(options);
			theOptions.onlypaid = true;
			self.getAllRetention(theOptions,cb);
		}
		],
		function(err){
			next();
		});		
}
SYNCGameUserManager.prototype.calculate_Linshi = function(options,next)
{
	var logDate=options.logDate;
	var self= this;
	
	async.waterfall([
		function(cb){			
			winston.info("getRetention"+Date.now());
			self.getAllRetention(options,cb);
		},
		function(cb){
			winston.info("getRegion onlyPaidMan"+Date.now());
			var theOptions = _.clone(options);
			theOptions.onlypaid = true;
			self.getAllRetention(theOptions,cb);
		},
		function(cb){
			var theOptions = _.clone(options);
			self.getSummary(theOptions,cb);
		}
		],
		function(err){
			next();
		});	
}
SYNCGameUserManager.prototype.calculate = function(options,next){
	var logDate=options.logDate;
	var self= this;
	async.waterfall([
		function(cb){
			var theOptions = _.clone(options);
			self.getEasylyStatistical(theOptions,cb);
			winston.info("getEasylyStatistical"+Date.now());
		},
		function(cb){
			var theOptions = _.clone(options);
			theOptions.onlypaid = true;
			self.getEasylyStatistical(theOptions,cb);
			winston.info("getEasylyStatistical"+Date.now());			
		},
		function(cb){		
			winston.info("getGameLog"+Date.now());
			var theOptions = _.clone(options);
			self.getGameLog(options,cb);
		},
		function(cb){			
			var theOptions = _.clone(options);
			theOptions.onlypaid = true;
			winston.info("getGameLog"+Date.now());
			self.getGameLog(theOptions,cb);
		},		
		function(cb){		
			var theOptions = _.clone(options);
			winston.info("getCost"+Date.now());
			self.getCost(theOptions,cb);
		},
		function(cb){	
			winston.info("getGem"+Date.now());
			var theOptions = _.clone(options);
			self.getGem(theOptions,cb);
		},
		function(cb){	
			winston.info("getTutorial"+Date.now());
			var theOptions = _.clone(options);
			self.getTutorial(theOptions,cb);
		},
		function(cb){		
			winston.info("getPvPInformation"+Date.now());
			self.getPvPInformation(options,cb);
		},
		function(cb){		
			winston.info("getPvPInformation"+Date.now());
			var theOptions = _.clone(options);
			theOptions.onlypaid = true;
			self.getPvPInformation(theOptions,cb);
		},		
		function(cb){		
			winston.info("getSweepTicket"+Date.now());
			self.getSweepTicket(options,cb);		
		},
		function(cb){		
			winston.info("getSweepTicket"+Date.now());
			var theOptions = _.clone(options);
			theOptions.onlypaid = true;			
			self.getSweepTicket(theOptions,cb);		
		},		
		function(cb){		
			winston.info("getdailyGameTimeDis"+Date.now());
			self.getdailyGameTimeDis(options,cb);
		},
		function(cb){		
			winston.info("getdailyGameTimeDis"+Date.now());
			var theOptions = _.clone(options);
			theOptions.onlypaid = true;			
			self.getdailyGameTimeDis(theOptions,cb);
		},		
		function(cb){		
			var theOptions = _.clone(options);
			theOptions.onlypaid = true;			
			winston.info("getCost onlyPaidMan"+Date.now());
			self.getCost(theOptions,cb);
		},
		function(cb){		
			winston.info("getgem onlyPaidMan"+Date.now());
			var theOptions = _.clone(options);
			theOptions.onlypaid = true;			
			self.getGem(theOptions,cb);
		}
		],
		function(err){
			next();
		});
}
SYNCGameUserManager.prototype.handle = function(options,next){
	var self = this;
	var dateInfo = self.initStatisticalJSON("daily",options.logDate,"");
	async.waterfall([
		function(cb){
			//准备gameusers
			winston.info("handle gameusers"+(new Date()).format("hh:mm:ss:S"));
			if(self.gameusers.length==0)
			{
				keystone.list("InnLog").model.find({logType:{$in:["Register","LogOn","LogOut"]},timeStamp:{$gte:dateInfo.firstDate,$lt:dateInfo.lastDate}}).distinct("uid").exec(function(err,uids){
					keystone.list("GameUser").model.find({uid:{$in:uids}}).exec(function(err,results){
						_.each(results,function(user){
							var user = _.pick(user,"uid","_id","region","country","registerdate");
							self.gameusers.push(user);
						})
						cb();
					});
				});									
			}
			else{
				cb();
			}
		},
		function(cb){
			winston.info("handle filteruids"+(new Date()).format("hh:mm:ss:S"));
			if(self.filteruids.length==0)
			{
				self.getFilterUids(options.logDate,cb);
			}
			else
				cb();

		},
		function(cb){
			winston.info("handle paiduids"+(new Date()).format("hh:mm:ss:S"));
			if(self.paiduids.length==0)
			{
			//	winston.debug("begin get paidMan");
				keystone.list("GameUser").model.find({firstpaydate:{$lt:dateInfo.lastDate}}).distinct("uid").exec(function(err,results){
					self.paiduids=results;
					cb();
				});				
			}
			else
			{
				cb();
			}			
		},
		function(cb)
		{
			winston.info("handle countrys"+(new Date()).format("hh:mm:ss:S"));
			if(distinguishCountry)
			{
				if(_config.countrys.length>0)
				{
					self.countrys = _config.countrys;
					cb();
				}
				else
				{
					//winston.info("getCountry");
					self.getCountry({logDate:options.logDate},cb);
				}
			}
			else
				cb();			
		},
		function(cb){
			winston.info("handle preice"+(new Date()).format("hh:mm:ss:S"));
			if(self.prices.length==0)
			{
				var ih = new innloghandle();
				ih.getPriceByGem({firstDate:dateInfo.firstDate},function(data){
					self.prices = data;
					cb();
				});
			}
			else
			{
				cb();
			}
		},
		function(cb){
			winston.info("handle innLevelMaxExps"+(new Date()).format("hh:mm:ss:S"));
			winston.debug("innelvel:%d",self.innLevelMaxExps.length);
			if(self.innLevelMaxExps.length==0)
			{
				var gc = new gameconfigExchange();
				gc.getHistoryExchange({table:"tavernLevels",typeid:"levelId",value:"maxExp",firstDate:dateInfo.firstDate},function(data){
					self.innLevelMaxExps = data;
					winston.debug("innlevelMaxexps:%s",JSON.stringify(self.innLevelMaxExps))
					cb();
				});

			}
			else
			{
				cb();
			}
		},
		function(cb){
			winston.info("handle databind"+(new Date()).format("hh:mm:ss:S"));
			if(self.logs.length==0)
			{
				self.dataBind(options,cb);
			}
			else
			{
				cb();
			}
		}	
		],function(err){
			winston.info("over handle"+(new Date()).format("hh:mm:ss:S"));
			next();
	});	
}
SYNCGameUserManager.prototype.handleDetail = function(options,log,next){
	var self = this;
	async.waterfall([
		function(cb){
			if(log.subType!="buygem")
			{
				cb();
				return;
			}
			self.insertPayingInfo(log,cb);
		},
		function(cb){
			switch(log.logType)
			{
				case "LogOn":
					if(options.onlypaid&&_.contains(self.paiduids,log.uid))
					{
						self.temp.set_uids_logon_onlypaid(log);
					}
					else if(!options.onlypaid)
					{
						try{
							self.temp.set_uids_logon(log);
						}
						catch(err)
						{
							//self.showError(err);
							winston.debug(err);
							//winston.error("handleDetail error: log:%s",JSON.stringify(log));
						}
					}
				break;
				default:
				break;
			}
			cb();
		}
		//summary计算
		],function(err){		
			//winston.debug("the next");
			next();
	});
};
SYNCGameUserManager.prototype.GetAndInsertPayingInfo = function(options,next)
{
	var self = this;
	var baseStatistical = self.initStatisticalJSON("daily",options.logDate,"");
	async.waterfall([
		function(cb){
			var statisticalJSONs = [];
			_.each(self.alllogs,function(log){
				if(log.subType=="buygem")
				{
					var result =  initPayingInfo.call(self,log);
					if(result!=undefined)
						statisticalJSONs.push(result);
				}
			});
			//winston.info("statisticalJSONs.length:%d",statisticalJSONs.length);
			if(statisticalJSONs.length>0)
				self.batchInsertAnyCollection("PayingInfo",statisticalJSONs,cb);
			else
				cb();
		}
		],function(err){
			next();
	});
}
var initPayingInfo  = function(log)
{
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
	if(orderid.length<=8)
	{
		try{
			orderid = JSON.parse( arrMsg[5]+"}").orderId;	
		}
		catch(err){
			self.showError(err);
			winston.error("#manager#insertPayingInfo error,err:%s,the message[5]:%s",arrMsg[5]+"\"}");
			return undefined;
		}
	}
	
	var money = ih.getPriceWithExcelChanged(log,self.prices);
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
SYNCGameUserManager.prototype.insertPayingInfo = function(log,next)
{
	var self =this;
	var payingInfo = keystone.list("PayingInfo");

	async.waterfall([function(cb){
		if(self.prices.length==0)
		{
			var dateInfo = self.initStatisticalJSON("daily",log.timeStamp,"");
			var ih = new innloghandle();
			ih.getPriceByGem({firstDate:dateInfo.firstDate},function(data){
				self.prices = data;
				cb();
			});
		}
		else
		{
			cb();
		}	
	}],function(){
		if(!log)
		{
			winston.error("#manager#insertPayingInfo error,log:%s",JSON.stringify(log));
			next();
			return;
		}
		if(!log.subType||log.subType!="buygem")
		{
			winston.error("#manager#insertPayingInfo error, log's subtype is not buygem,log:%s",JSON.stringify(log));
			next();
			return;
		}
		if(!self.gameusers||self.gameusers.length==0)
		{
			winston.error("#manager#insertPayingInfo error,the gameusers error.gamesuers:%s",JSON.stringify(self.gameusers));
			next();
			return;
		}
		var arrMsg = log.message.split(",");
		var innlogid=log._id;
		var gem = parseInt(log.R1);
		var orderid = arrMsg[2];
		var uid = log.uid;
		var region = log.R2;
		if(isNaN(log.R2))
			region=1;
		if(orderid.length<=8)
		{
			try{
				orderid = JSON.parse( arrMsg[5]+"}").orderId;	
			}
			catch(err){
				self.showError(err);
				winston.error("#manager#insertPayingInfo error,err:%s,the message[5]:%s",arrMsg[5]+"\"}");
				next();
				return;
			}
		}
		var ih = new innloghandle();
		var money = ih.getPriceWithExcelChanged(log,self.prices);
		if(money==0)
		{
			self.prices=[];
			self.insertPayingInfo(log,next);
			return;
		}
		var gameuser = _.find(self.gameusers,function(user){return user.uid==log.uid});

			var gameuserid = "55d58f2c151db740498126de";
			if(gameuser)
				gameuserid = gameuser._id;
			var newPayingInfo = new payingInfo.model({
				timeStamp : log.timeStamp,
				orderId:orderid,
				gamer:gameuserid,
				innlog:innlogid,
				gem:gem,
				money:money,
				uid:uid,
				region:region
			});
			newPayingInfo.save(function(err){
				self.showError(err);
				//winston.debug("saved payingINfo:%s",JSON.stringify(newPayingInfo));
				next();
			});
	});
}
SYNCGameUserManager.prototype.dailyStatistical = function(logDate,next){
	var sType = "daily";
	var self = this;
	var syncDayleft ;
	var baseS= self.initStatisticalJSON("daily",logDate,"");
	async.waterfall([
		function(cb){
			var dateInfo = self.initStatisticalJSON("daily",logDate,"");
			keystone.list("PayingInfo").model.find({timeStamp:{$gte:dateInfo.firstDate,$lt:dateInfo.lastDate}}).remove(function(err){
				cb();
			});
		},
		function(cb){
			var dateInfo = self.initStatisticalJSON("daily",logDate,"");
			keystone.list("DaysLeft").model.find({logDate:dateInfo.firstDate}).remove(function(err){
				cb();
			});
		},
		function(cb){
			keystone.list("Statistical").model.find({logDate:{$gte:baseS.firstDate,$lt:baseS.lastDate}}).remove(function(){
				cb();
			});
			console.log("deleteCurrentStatistical"+Date.now());
		},			
		//老计算，随时准备更新
		function(cb){
			//self.phaseStatistical(sType,logDate,cb);
			cb();
			winston.info("phaseStatistical"+(new Date()).format("hh:mm:ss:S"));
		},			
		function(cb){
			self.addSignCountryOfInnLog(baseS.firstDate,baseS.lastDate,cb);
			console.log("addSignCountryOfInnLog"+Date.now());
		},
		// function(cb){
		// 	self.updateAdvCurrent(sType,logDate,cb);
		// 	console.log("updateAdvCurrent");
		// },
		// function(cb){
		// 	self.updateBuyGemOther(sType,logDate,cb);
		// 	console.log("begin updateBuyGemOther"+Date.now());
		// },		
		function(cb){
			winston.info("getHandle"+Date.now());
			self.handle({logDate:logDate},cb);			
		},
		function(cb)
		{
			winston.info("getGameUserFirstpaydate"+Date.now());
			self.getGameUserFirstpaydate({logDate:logDate,onlypaid:true},cb);//onlypaid前置方法
		},
		//计算
		function(cb){
			winston.info("GetAndInsertPayingInfo"+(new Date()).format("hh:mm:ss:S"));
			self.GetAndInsertPayingInfo({logDate:logDate},cb);
		},			
		function(cb){
			var keys = _.keys(self.logs_region);
			winston.info("begin calculate_Linshi,keys:%s",JSON.stringify(keys));
			var i=0;
			async.whilst(function(){
				return i<keys.length;
			},
			function(callback){
				self.logs=[];
				var currentKey = keys[i]+"";
				self.logs=self.logs_region[currentKey];
				i++;
				self.calculate_Linshi({logDate:logDate,region:parseInt(currentKey)},callback);
			},
			function(err){
				self.logs = [];
				self.logs = self.alllogs;
				self.calculate_Linshi({logDate:logDate},cb);
			});
		},
		function(cb){
			var keys = _.keys(self.logs_region);
			keystone.set("onSummaryRetention",false);
			winston.info("begin calculate,keys:%s",JSON.stringify(keys));
			var i=0;
			async.whilst(function(){
				return i<keys.length;
			},
			function(callback){
				self.logs=[];
				var currentKey = keys[i]+"";
				self.logs=self.logs_region[currentKey];
				i++;
				self.calculate({logDate:logDate,region:parseInt(currentKey)},callback);
			},
			function(err){
				self.logs = [];
				self.logs = self.alllogs;
				self.calculate({logDate:logDate},cb);
			});
		}
		],function(err){
			winston.info("SYNCGameUserManager dailyStatistical over"+Date.now());
			var siteStateBase = keystone.list("SiteState").model;
			var ss = new siteStateBase({lastSYNCAt:Date.now()/1000});
			ss.save(function(){});
			keystone.list("Summary").model.find({firstDate:1440201600,region:1}).exec(function(err,results){
				_.each(results,function(result){
					result.LTV7=0;
					result.LTV15 = 0;
					result.save(function(){});
				});
			});
			keystone.list("Summary").model.find({firstDate:1439942400,region:1}).exec(function(err,results){
				_.each(results,function(result){
					result.LTV7=0;
					result.LTV15 = 0;
					result.save(function(){});
				});
			});			
			next();
	});
}
SYNCGameUserManager.prototype.getCountry = function(options,next){
	var self = this;
	async.waterfall([
		function(cb){
			var baseStatistical = self.initStatisticalJSON("daily",options.logDate,"");
				keystone.list("GameUser").model.find({registerdate:{$lt:baseStatistical.lastDate,$gte:baseStatistical.firstDate}}).distinct("country").exec(function(err,results){
				self.countrys = results;
				cb();
			});
		},
		],function(err){
			self.countrys.push("Not_CN");
			next();
	});
}
SYNCGameUserManager.prototype.getEasylyStatistical= function(options,next){
	var self = this;
	async.waterfall([
		function(cb){
			//winston.info("#easylyStatistical 1:%s"+(new Date()).format("hh:mm:ss:S"));
			if(self.logs.length==0)
			{
				self.dataBind(options,cb);
			}
			else
			{
				cb();
			}
		},
		function(cb){
			//winston.info("#easylyStatistical 2:%s"+(new Date()).format("hh:mm:ss:S"));
			if(!options.onlypaid)
			{
				cb();
				return;
			}
			var baseStatistical = self.initStatisticalJSON("daily",options.logDate,"");
			if(self.paiduids.length==0)
			{
			//	winston.debug("begin get paidMan");
				keystone.list("GameUser").model.find({firstpaydate:{$lt:baseStatistical.lastDate}}).distinct("uid").exec(function(err,results){
					self.paiduids=results;
					cb();
				});				
			}
			else
			{
				cb();
			}
		},		
		function(cb){
			var arrStatisticalJSON=[];
			//winston.info("#easylyStatistical 3:%s"+(new Date()).format("hh:mm:ss:S"));
			if(distinguishCountry)
			{
				_.each(self.countrys,function(country){
					var statisticalJSON_loginRD = self.initStatisticalJSON("daily",options.logDate,"103");
					var statisticalJSON_login = self.initStatisticalJSON("daily",options.logDate,"104");
					var statisticalJSON_country=self.initStatisticalJSON("daily",options.logDate,"190");
					var statisticalJSON_level_pvp=self.initStatisticalJSON("daily",options.logDate,"191");
					var statisticalJSON_count_pvp=self.initStatisticalJSON("daily",options.logDate,"192");
					var statisticalJSON_level_pvp_avg=self.initStatisticalJSON("daily",options.logDate,"193");
					var arrCountry=[];
					var arrCountPvP=[];
					var uids = [];
					var levelpvp={};
					var levelpvpsum={};
					var levelpvpavg={};
					_.each(self.logs,function(log){
						if(options.onlypaid&&(!_.contains(self.paiduids,log.uid)))
							return;						
						if(log.logType=="LogOn"&&validateCountry(log.country,country))
						{
							uids.push(log.uid);
						}
					});

					var  uid_RD = _.uniq(uids);//去重登录uid
					_.each(uid_RD,function(uid){
						var parmCoutry = _.find(self.logs,function(log){
							return log.uid==uid;
						});
						winston.debug("parm:%s",JSON.stringify(parmCoutry));
						if(parmCoutry&&parmCoutry.country)
							arrCountry.push(parmCoutry.country);
						var pvplogs = _.filter(self.logs,function(log){
							return log.logType=="PvP"&&log.uid==uid;
						});
						var arrThisuidPvPCount = {};
						_.each(pvplogs,function(pvplog){
							var level = self.getInnLevelByExp(pvplog.innExp);
							if(!arrThisuidPvPCount[level])
							{
								arrThisuidPvPCount[level]=0;
							}
							arrThisuidPvPCount[level]++;
						});
						var keys = _.keys(arrThisuidPvPCount);
						_.each(keys,function(key){
							var count = arrThisuidPvPCount[key];
							if(!levelpvp[key])
							{
								levelpvp[key]=[];
							}
							levelpvp[key].push(count);
						});
						
						if(pvplogs&&pvplogs.length>0)
						{
							arrCountPvP.push(pvplogs.length);
						}
					});

					var levelpvpKeys = _.keys(levelpvp);
					_.each(levelpvpKeys,function(key){
						var arrparm = levelpvp[key];
						var count = 0;
						var countAvg = 0;
						_.each(arrparm,function(parm){
							count+=parseInt(parm);
						});
						countAvg = count/arrparm.length;
						levelpvpsum[key]=count;
						levelpvpavg[key]=countAvg;
					});

					statisticalJSON_country.countObj = getGroupAndSum(arrCountry);
					statisticalJSON_count_pvp.countObj = getGroupAndSum(arrCountPvP);
					statisticalJSON_level_pvp.countObj = JSON.stringify(levelpvpsum);
					statisticalJSON_level_pvp_avg.countObj =JSON.stringify(levelpvpavg);
					statisticalJSON_loginRD.count = uid_RD.length;
					statisticalJSON_login.count = uids.length;

					statisticalJSON_country.country=country;
					statisticalJSON_count_pvp.country=country;
					statisticalJSON_level_pvp.country=country;
					statisticalJSON_level_pvp_avg.country=country;
					statisticalJSON_loginRD.country=country;
					statisticalJSON_login.country=country;

					if(options.onlypaid)
					{
						statisticalJSON_login.onlypaid = true;
						statisticalJSON_loginRD.onlypaid = true;
						statisticalJSON_country.onlypaid = true;
						statisticalJSON_level_pvp.onlypaid = true;
						statisticalJSON_count_pvp.onlypaid = true;
						statisticalJSON_level_pvp_avg.onlypaid = true;
					}
					if(options.region)
					{
						statisticalJSON_login.region = options.region;
						statisticalJSON_loginRD.region = options.region;
						statisticalJSON_country.region = options.region;
						statisticalJSON_level_pvp.region = options.region;
						statisticalJSON_count_pvp.region = options.region;
						statisticalJSON_level_pvp_avg.region = options.region;
					}
					arrStatisticalJSON.push(statisticalJSON_loginRD);
					arrStatisticalJSON.push(statisticalJSON_login);
					arrStatisticalJSON.push(statisticalJSON_country);
					arrStatisticalJSON.push(statisticalJSON_count_pvp);
					arrStatisticalJSON.push(statisticalJSON_level_pvp);
					arrStatisticalJSON.push(statisticalJSON_level_pvp_avg);

				});
			}
				var statisticalJSON_loginRD = self.initStatisticalJSON("daily",options.logDate,"103");
				var statisticalJSON_login = self.initStatisticalJSON("daily",options.logDate,"104");
				var statisticalJSON_country=self.initStatisticalJSON("daily",options.logDate,"190");
				var statisticalJSON_level_pvp=self.initStatisticalJSON("daily",options.logDate,"191");
				var statisticalJSON_count_pvp=self.initStatisticalJSON("daily",options.logDate,"192");
				var statisticalJSON_level_pvp_avg=self.initStatisticalJSON("daily",options.logDate,"193");
				var arrCountry=[];
				var arrCountPvP=[];
				var uids = [];
				var levelpvp={};
				var levelpvpsum={};
				var levelpvpavg={};
				_.each(self.logs,function(log){
					if(options.onlypaid&&(!_.contains(self.paiduids,log.uid)))
						return;						
					if(log.logType=="LogOn")
					{
						uids.push(log.uid);
					}
				});

				var  uid_RD = _.uniq(uids);//去重登录uid
				_.each(uid_RD,function(uid){
					var parmCoutry = _.find(self.logs,function(log){
						return log.uid==uid;
					});
					winston.debug("parm:%s",JSON.stringify(parmCoutry));
					if(parmCoutry&&parmCoutry.country)
						arrCountry.push(parmCoutry.country);
					var pvplogs = _.filter(self.logs,function(log){
						return log.logType=="PvP";
					});
					var arrThisuidPvPCount = {};
					_.each(pvplogs,function(pvplog){
						var level = self.getInnLevelByExp(pvplog.innExp);
						if(!arrThisuidPvPCount[level])
						{
							arrThisuidPvPCount[level]=0;
						}
						arrThisuidPvPCount[level]++;
					});
					var keys = _.keys(arrThisuidPvPCount);
					_.each(keys,function(key){
						var count = arrThisuidPvPCount[key];
						if(!levelpvp[key])
						{
							levelpvp[key]=[];
						}
						levelpvp[key].push(count);
					});
					
					if(pvplogs&&pvplogs.length>0)
					{
						arrCountPvP.push(pvplogs.length);
					}
				});

				var levelpvpKeys = _.keys(levelpvp);
				_.each(levelpvpKeys,function(key){
					var arrparm = levelpvp[key];
					var count = 0;
					var countAvg = 0;
					_.each(arrparm,function(parm){
						count+=parseInt(parm);
					});
					countAvg = count/arrparm.length;
					levelpvpsum[key]=count;
					levelpvpavg[key]=countAvg;
				});

				statisticalJSON_country.countObj = getGroupAndSum(arrCountry);
				statisticalJSON_count_pvp.countObj = getGroupAndSum(arrCountPvP);
				statisticalJSON_level_pvp.countObj = JSON.stringify(levelpvpsum);
				statisticalJSON_level_pvp_avg.countObj =JSON.stringify(levelpvpavg);
				statisticalJSON_loginRD.count = uid_RD.length;
				statisticalJSON_login.count = uids.length;


				if(options.onlypaid)
				{
					statisticalJSON_login.onlypaid = true;
					statisticalJSON_loginRD.onlypaid = true;
					statisticalJSON_country.onlypaid = true;
					statisticalJSON_level_pvp.onlypaid = true;
					statisticalJSON_count_pvp.onlypaid = true;
					statisticalJSON_level_pvp_avg.onlypaid = true;
				}
				if(options.region)
				{
					statisticalJSON_login.region = options.region;
					statisticalJSON_loginRD.region = options.region;
					statisticalJSON_country.region = options.region;
					statisticalJSON_level_pvp.region = options.region;
					statisticalJSON_count_pvp.region = options.region;
					statisticalJSON_level_pvp_avg.region = options.region;
				}
				arrStatisticalJSON.push(statisticalJSON_loginRD);
				arrStatisticalJSON.push(statisticalJSON_login);
				arrStatisticalJSON.push(statisticalJSON_country);
				arrStatisticalJSON.push(statisticalJSON_count_pvp);
				arrStatisticalJSON.push(statisticalJSON_level_pvp);
				arrStatisticalJSON.push(statisticalJSON_level_pvp_avg);
			//winston.info("#easylyStatistical 5:%s"+(new Date()).format("hh:mm:ss:S"));
			self.batchInsertStatistical(arrStatisticalJSON,cb);
		}		
		],function(err){
			//winston.info("#easylyStatistical 6:%s"+(new Date()).format("hh:mm:ss:S"));
			next();
	});
};
SYNCGameUserManager.prototype.getGameUserFirstpaydate=function(options,next)
{
	var self = this;

	async.waterfall([	
		function(cb){
			var date = Date.now()/1000-30*86400;
			keystone.list("GameUser").model.find({lastlogdate:{$gte:date},firstpaydate:{$exists:false}}).exec(function(err,users){
				var changedusers =[];
				_.each(self.alllogs,function(log){
					if(log.logType!="TavernBuyGem")
					{
						return;
					}
					var theuser =_.find(users,function(user){return user.uid==log.uid});
					if(theuser)
					{
						theuser.firstpaydate = log.timeStamp;
						changedusers.push(theuser);
						var newusers = [];
						_.each(users,function(user){
							if(user.uid==theuser.uid)
								return;
							newusers.push(user);
						});
						users = newusers;
					}
				});
				var i=0;
				async.whilst(
					function(){return i<changedusers.length},
					function(callback){
						if(changedusers[i])
						{
							changedusers[i].save(function(){
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
					function(err){
						cb();
					}
					);
			});
		}
		],function(err){
		next();
	});
}
SYNCGameUserManager.prototype.getCost = function(options,next)
{
	var self = this;
	var doIt = function(users,getStatistical,costStatistical,getTypesStatistical,costTypesStatistical,isCountry,country){
			var costCount,getCount,costTypes,getTypes;
			costCount=getCount=0;
			costTypes={},getTypes={};
			//winston.debug("logs:%s",utils.stringify(self.logs[0]));
			_.each(self.logs,function(parm,index){
				if(!parm.uid)
				{
					winston.info("error,getCost error,%s",utils.stringify(parm));
					return;
				}
				if(options.onlypaid&&(!_.contains(self.paiduids,parm.uid)))
					return;
				if(!_.contains(logTypeFilter,parm.logType))
					return;
				//winston.debug("each index:%d",index);
				if(!users[parm.uid])
				{
					return;
				}
				var thisUser = users[parm.uid];
				if(isCountry&&!validateCountry(parm.country,country))
				{
					//winston.info("#manager#SYNCGameUser#parm.country:%s,country:%s",parm.country,country);

					return;
				}
				
				var getTheType=function(thetype,msg)
				{
					if(thetype=="SubGemBuy"||thetype=="SubGemOther")
					{
						thetype = "SubGem";
					}
					if(thetype=="CoinShopPurchase")
					{
						var arrMsg = msg.split(",");
						switch(arrMsg[1]){
							case "1":
								thetype="AdvShopPurchase";
								break;
							case "2":
								thetype="normalShopPurchase";
								break;
							case "3":
								thetype="odysseyShopPurchase";
								break;
							case "4":
								thetype="pvpShopPurchase";
								break;
							case "5":
								thetype="coinShopPurchase";
								break;
							case "6":
								thetype="blackShopPurchase";
								break;
							default:
								break;
						}
					}					
					return thetype;
				}
				if(parseFloat(thisUser.gold)>parseFloat(parm.gold)&&_.contains(logTypeFilter_cost,parm.logType))//cost
				{
					var thecost =(parseFloat(thisUser.gold) - parseFloat(parm.gold));
					costCount+=thecost;
					var theType = getTheType(parm.logType,parm.message);
					if(costTypes[theType])
						costTypes[theType] += thecost;
					else
						costTypes[theType] = thecost;
					thisUser.gold=parm.gold;
				}
				else if(parseFloat(thisUser.gold)<parseFloat(parm.gold)&&_.contains(logTypeFilter_get,parm.logType))//get
				{
					var theget =(parseFloat(parm.gold) - parseFloat(thisUser.gold));
					getCount+=theget;
					var theType = getTheType(parm.logType,parm.message);
					if(getTypes[theType])
						getTypes[theType] += theget;
					else
						getTypes[theType] = theget;
					//if(parm.logType=="TaskDailyNew"||parm.logType=="PlayerDailyRw"||parm.logType=="MgrErr"||parm.logType=="StorageSell"||parm.logType=="SubGemBuy"||parm.logType=="QuestRewardFinish"||parm.logType=="BuyGemOther"||parm.logType=="StorageRemove"||parm.logType=="TaskTakeRW")
					if(parm.logType=="BuyGemOther")
						winston.info("error,getGold by AdvOut,%s \n %s",utils.stringify(thisUser),utils.stringify(parm));

					thisUser.gold=parm.gold;
				}
			});
			//winston.debug("all users count:%d,costCount:%d,getCount:%d,costTypes.count:%d,getTypes.count:%d",(_.keys(users)).length,costCount,getCount,costTypes.length,getTypes.length );

			getStatistical.count = getCount;
			costStatistical.count = costCount;
			getTypesStatistical.countObj = JSON.stringify(getTypes);
			costTypesStatistical.countObj = JSON.stringify(costTypes);
			// if(isCountry)
			// 	winston.info("#manager#SYNCgameUser#getStatistical:%s",JSON.stringify(getStatistical));
			if(options.onlypaid)
			{
				getStatistical.onlypaid=true;
				costStatistical.onlypaid=true;
				getTypesStatistical.onlypaid=true;
				costTypesStatistical.onlypaid=true;
				// getStatistical.sType="185";
				// costStatistical.sType="186";
				// getTypesStatistical.sType="187";
				// costTypesStatistical.sType="188";
			}
			if(options.region)
			{
				getStatistical.region = options.region;
				costStatistical.region = options.region;
				getTypesStatistical.region = options.region;
				costTypesStatistical.region = options.region;
			}
			//winston.debug("#manager#SYNCGameUser# getStatistical:%s",JSON.stringify(getStatistical));
			//winston.debug("self.logs.count:%d",self.logs.length);		
	}
	async.waterfall([
		function(cb){
			if(self.logs.length==0)
			{
				self.dataBind(options,cb);
			}
			else
			{
				cb();
			}
		},
		function(cb){
			if(!options.onlypaid)
			{
				cb();
				return;
			}
			var baseStatistical = self.initStatisticalJSON("daily",options.logDate,"");
			if(self.paiduids.length==0)
			{
				//winston.debug("begin get paidMan");
				keystone.list("GameUser").model.find({firstpaydate:{$lt:baseStatistical.lastDate}}).distinct("uid").exec(function(err,results){
					self.paiduids=results;
					cb();
				})		
			}
			else
			{
				cb();
			}
		},
		function(cb){
			_.each(self.logs,function(parm){
				if(!parm.uid)
				{
					winston.info("error,getCost error,%s",utils.stringify(parm));
					return;
				}
				if(!self.users[parm.uid])
				{
					self.users[parm.uid]=parm;
				}
			});
			var uids = _.keys(self.users);
			//winston.debug("begin get 600s user");
			var yestday = self.initStatisticalJSON("daily",options.logDate - 86400,"");
			keystone.list("InnLog").model.find({timeStamp:{$gte:yestday.lastDate-600,$lt:yestday.lastDate},uid:{$in:uids}}).exec(function(err,results){
				_.each(results,function(parm,index){
					if(!parm.uid)
					{
						winston.info("error,getCost error,%s",utils.stringify(parm));
						return;
					}	
					//winston.debug("each index:%d",index);
					if(!_.contains(logTypeFilter,parm.logType))
						return;
					if(!self.users[parm.uid])
						self.users[parm.uid]=parm;
				});
				cb();
			});
		},
		function(cb){
			var getStatistical={},costStatistical={},getTypesStatistical={},costTypesStatistical={};
			getStatistical = self.initStatisticalJSON("daily",options.logDate,"172");
			costStatistical = self.initStatisticalJSON("daily",options.logDate,"173");
			getTypesStatistical = self.initStatisticalJSON("daily",options.logDate,"174");
			costTypesStatistical = self.initStatisticalJSON("daily",options.logDate,"175");			
			var cloneUsers = {};
			_.each(self.users,function(user){
				cloneUsers[user.uid]=_.pick(user,"gold");
			});
			doIt(cloneUsers,getStatistical,costStatistical,getTypesStatistical,costTypesStatistical,false);
			self.batchInsertStatistical([
				getStatistical,
				costStatistical,
				getTypesStatistical,
				costTypesStatistical
				],cb);		
		},
		function(cb){
			if(!distinguishCountry)
			{
				cb();
				return;
			}
			var arrStatisticalJSON = [];
			_.each(self.countrys,function(country){
				var getStatistical={},costStatistical={},getTypesStatistical={},costTypesStatistical={};
				getStatistical = self.initStatisticalJSON("daily",options.logDate,"172");
				costStatistical = self.initStatisticalJSON("daily",options.logDate,"173");
				getTypesStatistical = self.initStatisticalJSON("daily",options.logDate,"174");
				costTypesStatistical = self.initStatisticalJSON("daily",options.logDate,"175");	
				var cloneUsers = {};
				_.each(self.users,function(user){
					cloneUsers[user.uid]=_.pick(user,"gold");
				});			
				doIt(cloneUsers,getStatistical,costStatistical,getTypesStatistical,costTypesStatistical,true,country);
				getStatistical.country=country;
				costStatistical.country=country;
				getTypesStatistical.country=country;
				costTypesStatistical.country=country;
				//winston.debug("#manager#SYNCGameUser# getStatistical:%s",JSON.stringify(getStatistical));
				arrStatisticalJSON.push(getStatistical);
				arrStatisticalJSON.push(costStatistical);
				arrStatisticalJSON.push(getTypesStatistical);
				arrStatisticalJSON.push(costTypesStatistical);
			});
			self.batchInsertStatistical(arrStatisticalJSON,cb);				
		}
		],function(err){
			next();
	});
}
function usersTutorialsCheck(user)
{
	if(!user.tutorials)
		user.tutorials=[];
	if(user.tutorials.length==1)
		return;
	for(var i=0;i<user.tutorials.length-1;i++)
	{
		var baseT=user.tutorials[i];
		for(var j=i+1;j<user.tutorials.length;j++)
		{
			var currenT=user.tutorials[j];
			if(baseT.tutorialId==currenT.tutorialId)
			{
				user.tutorials=[];
				return;
			}
		}
	}
}
SYNCGameUserManager.prototype.getTutorial=function(options,next)
{
	var self = this;
	var changedIds=[];
	async.waterfall([
		function(cb){
			if(self.logs.length==0)
			{
				self.dataBind(options,cb);
			}
			else
			{
				cb();
			}			
		},
		function(cb){
			var uids = [];
			_.each(self.logs,function(parm){
				if(!_.contains(uids,parm.uid))
					uids.push(parm.uid);
			});
			keystone.list("GameUser").model.find({uid:{$in:uids}}).exec(function(err,results){
				//winston.debug("GameUser's results:%s",utils.stringify(results));
				_.each(results,function(parm){
					if(parm)
						usersTutorialsCheck(parm);
				});
				cb(null,results);
			});
		},
		function(users,cb)
		{
			//winston.debug("begin handle tutorial");
			_.each(self.logs,function(parm){
				switch(parm.logType)
				{
					case "Tutorial":
						if(parm.message.indexOf("f,")>=0)
						{
							var arrStr=parm.message.split(",");
							var tutorial={};
							tutorial.tutorialId=arrStr[1] || "";
							tutorial.timeStamp=parm.timeStamp;
							var theuser =  _.find(users,function(user){return user.uid==parm.uid;});
							if(!theuser)
								break;
							if(!theuser.tutorials)
							{
								theuser.tutorials=[]; 
							}

							var thetutorl = _.find(theuser.tutorials,function(tutor){return tutor.tutorialId==tutorial.tutorialId});
							if(!thetutorl)
							{
								theuser.tutorials.push(tutorial);
								changedIds.push(parm.uid);	
								//winston.debug("tutorial add ,theuser:%s",JSON.stringify(theuser));
								//winston.debug("tutorial over,the tutorial:%s,the user:%s",JSON.stringify(tutorial),JSON.stringify(theuser));
							}
						}
					break;
					case "QuestFinish":
						var arrStr = parm.message.split(",");
						var finishType = arrStr[1];
						var typeid = arrStr[0];
						if(finishType=="0")
						{
							var theuser =  _.find(users,function(user){return user.uid==parm.uid;});
							var tutorial={};
							tutorial.tutorialId=typeid || "";
							tutorial.timeStamp=parm.timeStamp;
							if(!theuser)
								break;
							if(!theuser.tutorials)
							{
								theuser.tutorials=[];
							}
							var thistutorl= _.find(theuser.tutorials,function(tutorl){return tutorl.tutorialId==typeid});
							if(!thistutorl)
							{
								theuser.tutorials.push(tutorial);
								changedIds.push(parm.uid);
							}
							else if(thistutorl.timeStamp>tutorial.timeStamp)
							{
								var arrTu = theuser.tutorials;
								theuser.tutorials=[];
								for(var i=0;i<arrTu.length;i++)
								{
									if(arrTu[i].timeStamp==thistutorl.timeStamp&&arrTu[i].tutorialId==thistutorl.tutorialId)
										continue;
									else
										theuser.tutorials.push(arrTu[i]);
								}
								theuser.tutorials.push(tutorial);
								changedIds.push(parm.uid);
							}
						}
					break;
					default:
					break;
				}
			});
			cb(null,users);
		},
		function(users,cb)
		{
			winston.debug("begin handle tutorial save,users'length:%d",users.length);
			changedIds=_.uniq(changedIds);
			//winston.debug("will saved changedId:%s",utils.stringify(changedIds))

			var i=0;
			if(users.length<=0)
			{
				cb();
				return;
			}
			async.whilst(
				function(){
					return i<users.length;
				},
				function(callback){

					var user = users[i];

					//winston.debug("will saved user:%s",JSON.stringify(user));
					if(!user)
					{
						winston.error("the user has not uid , user:%s",JSON.stringify(user));
						i++;
						callback();
						return;
					}
					if(_.contains(changedIds,user.uid))
					{
						setImmediate(function(user,cb){
							user.save(function(){
								//winston.debug("the tutorials:%s",JSON.stringify(user));
								i++;
								cb();								
							});
						},user,callback);
						// user.save(function(){
						// 	winston.debug("the tutorials:%s",JSON.stringify(user));
						// 	i++;
						// 	callback();
						// });
					}
					else
					{
						i++;
						callback();
					}
				},
				function(err){
					cb();
				}
				);
		}
		],function(err){
			if(err)
				winston.info("getTutorial err:%s",JSON.stringify(err));
			winston.info("getTutorial over");
			next();
	});
}
SYNCGameUserManager.prototype.getSweepTicket=function(options,next)
{
	var filter_get=[];
	var filter_cost=[];
	var self = this;
	var gcTask =[];
	var doIt = function(getSweepTicketStatistical,costSweepTicketStatistical,getSweepTicketDistribution,costSweepTicketDistribution,isCountry,country){
		//winston.debug("gcTask 1:%s",JSON.stringify(gcTask[0]));
			getDis={},costDis={};
			_.each(self.logs,function(log){
				if(isCountry&&!validateCountry(log.country,country))
				{
					return;
				}
				if(options.onlypaid&&(!_.contains(self.paiduids,log.uid)))
					return;				
				switch(log.logType){
					case "MailTake":
						var arrStr = log.message.split(",");
						var strRW = arrStr[3];
						if(strRW&&strRW.indexOf("11000_")>=0)
						{
							var arrRW = strRW.split("-");
							_.each(arrRW,function(parm){
								var rw=parm.split("_");
								if(rw[0]=="11000")
								{
									if(!isNaN(rw[1]))
										getSweepTicketStatistical.count+=parseInt(rw[1]);
									if(!getDis[log.logType])
										getDis[log.logType] = 0;
									getDis[log.logType]+=parseInt(rw[1]);
								}
							});
						}
					break;
					case "TaskTakeRW":
						var arrStr = log.message.split(",");
						var typeid_task =parseInt(arrStr[0]);
						var thisTask = _.find(gcTask,function(parm){ return parm.typeId==typeid_task });
						if(thisTask&&thisTask.rewards&&thisTask.rewards.length)
							_.each(thisTask.rewards,function(parm){
								if((parm.typeId+"")=="11000")
								{
									getSweepTicketStatistical.count+=parseInt(parm.amount);
									if(!getDis[log.logType])
										getDis[log.logType] = 0;
									getDis[log.logType]+=parseInt(parm.amount);				
								}
							});
					break;
					case "QuestSweep":
						var arrStr = log.message.split(",");
						var keyName = arrStr[0]+"_"+arrStr[1];
						var value = parseInt(arrStr[2])-parseInt(arrStr[4]);
						costSweepTicketStatistical.count+=value;
						if(!costDis[keyName])
							costDis[keyName]=0;
						costDis[keyName]+=value;
					break;
					default:
					break;
				}
			});
			if(options.onlypaid)
			{
				getSweepTicketStatistical.onlypaid = true;
				getSweepTicketDistribution.onlypaid =true;
				costSweepTicketStatistical.onlypaid = true;
				costSweepTicketDistribution.onlypaid = true;
			}
			if(options.region)
			{
				getSweepTicketStatistical.region = options.region;
				getSweepTicketDistribution.region = options.region;
				costSweepTicketStatistical.region = options.region;
				costSweepTicketDistribution.region = options.region;
			}
			getSweepTicketDistribution.countObj = JSON.stringify(getDis);
			costSweepTicketDistribution.countObj= JSON.stringify(costDis);		
	}
	var arrStatisticalJSON = [];
	var dateInfo = self.initStatisticalJSON("daily",options.logDate,"");
	async.waterfall([
		function(cb){
			if(self.logs.length==0)
			{
				self.dataBind(options,cb);
			}
			else
			{
				cb();
			}			
		},
		function(cb){
			if(!options.onlypaid)
			{
				cb();
				return;
			}
			
			if(self.paiduids.length==0)
			{
			//	winston.debug("begin get paidMan");
				keystone.list("GameUser").model.find({firstpaydate:{$lt:dateInfo.lastDate}}).distinct("uid").exec(function(err,results){
					self.paiduids=results;
					cb();
				});				
			}
			else
			{
				cb();
			}
		},			
		function(cb){
			var gc = new gameconfigExchange();
			gc.getTablebyHistory({table:"tasks",firstDate:dateInfo.firstDate},function(table){
				gcTask = table;
				winston.debug("gcTask:%s",JSON.stringify(gcTask));
				cb(null);
			});
		},
		function(cb){
			

			var getSweepTicketStatistical={},costSweepTicketStatistical={},getSweepTicketDistribution={},costSweepTicketDistribution={};
			getSweepTicketStatistical = self.initStatisticalJSON("daily",options.logDate,"176");
			costSweepTicketStatistical = self.initStatisticalJSON("daily",options.logDate,"177");
			getSweepTicketDistribution = self.initStatisticalJSON("daily",options.logDate,"178");
			costSweepTicketDistribution = self.initStatisticalJSON("daily",options.logDate,"179");				
			doIt(getSweepTicketStatistical,costSweepTicketStatistical,getSweepTicketDistribution,costSweepTicketDistribution,false);	
			arrStatisticalJSON.push(getSweepTicketStatistical);
			arrStatisticalJSON.push(costSweepTicketStatistical);
			arrStatisticalJSON.push(getSweepTicketDistribution);
			arrStatisticalJSON.push(costSweepTicketDistribution);
			if(!distinguishCountry)
			{	
				cb();
				return;
			}
			
			_.each(self.countrys,function(country){
				var getSweepTicketStatistical={},costSweepTicketStatistical={},getSweepTicketDistribution={},costSweepTicketDistribution={};
				getSweepTicketStatistical = self.initStatisticalJSON("daily",options.logDate,"176");
				costSweepTicketStatistical = self.initStatisticalJSON("daily",options.logDate,"177");
				getSweepTicketDistribution = self.initStatisticalJSON("daily",options.logDate,"178");
				costSweepTicketDistribution = self.initStatisticalJSON("daily",options.logDate,"179");				
				doIt(getSweepTicketStatistical,costSweepTicketStatistical,getSweepTicketDistribution,costSweepTicketDistribution,true,country);			
				getSweepTicketStatistical.country=country;
				costSweepTicketStatistical.country=country;
				getSweepTicketDistribution.country=country;
				costSweepTicketDistribution.country=country;
				arrStatisticalJSON.push(getSweepTicketStatistical);
				arrStatisticalJSON.push(costSweepTicketStatistical);
				arrStatisticalJSON.push(getSweepTicketDistribution);
				arrStatisticalJSON.push(costSweepTicketDistribution);
			});
			
			cb();
		}
		],function(err){
			if(arrStatisticalJSON.length>0)
				self.batchInsertStatistical(arrStatisticalJSON,next);
			else
				next();
	});
}
// SYNCGameUserManager.prototype.getEnergyCost = function(options,next){
// 		var self = this;
// 	var users =self.users;
// 	async.waterfall([
// 		function(cb){
// 			if(self.logs.length==0)
// 			{
// 				self.dataBind(options,cb);
// 			}
// 			else
// 			{
// 				cb();
// 			}
// 		},
// 		function(cb){

// 			_.each(self.logs,function(parm){
// 				if(!parm.uid)
// 				{
// 					winston.info("error,getCost error,%s",utils.stringify(parm));
// 					return;
// 				}
// 				if(!users[parm.uid])
// 				{
// 					users[parm.uid]=parm;
// 				}				
// 			});
// 			var uids = _.keys(users);
// 			var yestday = self.initStatisticalJSON("daily",options.logDate - 86400,"");
// 			keystone.list("InnLog").model.find({timeStamp:{$gte:yestday.lastDate-600,$lt:yestday.lastDate},uid:{$in:uids}}).exec(function(err,results){
// 				_.each(results,function(parm,index){
// 					if(!parm.uid)
// 					{
// 						winston.info("error,getCost error,%s",utils.stringify(parm));
// 						return;
// 					}	
// 					//winston.debug("each index:%d",index);
// 					if(!_.contains(logTypeFilter,parm.logType))
// 					return;
// 					users[parm.uid]=parm;
// 				});
// 				cb();
// 			});
// 		},
// 		function(cb){
// 			var costCount,getCount,costTypes,getTypes;
// 			costCount=getCount=0;
// 			costTypes={},getTypes={};
// 			winston.debug("logs:%s",utils.stringify(self.logs[0]));
// 			_.each(self.logs,function(parm,index){
// 				if(!parm.uid)
// 				{
// 					winston.info("error,getCost error,%s",utils.stringify(parm));
// 					return;
// 				}

// 				//winston.debug("each index:%d",index);
// 				if(!users[parm.uid])
// 				{
// 					users[parm.uid]=parm;
// 				}
// 				var thisUser = users[parm.uid];
// 				var getTheType=function(thetype,msg)
// 				{
// 					if(thetype=="SubGemBuy"||thetype=="SubGemOther")
// 					{
// 						thetype = "SubGem";
// 					}
// 					if(thetype=="CoinShopPurchase")
// 					{
// 						var arrMsg = msg.split(",");
// 						switch(arrMsg[1]){
// 							case "1":
// 								thetype="AdvShopPurchase";
// 								break;
// 							case "2":
// 								thetype="normalShopPurchase";
// 								break;
// 							case "3":
// 								thetype="odysseyShopPurchase";
// 								break;
// 							case "4":
// 								thetype="pvpShopPurchase";
// 								break;
// 							case "5":
// 								thetype="coinShopPurchase";
// 								break;
// 							case "6":
// 								thetype="blackShopPurchase";
// 								break;
// 							default:
// 								break;
// 						}
// 					}					
// 					return thetype;
// 				}
// 				if(parseFloat(thisUser.power)>parseFloat(parm.power))//cost
// 				{
// 					var thecost =(parseFloat(thisUser.power) - parseFloat(parm.power));
// 					costCount+=thecost;
// 					var theType = getTheType(parm.logType,parm.message);
// 					if(costTypes[theType])
// 						costTypes[theType] += thecost;
// 					else
// 						costTypes[theType] = thecost;
// 					if(!thisUser.handler)
// 						thisUser.handler=[];					
// 					thisUser.handler.push(theType+":"+thisUser.power+":"+thecost+":"+parm.power);
// 					thisUser.power=parm.power;

					
// 					//winston.debug("a");
// 				}
// 				else if(parseFloat(thisUser.power)<parseFloat(parm.power))//get
// 				{
// 					var theget =(parseFloat(parm.power) - parseFloat(thisUser.power));
// 					getCount+=theget;
// 					var theType = getTheType(parm.logType,parm.message);
// 					if(getTypes[theType])
// 						getTypes[theType] += theget;
// 					else
// 						getTypes[theType] = theget;
// 					if(!thisUser.handler)
// 						thisUser.handler=[];					
// 					thisUser.handler.push(theType+":"+thisUser.power+":"+theget+":"+parm.power);
// 					thisUser.power=parm.power;
						
// 					//winston.debug("b");
// 				}

// 			});
// 			winston.debug("all users count:%d,costCount:%d,getCount:%d,costTypes.count:%d,getTypes.count:%d",(_.keys(users)).length,costCount,getCount,costTypes.length,getTypes.length );

// 			cb(null,users);
// 		},
// 		function(users,cb){
// 			_.each(users,function(user){
// 				var hand= _.pick(user,"uid","handler");
// 				console.log(JSON.stringify(hand));
// 			})
// 			cb();
// 		}
// 		],function(err){
// 			next();
// 	});
// }
var validateCountry = function(logCountry,country)
{
	if(country=="Not_CN")
	{
		if(logCountry=="CN")
			return false;
		else
			return true;
	}
	else
	{
		if(country==logCountry)
			return true;
		else
			return false;
	}
}
SYNCGameUserManager.prototype.getGem = function(options,next){
	var self = this;
	var doIt = function(getStatisticalAll,getStatistical,costStatistical,getTypesStatistical,paidTypesStatistical,isCountry,country)
	{
			// var getStatisticalAll = self.initStatisticalJSON("daily",options.logDate,"169");
			// var getStatistical = self.initStatisticalJSON("daily",options.logDate,"111");
			// var costStatistical = self.initStatisticalJSON("daily",options.logDate,"170");
			// var getTypesStatistical = self.initStatisticalJSON("daily",options.logDate,"171");
			// var paidTypesStatistical = self.initStatisticalJSON("daily",options.logDate,"132");		
			var gembuygetcount=0,gemothergetcount=0,gemcost=0;
			var parms={},parmPaid={};			
			_.each(self.logs,function(parm){
				if(options.onlypaid&&(!_.contains(self.paiduids,parm.uid)))
					return;
				if(isCountry&&!validateCountry(parm.country,country))
					return;
				switch(parm.subType)
				{
					case "buygem":
						var arrMsg = parm.message.split(",");
						gembuygetcount+=parseInt(parm.R1);
						if(!isNaN(arrMsg[3]))
							gemothergetcount += parseInt(arrMsg[3]);
						else if(!isNaN(arrMsg[12]))
							gemothergetcount += parseInt(arrMsg[12]);
						else
							winston.info("error# get gemothergetcount error,parm:%s",JSON.stringify(parm));		
						if(parms["buygem"])
							parms["buygem"]+=parseInt(parm.R1);
						else
							parms["buygem"]=parseInt(parm.R1);
						var arrMsg=parm.message.split(",");
						//winston.debug("foreach the TavernBuyGem ,%s \n the gemOther:%s",JSON.stringify(parm),arrMsg[3]);
						var gemother = 0;
						if(!isNaN(arrMsg[3]))
							gemother = parseInt(arrMsg[3]);
						else if(!isNaN(arrMsg[12]))
							gemother = parseInt(arrMsg[12]);
						else
							winston.error("error# get gemothergetcount error,parm:%s",JSON.stringify(parm));

						if(parms["buygemother"])
							parms["buygemother"]+=parseInt(gemother);
						else
							parms["buygemother"]=parseInt(gemother);						
					break;
					case "getgem":
						gemothergetcount+=parseInt(parm.R1);
						if(parm.logType!="MailTake"){
							if(parm.logType=="Register")
							{
								if(parms["Register"])
									parms["Register"]+=parseInt(parm.R1);
								else
									parms["Register"]=parseInt(parm.R1);
							}
							else if(parm.logType=="TaskTakeRW")
							{
								if(parms["TaskTakeRW"])
									parms["TaskTakeRW"]+=parseInt(parm.R1);
								else
									parms["TaskTakeRW"]=parseInt(parm.R1);
							}

						}
						else{
							var arrMsg =parm.message.split(",");
							//winston.debug("getGemContent handle mailTake ,%s \n the title:%s,index:%s",JSON.stringify(parm),arrMsg[2],arrMsg[1]);
							if(arrMsg[2]==""&&arrMsg[1]==0&&!isNaN(parm.R1)&&parseInt(parm.R1)>0)
							{
								if(parms["MonthCard"])
									parms["MonthCard"]+=parseInt(parm.R1);
								else
									parms["MonthCard"] = parseInt(parm.R1);
							}
							else if(!isNaN(parm.R1)&&parseInt(parm.R1)>0)
							{
								if(parms["Activity"])
									parms["Activity"]+=parseInt(parm.R1);
								else
									parms["Activity"]=parseInt(parm.R1);
							}
						}						
					break;
					case "paid":
						gemcost+=parseInt(parm.R1);
						var thetype = "";
						if(parm.logType=="GemShopPurchase")
						{
							var arrMsg = parm.message.split(",");
							switch(arrMsg[1]){
								case "1":
									thetype="AdvShopPurchase";
									break;
								case "2":
									thetype="normalShopPurchase";
									break;
								case "3":
									thetype="odysseyShopPurchase";
									break;
								case "4":
									thetype="pvpShopPurchase";
									break;
								case "5":
									thetype="coinShopPurchase";
									break;
								case "6":
									thetype="blackShopPurchase";
									break;
								default:
									break;
							}
						}
						else
							thetype = parm.logType;
					    if(!parmPaid[thetype])
							parmPaid[thetype] = 0;
						 if(!isNaN(parm.R1))
						{
							parmPaid[thetype]+= (parseInt(parm.R1) || 0);
						}						
					break;
					default:
					break;					
				}

			});

			getStatisticalAll.count = gembuygetcount+gemothergetcount;
			getStatistical.count = gembuygetcount;
			costStatistical.count = gemcost;
			getTypesStatistical.countObj = JSON.stringify(parms);
			paidTypesStatistical.countObj = JSON.stringify(parmPaid);
			if(options.onlypaid)
			{
				getStatisticalAll.onlypaid = true;
				getStatistical.onlypaid = true;
				costStatistical.onlypaid = true;
				getTypesStatistical.onlypaid = true;
				paidTypesStatistical.onlypaid = true;
				// getStatisticalAll.sType = "180";
				// getStatistical.sType="181";
				// costStatistical.sType="182";
				// getTypesStatistical.sType="183";
				// paidTypesStatistical.sType="184";
			}
			if(options.region)
			{
				getStatisticalAll.region = options.region;
				getStatistical.region = options.region;
				costStatistical.region = options.region;
				getTypesStatistical.region = options.region;
				paidTypesStatistical.region = options.region;
			}
			//winston.debug("will insert gem");		
	}
	async.waterfall([
		function(cb){
			if(self.logs.length==0)
			{
				self.dataBind(options,cb);
			}
			else
			{
				cb();
			}
		},
		function(cb){
			if(!options.onlypaid)
			{
				cb();
				return;
			}
			var baseStatistical = self.initStatisticalJSON("daily",options.logDate,"");
			if(self.paiduids.length==0)
			{
				//winston.debug("begin get paidMan");
				keystone.list("GameUser").model.find({firstpaydate:{$lt:baseStatistical.lastDate}}).distinct("uid").exec(function(err,results){
					self.paiduids=results;
					cb();
				});				
			}
			else
			{
				cb();
			}
		},
		function(cb){
			var getStatisticalAll = self.initStatisticalJSON("daily",options.logDate,"169");
			var getStatistical = self.initStatisticalJSON("daily",options.logDate,"111");
			var costStatistical = self.initStatisticalJSON("daily",options.logDate,"170");
			var getTypesStatistical = self.initStatisticalJSON("daily",options.logDate,"171");
			var paidTypesStatistical = self.initStatisticalJSON("daily",options.logDate,"132");			
			doIt(getStatisticalAll,getStatistical,costStatistical,getTypesStatistical,paidTypesStatistical,false);
			self.insert(getStatisticalAll,options.logDate);
			self.insert(getStatistical,options.logDate);
			self.insert(costStatistical,options.logDate);
			self.insert(getTypesStatistical,options.logDate);
			self.insert(paidTypesStatistical,options.logDate,cb);
		},
		function(cb){
			if(!distinguishCountry)
			{
				cb();
				return;
			}
			var arrStatisticalJSON=[];
			_.each(self.countrys,function(country){
				var getStatisticalAll = self.initStatisticalJSON("daily",options.logDate,"169");
				var getStatistical = self.initStatisticalJSON("daily",options.logDate,"111");
				var costStatistical = self.initStatisticalJSON("daily",options.logDate,"170");
				var getTypesStatistical = self.initStatisticalJSON("daily",options.logDate,"171");
				var paidTypesStatistical = self.initStatisticalJSON("daily",options.logDate,"132");				
				doIt(getStatisticalAll,getStatistical,costStatistical,getTypesStatistical,paidTypesStatistical,true,country);
				getStatisticalAll.country=country;
				getStatistical.country=country;
				costStatistical.country=country;
				getTypesStatistical.country=country;
				paidTypesStatistical.country=country;
				arrStatisticalJSON.push(getStatisticalAll);
				arrStatisticalJSON.push(getStatistical);
				arrStatisticalJSON.push(costStatistical);
				arrStatisticalJSON.push(getTypesStatistical);
				arrStatisticalJSON.push(paidTypesStatistical);
			});
			self.batchInsertStatistical(arrStatisticalJSON,cb);
		}
		],function(err){
			next();
	});
}
SYNCGameUserManager.prototype.template = function(options,next){
	var self = this;
	async.waterfall([
		function(cb){
			if(self.logs.length==0)
			{
				self.dataBind(options,cb);
			}
			else
			{
				cb();
			}
		},
		function(cb){
			if(!options.onlypaid)
			{
				cb();
				return;
			}
			var baseStatistical = self.initStatisticalJSON("daily",options.logDate,"");
			if(self.paiduids.length==0)
			{
				//winston.debug("begin get paidMan");
				keystone.list("GameUser").model.find({firstpaydate:{$lt:baseStatistical.lastDate}}).distinct("uid").exec(function(err,results){
					self.paiduids=results;
					cb();
				});				
			}
			else
			{
				cb();
			}
		},
		function(cb){

		}		
		],function(err){
			next();
	});
};

SYNCGameUserManager.prototype.getGameLog = function(options,next){
	var self = this;
	var doIt = function(isCountry,country,next){
		var list = self.statisticallist;
		var i=0;
		var statisticalJSONs = {};
		_.each(self.logs,function(log){
			if(isCountry&&!validateCountry(log.country,country))
			{
				return;
			}
			if(options.onlypaid&&(!_.contains(self.paiduids,log.uid)))
				return;
			var l = _.find(list,function(parm){return parm.label==log.logType});
			if(l)
			{
				var value=l.value;
				var label = l.label;
				if(!statisticalJSONs[label])
					statisticalJSONs[label] = self.initStatisticalJSON("daily",options.logDate,value);
				statisticalJSONs[label].count++;
				if(options.onlypaid)
					statisticalJSONs[label].onlypaid = true;
				if(options.region)						
					statisticalJSONs[label].region = options.region;
			}
		});
		var thevalues = _.values(statisticalJSONs);
		self.batchInsertStatistical(thevalues,next);
	}
	async.waterfall([
		function(cb){
			if(self.logs.length==0)
			{
				self.dataBind(options,cb);
			}
			else
			{
				cb();
			}
		},
		function(cb){
			if(!options.onlypaid)
			{
				cb();
				return;
			}
			if(self.paiduids.length==0)
			{
				var baseStatistical = self.initStatisticalJSON("daily",options.logDate,"");
				keystone.list("GameUser").model.find({firstpaydate:{$lt:baseStatistical.lastDate}}).distinct("uid").exec(function(err,results){
					self.paiduids=results;
					cb();
				});				
			}
			else
			{
				cb();
			}
		},			
		function(cb){
			doIt(false,"",cb);
		},
		function(cb){
			if(!distinguishCountry)
			{
				cb();
				return;
			}
			var i=0;
			async.whilst(
				function(){return i<self.countrys.length},
				function(callback){
					var country = self.countrys[i];
					i++;
					doIt(true,country,callback);
				},
				function(err){
					cb();
				}
				);
		}
		],function(err){
				next();
	});
};
SYNCGameUserManager.prototype.getAdvCurrent = function(options,next){
	var self = this;
	async.waterfall([
		function(cb){
			if(self.logs.length==0)
			{
				self.dataBind(options,cb);
			}
			else
			{
				cb();
			}
		},
		function(cb){
			var statisticalJSON = self.initStatisticalJSON("daily",options.logDate,"0");
			keystone.list("ConsumptionAdvSummon").model.find({timeStamp:{$gte:statisticalJSON.firstDate,$lt:statisticalJSON.lastDate}}).remove(function(err){
				cb();
			});			
		},
		function(cb){
			var advsummonlist=[];
			var conAdv = keystone.list("ConsumptionAdvSummon");
			_.each(self.logs,function(log){
				if(log.logType==_config.logType.advSummon)
				{
					var arrMsg= log.message.split(",");
					if(arrMsg.length<5)
						return;
					var advsummon = {timeStamp:log.timeStamp,uid:log.uid,gem:parseInt(log.gembuy)+parseInt(log.gemother),instId:arrMsg[0],typeId:arrMsg[1],advType:arrMsg[2],cost:arrMsg[4]};
					advsummonlist.push(advsummon);					
				}
			});
			//winston.info("ConsumptionAdvSummon,length:%d",advsummonlist.length);
			self.batchInsertAnyCollection("ConsumptionAdvSummon",advsummonlist,cb);
		},
		function(cb){
			var advsList=[];
			var theAdv = keystone.list("Adventurer");
			_.each(self.logs,function(log){
				if(log.logType==_config.logType.statistical)
				{
					if(log.message=="{\"tavernlevel\":1}_,")
						return;
					var parm=log;
					//winston.info("handleIt parm:%s",JSON.stringify(parm));
					var arrStr = {};
					try{
						if(parm.message.substring(parm.message.length-1)==",")
							arrStr = JSON.parse(parm.message.substring(0,parm.message.length-2));
						else
						{
							console.log(parm.message.substring(parm.message.length-1));
							//console.log(this.message);
							arrStr =JSON.parse(parm.message.substring(0,parm.message.length-3));

							// return;
						}
					}
					catch(err){
						winston.error("#InnLog save event#statistical add error, %s,the message:%s",err,JSON.stringify(parm));
						return;
					}

					parm.innLevel = arrStr.tavernlevel;
					
					//console.log(typeof arrStr);
					var advs = [];
					if(arrStr.advs)
						advs = arrStr.advs;

					if (advs.length==0) {
						console.error("statictical message is null,the message:%s",parm.message);
						return;
					};	
					_.each(advs,function(advParm){
						//winston.info("will insert adv :%s",JSON.stringify(advParm));
						
						if(advParm&&advParm.uid)
						{
							advsList.push(advParm);
						}
					});	
				}					
			});
			var removeduids = [];
			_.each(advsList,function(adv){
				removeduids.push(adv.uid);
			});
			removeduids=_.uniq(removeduids);
			//winston.info("Adventurer update");
			keystone.list("Adventurer").model.remove({uid:{$in:removeduids}}).exec(function(){
				//winston.info("Adventurer length:%d",advsList.length);
				self.batchInsertAnyCollection("Adventurer",advsList,cb);
			});
		}
		],function(err){
			next();
	});	
}
SYNCGameUserManager.prototype.getdailyGameTimeDis = function(options,next){
	var self = this;
	var doIt = function(statisticalJSON,statisticalJSON2,isCountry,country,thenext){
		var base = 3600;//表示一小时
		var result = {};
		var result2 ={};
		//var basetime = statisticalJSON.firstDate;
		var getItItIt = function(basetime,cb){
			var getIt = function(err,count,uidCount,cb){
				if (err) {
					console.log(new Date()+err);
				};
				var hour = (new Date(basetime*1000)).getHours().toString();
				result[hour] = count;
				result2[hour] = uidCount;
				var btime = basetime+base;
				//console.log(JSON.stringify(result));
				getItItIt(btime,cb);
			}
			if (basetime<statisticalJSON.lastDate) {
				var fter = _.filter(self.logs,function(log){ 
					if(isCountry&&!validateCountry(log.country,country))
						return false;
					else if(options.onlypaid&&(!_.contains(self.paiduids,log.uid)))
						return false;		
					else
						return log.timeStamp>=basetime&&log.timeStamp<(basetime+base)
						 });
				var sessionCount = fter.length || 0;
				var uids = [];
				
				_.each(fter,function(log){
					if(_.contains(uids,log.uid))
						return;
					uids.push(log.uid);
				});
				var  uidCount=uids.length;
				var hour = (new Date(basetime*1000)).getUTCHours().toString();
				//winston.info("#manager#SYNC#dailyGametime#sessionCount:%d,uidCount:%d，hour:%d",sessionCount,uidCount,hour);
				setImmediate(getIt,null,sessionCount,uidCount,cb);
				//var q = keystone.list("InnLog").model.find().where("timeStamp").gte(basetime).where("timeStamp").lt(basetime+base).count(getIt);
			}
			else{
					statisticalJSON.countObj=JSON.stringify(result);
					statisticalJSON2.countObj=JSON.stringify(result2);
					//console.log(JSON.stringify(statisticalJSON));
					if(isCountry)
					{
						statisticalJSON.country=country;
						statisticalJSON2.country=country;
					}
					if(options.onlypaid)
					{
						statisticalJSON.onlypaid = true;
						statisticalJSON2.onlypaid = true;
					}
					if(options.region)
					{
						statisticalJSON.region = options.region;
						statisticalJSON2.region = options.region;
					}
					cb();
					//winston.debug("#manager#SYNCGameUserManager#play time:%s",JSON.stringify(statisticalJSON));
			}
		}
		getItItIt(statisticalJSON.firstDate,thenext);		
	}
	async.waterfall([
		function(cb){
			if(self.logs.length==0)
			{
				self.dataBind(options,cb);
			}
			else
			{
				cb();
			}
		},
		function(cb){
			if(!options.onlypaid)
			{
				cb();
				return;
			}
			if(self.paiduids.length==0)
			{
				var baseStatistical = self.initStatisticalJSON("daily",options.logDate,"");
				keystone.list("GameUser").model.find({firstpaydate:{$lt:baseStatistical.lastDate}}).distinct("uid").exec(function(err,results){
					self.paiduids=results;
					cb();
				});				
			}
			else
			{
				cb();
			}
		},			
		function(cb){

			var statisticalJSON = self.initStatisticalJSON("daily",options.logDate,"134");
			var statisticalJSON2 = self.initStatisticalJSON("daily",options.logDate,"189");
			doIt(statisticalJSON,statisticalJSON2,false,"",function(){
				winston.debug("#manager#SYNCgameUser#statisticalJSON:%s",JSON.stringify(statisticalJSON));
				self.batchInsertStatistical([
					statisticalJSON,
					statisticalJSON2
					],cb);				
			});
		},
		function(cb){
			if(!distinguishCountry)
			{
				cb();
				return;
			}
			var arrStatisticalJSON = [];
			var i =0;
			async.whilst(
				function(){return i<self.countrys.length},
				function(callback){
					var country=self.countrys[i];
					var statisticalJSON = self.initStatisticalJSON("daily",options.logDate,"134");
					var statisticalJSON2 = self.initStatisticalJSON("daily",options.logDate,"189");				
					doIt(statisticalJSON,statisticalJSON2,true,country,function(){
						arrStatisticalJSON.push(statisticalJSON);
						arrStatisticalJSON.push(statisticalJSON2);
						i++;
						callback();
					});					
				},
				function(err){
					self.batchInsertStatistical(arrStatisticalJSON,cb);
				}
				);
		}
		],function(err){
				next();
	});	

}
SYNCGameUserManager.prototype.getPvPInformation = function(options,next){
	var self = this;
	var arrStatisticalJSON=[];
	var doIt = function(statisticalJSON161,statisticalJSON162,statisticalJSON163,statisticalJSON164,isCountry,country)
	{
			var foreachMessage = function(strMessage,arrStr){
				if(!strMessage)
				{
					return;
				}
				var parm = strMessage.split("-");
				for(var i=0;i<parm.length;i++){
					if(parm[i].length>0)
						arrStr.push(parm[i]);
				}
			}
			var arrAdv=[],arrSkill=[],arrWinAdv=[],arrWinSkill=[];

			_.each(self.logs,function(log){
				var logType = log.logType;
				if(options.onlypaid&&(!_.contains(self.paiduids,log.uid)))
					return;				
				if(!_.contains(["PvPFinish","BePvPFinish"],logType))
				{
					return;
				}				
				if(isCountry&&!validateCountry(log.country,country))
				{
					return;
				}

				var arrStr = log.message.split(",");
				var p = "";
				if(!arrStr||arrStr.length<7)
				{
					p = arrStr[4];
				}
				else
				{
					p = arrStr[6];
				}
				var arrP = p.split(":");
				if(!arrP||arrP.length!=4)
				{
					winston.error("pvp foreach err,message[6] is unformat,log:%s",JSON.stringify(log));
					return;
				}
				var advs = arrP[0];
				var skills = arrP[1];
				var  pvpresult = arrP[2];
				var  isDefend = arrP[3];
				foreachMessage(advs,arrAdv);
				foreachMessage(skills,arrSkill);

				//console.log("PvPResult:%s",pvpresult);
				if(pvpresult=="0")
				{
					foreachMessage(advs,arrWinAdv);
					foreachMessage(skills,arrWinSkill);				
				}				
			});
			statisticalJSON161.countObj = getGroupAndSum(arrAdv);
			statisticalJSON162.countObj = getGroupAndSum(arrSkill);
			statisticalJSON163.countObj = getGroupAndSum(arrWinAdv);
			statisticalJSON164.countObj = getGroupAndSum(arrWinSkill);
			if(options.onlypaid)
			{
				statisticalJSON161.onlypaid = true;
				statisticalJSON162.onlypaid = true;
				statisticalJSON163.onlypaid = true;
				statisticalJSON164.onlypaid = true;
			}
			if(options.region)
			{
				statisticalJSON161.region = options.region;
				statisticalJSON162.region = options.region;
				statisticalJSON163.region = options.region;
				statisticalJSON164.region = options.region;
			}


	}
	async.waterfall([
		function(cb){
			if(self.logs.length==0)
			{
				self.dataBind(options,cb);
			}
			else
			{
				cb();
			}
		},
		function(cb){
			if(!options.onlypaid)
			{
				cb();
				return;
			}
			if(self.paiduids.length==0)
			{
				var baseStatistical = self.initStatisticalJSON("daily",options.logDate,"");
				keystone.list("GameUser").model.find({firstpaydate:{$lt:baseStatistical.lastDate}}).distinct("uid").exec(function(err,results){
					self.paiduids=results;
					cb();
				});				
			}
			else
			{
				cb();
			}
		},			
		function(cb){
			arrStatisticalJSON=[];
			var statisticalJSON161={},statisticalJSON162={},statisticalJSON163={},statisticalJSON164={};
			statisticalJSON161 = self.initStatisticalJSON("daily",options.logDate,"161");
			statisticalJSON162 = self.initStatisticalJSON("daily",options.logDate,"162");
			statisticalJSON163 = self.initStatisticalJSON("daily",options.logDate,"163");
			statisticalJSON164 = self.initStatisticalJSON("daily",options.logDate,"164");
			doIt(statisticalJSON161,statisticalJSON162,statisticalJSON163,statisticalJSON164);
			arrStatisticalJSON.push(statisticalJSON161);
			arrStatisticalJSON.push(statisticalJSON162);
			arrStatisticalJSON.push(statisticalJSON163);
			arrStatisticalJSON.push(statisticalJSON164);			
			self.batchInsertStatistical(arrStatisticalJSON,cb);
		},
		function(cb){
			if(!distinguishCountry)
			{
				cb();
				return;
			}
			arrStatisticalJSON=[];
			_.each(self.countrys,function(country){
				var statisticalJSON161={},statisticalJSON162={},statisticalJSON163={},statisticalJSON164={};
				statisticalJSON161 = self.initStatisticalJSON("daily",options.logDate,"161");
				statisticalJSON162 = self.initStatisticalJSON("daily",options.logDate,"162");
				statisticalJSON163 = self.initStatisticalJSON("daily",options.logDate,"163");
				statisticalJSON164 = self.initStatisticalJSON("daily",options.logDate,"164");				
				doIt(statisticalJSON161,statisticalJSON162,statisticalJSON163,statisticalJSON164,true,country);
				statisticalJSON161.country=country;
				statisticalJSON162.country=country;
				statisticalJSON163.country=country;
				statisticalJSON164.country=country;
				arrStatisticalJSON.push(statisticalJSON161);
				arrStatisticalJSON.push(statisticalJSON162);
				arrStatisticalJSON.push(statisticalJSON163);
				arrStatisticalJSON.push(statisticalJSON164);
			});
			self.batchInsertStatistical(arrStatisticalJSON,cb);
		}
		],function(err){
				next();
	});	
}
SYNCGameUserManager.prototype.getAllRetention = function(options,next){
	var self =this;
	async.waterfall([
		//操作
		//国别，注册类型和付费用户
		function(cb){
			var i=-1;
			options.registerType="1";

			if(!self.countrys||self.countrys.length==0)
			{
				cb();
				return;
			}
			async.whilst(
				function(){return (i+1)<self.countrys.length},
				function(callback){
					var theOptions = _.clone(options);
					i++;
					theOptions.country=self.countrys[i];
					
					self.getRetention(theOptions,callback);
				},
				function(err){
					cb();
				}
				);
		},
		function(cb){
			var i=-1;
			
			options.registerType="0";

			if(!self.countrys||self.countrys.length==0)
			{
				cb()
				return;
			}
			async.whilst(
				function(){return (i+1)<self.countrys.length},
				function(callback){
					var theOptions = _.clone(options);
					i++;
					theOptions.country=self.countrys[i];
					
					self.getRetention(theOptions,callback);
				},
				function(err){
					cb();
				}
				);			
		},
		function(cb){
			options.registerType="0";
			var theOptions = _.clone(options);
			winston.debug("theOptions:%s",JSON.stringify(theOptions));
			self.getRetention(theOptions,cb);
		},
		function(cb){
			options.registerType="1";
			var theOptions = _.clone(options);
			winston.debug("theOptions:%s",JSON.stringify(theOptions));
			self.getRetention(theOptions,cb);			
		}
		],function(err){
			next();
	});
}

SYNCGameUserManager.prototype.getRetention = function(options,next){
	var self = this;
	async.waterfall([
		function(cb){
			if(self.logs.length==0)
			{
				self.dataBind(options,cb);
			}
			else
			{
				cb();
			}
		},
		function(cb){
			if(!options.onlypaid)
			{
				cb();
				return;
			}
			var baseStatistical = self.initStatisticalJSON("daily",options.logDate,"");
			if(self.paiduids.length==0)
			{
				//winston.debug("begin get paidMan");
				keystone.list("GameUser").model.find({firstpaydate:{$lt:baseStatistical.lastDate}}).distinct("uid").exec(function(err,results){
					self.paiduids=results;
					cb();
				});				
			}
			else
			{
				cb();
			}
		},
		function(cb){
			var dateInfo = self.initStatisticalJSON("daily",options.logDate,"");
			var retentionInfo={uids:[],retentions:[]};
			_.each(self.logs,function(log){
				if(options.country&&!validateCountry(log.country,options.country))
					return;
				if(options.onlypaid&&!_.contains(self.paiduids,log.uid))
					return;
				if(log.logType=="Register")
				{
					if(options.registerType=="1")
					{
						if(_.find(self.logs,function(parm){return parm.logType=="LogOn"&&parm.uid==log.uid}))
							retentionInfo.uids.push(log.uid);
					}
					else 
						retentionInfo.uids.push(log.uid);		
				}
			});
			var daysleft={};
			daysleft.logDate=dateInfo.firstDate;
			daysleft.newuserCount=retentionInfo.uids.length;
			daysleft.sort = daysleft.category = 0;
			daysleft.registerType = (options.registerType+"") || "0";
			daysleft.tType = 1;
			daysleft.daysLeft=[];
			if(options.country)
			{
					daysleft.country=options.country;
					//winston.info("typeof 1country %s",typeof country);
			}
			if(options.onlypaid)
				daysleft.onlypaid=true;
			if(options.region)
				daysleft.region = parseInt(options.region);
			daysleft.uids = retentionInfo.uids;
			daysleft.retentions = retentionInfo.retentions;
			daysleft.daysLeft = JSON.stringify(daysleft.daysLeft);
			var daysleftModel = keystone.list("DaysLeft");			//winston.debug("#manager#SYNCGameUser#getretention#daysleft:%s",JSON.stringify(daysleft));
			var newdaysleft = new daysleftModel.model(daysleft);
			//winston.debug("newdaysleft:%s",JSON.stringify(newdaysleft));
			newdaysleft.save(function(err){
				self.showError(err);
				cb();
			});
		},
		function(cb){
			var dateInfo = self.initStatisticalJSON("daily",options.logDate,"");
			var sql = {logDate:{$gte:(dateInfo.firstDate-30*86400),$lt:(dateInfo.lastDate)}};
			if(options.country)
				sql.country=options.country;
			if(options.onlypaid)
				sql.onlypaid={$exists:true};
			else 
				sql.onlypaid={$exists:false};
			if(options.region)
				sql.region=options.region;
			else
				sql.region={$exists:false};
			sql.registerType=options.registerType;
			//winston.debug("manager#SYNCGameUser#getRetention ,sql:%s",JSON.stringify(sql));
			keystone.list("DaysLeft").model.find(sql).exec(function(err,results){
				
				self.showError(err);
				//winston.info("results:%s",JSON.stringify(results));
				var i = 0;
				if(!results||results.length==0)
				{
					cb();
					return;
				}
				async.whilst(
					function(){return i<results.length},
					function(callback){						
						var daysleft =results[i];
					//	winston.info("logDate:%s，retentions:%s",new Date(daysleft.logDate*1000),JSON.stringify(daysleft.retentionInfo.retentions));
						var dateInfo = self.initStatisticalJSON("daily",options.logDate,"");
						//winston.debug("the daysleft :%s,i:%d",JSON.stringify(results[i]),i);
						if(results[i].uids.length==0)
						{
							i++;
							callback();
							return;
						}
						if((dateInfo.firstDate - results[i].logDate)%86400>0)
						{
							i++;
							winston.error("#models#Daysleft#udateRetentionInfo the index is not Int,dateInfo.firstDate:%d,daysleft.logDate:%d",dateInfo.firstDate,daysleft.logDate);
							callback();
							return;
						}
						var index =parseInt( (dateInfo.firstDate - results[i].logDate)/86400);
						var Arrcount = [];
						var sessionCount = 0;
						_.each(self.logs,function(log){
							if(options.country&&!self.validateCountry(log.country,results[i].country))
								return;
							if(options.onlypaid&&!_.contains(results[i].uids,log.uid))
								return;
							if(!_.contains(results[i].uids,log.uid))
								return;

							sessionCount++;

							if(log.logType!="LogOn")
							{
								return;
							}							
							Arrcount.push(log.uid);
						});
						Arrcount = _.uniq(Arrcount);
						var count =Arrcount.length || 0;

						if(results[i].retentions.length==index)
							results[i].retentions.push(count);
						else if(results[i].retentions.length>index)
						{
							results[i].retentions[index] = count;
							results[i].retentions = results[i].retentions;
						}
						else if(results[i].retentions.length<index)
						{
							var length = index - results[i].retentions.length;
							for(var j=0;j<length;j++)
							{
								results[i].retentions.push(0);
							}
							results[i].retentions.push(count);
						}

						if(results[i].sessionCount.length==index)
							results[i].sessionCount.push(sessionCount);
						else if(results[i].sessionCount.length>index)
						{
							results[i].sessionCount[index] = sessionCount;
							results[i].sessionCount = results[i].sessionCount;
						}
						else if(results[i].sessionCount.length<index)
						{
							var length = index - results[i].sessionCount.length;
							for(var j=0;j<length;j++)
							{
								results[i].sessionCount.push(0);
							}
							results[i].sessionCount.push(sessionCount);
						}							
						
						var arrRetention = [];
						var arrSessoin = [];
						if(results[i].newuserCount!=0)
						{
							_.each(results[i].retentions,function(retention,index){
								var date = results[i].logDate+index*86400;
								var count = retention;
								var result = {dayleft:0,date:0};
								result.dayleft = count/results[i].newuserCount*100;
								result.date = date;
								//winston.debug("daysleftcount:%d,date:%d",count,date);
								arrRetention.push(result);
							});
							_.each(results[i].sessionCount,function(count,index){
								var date = results[i].logDate+index*86400;
								var count = count;
								var result = {count:0,date:0};
								result.count = count;
								result.date = date;
								//winston.debug("daysleftcount:%d,date:%d",count,date);
								arrSessoin.push(result);
							});
						}
						results[i].daysLeft=JSON.stringify(arrRetention);
						results[i].sessions = JSON.stringify(arrSessoin);
						results[i].save(function(err){
							self.showError(err);
							//winston.info("logDate:%s,country:%s,onlypaid:%s,registerType:%s,retentions:%s,daysleft:%s",(new Date(results[i].logDate*1000)).format("MM-dd"),results[i].country,results[i].onlypaid?"paid":"NotPaid",results[i].registerType+"",JSON.stringify(results[i].daysLeft));							
							i++;
							callback();
						});
					},
					function(err){
						cb();
					});
			});
		}
		],function(err){


			next();
	});
};

SYNCGameUserManager.prototype.getSummary = function(options,next){
	var self = this;
	var baseStatistical = self.initStatisticalJSON("daily",options.logDate,"");
	async.waterfall([
		function(cb){
			var i=0;
			var region = "";
			if(options.region)
				region = options.region;
			var countrys = self.countrys;
			countrys = ["CN","Not_CN"];
			async.whilst(
				function(){return i<countrys.length},
				function(callback){
					var country = countrys[i];
					i++;
					winston.info("get summary region:%d,country:%s",region,country);
					ih = new innloghandle();
					ih.phaseStatistical(self,baseStatistical.firstDate,baseStatistical.lastDate,options.logDate,country,region,callback);
				},
				function(err){
					winston.info("get summary region:%d,country:null",region);
					ih = new innloghandle();
					ih.phaseStatistical(self,baseStatistical.firstDate,baseStatistical.lastDate,options.logDate,"",region,cb);
				});
		}
		],function(err){
			next();
	});
};


exports = module.exports = SYNCGameUserManager;