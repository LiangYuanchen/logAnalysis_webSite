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
var winston = require("winston");
var gameconfigExchange = require("./GameConfigExchange");

var SYNCRetentionManager = function(){
	statistical.call(this);
	var self = this;
	self.logs=[];
	self.users={};
	self.filteruids=[];
};
util.inherits(SYNCRetentionManager,statistical);
var  dataBind=function(options,next){
	var self = this;
	//winston.info(typeof self.initStatisticalJSON);
	if(typeof self.initStatisticalJSON!="function")
	{
		var msg = "SYNCRetentionManager dataBind error,use dataBind.call";
		winston.info(msg);
		next(msg);
		return;
	}
	if(!options.firstDate||!options.lastDate)
	{
		var msg = "SYNCRetentionManager dataBind error,,firstDate,lastDate is undefined,options:%s"+JSON.stringify(options);
		winston.info(msg);
		next(msg);		
		return;
	}
	var sql={logType:{$in:["Register","LogOn"]}, timeStamp:{$gte:options.firstDate,$lt:options.lastDate}};
	//winston.debug("dataBind logDate:%s,the sql:%s",options.logDate, utils.stringify(sql));
	var doIt = function(logArr,callback)
	{
		_.each(logArr,function(parm){
			if(_.contains(self.filteruids,parm.uid))
			{
				return;
			}
			if(parm.timeStamp>=options.firstDate&&parm.timeStamp<options.lastDate&&(parm.logType=="Register"||parm.logType=="LogOn"))
			{
				self.logs.push(_.pick(parm,"uid","logType","timeStamp","country"));
			}
		});
		//winston.debug("logArr gets,currentlength:%d",self.logs.length);
		callback();
	}
	self.selectByStream(sql,doIt,next);
}
SYNCRetentionManager.prototype.logs=[];
SYNCRetentionManager.prototype.users={};
SYNCRetentionManager.prototype.filteruids=[];

exports = module.exports = SYNCRetentionManager;
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
SYNCRetentionManager.prototype.getFilterUids = function(logDate,next){
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

//options:
//	 logDate跑取日期，idays:跑取天数,jdays:留存记录天数,country:跑取国别,registerType:注册人员界定方式
SYNCRetentionManager.prototype.getRetention = function(options,next)
{
	var self =this;
	//检查
	if(!options.logDate)
	{
		winston.info("logDate is undifined,options:%s",JSON.stringify(options));
	}
	if(isNaN(options.idays))
		options.idays=30;
	if(isNaN(options.jdays))
		options.jdays=30;
	async.waterfall([
		function(cb){
			if(self.filteruids.length==0)
				self.getFilterUids(options.logDate,cb);
			else
			{
				cb();
			}
		},
		function(cb){
			winston.info("getRetention ,getDatabind;");
			if(self.logs.length==0)
			{
				var bindOption = {};
				bindOption.logDate=options.logDate;
				bindOption.firstDate=self.showDailyBegin(options.logDate-(options.idays-1)*86400);
				bindOption.lastDate=self.showDailyEnd(options.logDate+(options.jdays-1)*86400);
				bindOption.country = options.country;
				bindOption.registerType = options.registerType;
				dataBind.call(self,bindOption,cb);
			}
			else
			{
				cb();
			}
		},
		function(cb){
			winston.info("getRetention,calculate");
			
			var getDaysLeft=function(options,thenext)
			{
				var i=0;
				async.whilst(
					function(){ return i<options.jdays },
					function(callback){
						var currentDate=options.logDate+(i)*86400;
						var thefirst = self.showDailyBegin(currentDate);
						var thelast = self.showDailyEnd(currentDate);
						var logsuids=  [];
						_.each(self.logs,function(log){
							if(options.country&&!validateCountry(log.country,options.country))
								return;
							if(log.timeStamp>=thefirst&&log.timeStamp<thelast&&log.logType=="LogOn"&&_.contains(options.users,log.uid))
							{
								logsuids.push(log.uid);
							}
						});
						logsuids = _.uniq(logsuids);
						var result={};
						if(options.users.length>0)
							result.dayleft=(parseFloat(logsuids.length)/options.users.length)*100;
						else
							result.dayleft=0;
						result.date = thefirst;
						if(!options.daysLefts)
							options.daysLefts=[];
						options.daysLefts.push(result);
						i++;
						callback();
					},
					function(err){
						var parm={};
						if(!options.daysLefts)
						{
							thenext();		
							return;				
						}						
						parm.logDate=options.daysLefts[0].date;
						parm.daysLeft = JSON.stringify(options.daysLefts);
						parm.newuserCount = options.users.length;
						parm.category = 0;
						parm.sort = parm.category;
						parm.registerType=(options.registerType+"") || "0";
						parm.tType=1;
						var daysLeft = keystone.list("DaysLeft");
						var ops={};
						//winston.info("typeof country %s,%s",typeof country,JSON.stringify(country));
						if(options.country)
						{
							if(typeof options.country != "string")
							{
								ops={logDate:parm.logDate,category:0,country:"Not_CN"};
								parm.country = "Not_CN";
								//winston.debug("debug it");
							}
							else
							{
								ops={logDate:parm.logDate,category:0,country:options.country};
								parm.country=options.country;
								//winston.info("typeof 1country %s",typeof country);
							}
						}
						else
							ops={logDate:parm.logDate,category:0,country:{$exists:false}};
						ops.registerType = parm.registerType;
						winston.debug("get the ops:%s",JSON.stringify(ops));
						var oldd = daysLeft.model.find(ops).remove(function(){
							var dd = new daysLeft.model(parm);
							winston.info("daysleft:%s",JSON.stringify(parm));
							dd.save(function(){
								thenext();
							});
						});	
					}
				);
			};			
			var i =0;
			var dayleftsResult=[];
			async.whilst(
				function(){return i<options.idays },
				function(callback){
					var currentDate = options.logDate-i*86400;
					var thefirst = self.showDailyBegin(currentDate);
					var thelast = self.showDailyEnd(currentDate);

					var getdayleftOptions ={firstDate:thefirst,lastDate:thelast,logDate:currentDate,country:options.country};
					getdayleftOptions.users=[];
					getdayleftOptions.daysLefts=[];
					getdayleftOptions.jdays=options.jdays;
					getdayleftOptions.registerType = options.registerType;
					var currentDateLog= _.filter(self.logs,function(log){
						if(options.country&&!validateCountry(log.country,options.country))
							return false;
						else
							return log.timeStamp>=thefirst&&log.timeStamp<thelast;
					});

					_.each(currentDateLog,function(log){
						if(log.logType=="Register")
						{
							if(options.registerType=="1")
							{
								if(_.find(currentDateLog,function(parm){return parm.logType=="LogOn"&&parm.uid==log.uid}))
									getdayleftOptions.users.push(log.uid);
							}
							else 
								getdayleftOptions.users.push(log.uid);
						}
					});

					getDaysLeft.call(self,getdayleftOptions,function(){
							i++;
							callback();
							return;
					});
				},
				function(err){
					cb();
				}
				);
		}
		],function(){
			winston.info("RetentionManager over");
			next();
	});

}
