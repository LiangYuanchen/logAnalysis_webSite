/*
*	大部分功能已经废弃
*/
var keystone = require("keystone"),
	async = require('async'),
	_ = require('underscore'),
	innLog = keystone.list("InnLog"),
	middleware = require("../routes/middleware");
	innLog_Global = keystone.list("InnLog_Global");
var util = require("util");
var manager = require("./manager");
var _config =keystone.get("_config");
var gameErrorManager=require("./gameErrorManager");
var daysLeftManager = require('./DaysLeftManager');
var winston = require('winston');
var statisticalManager = function(){
	manager.call(this);
	var listParm = keystone.list("Statistical").uiElements[4].field.ops;
	var list = [];
	for (var i = listParm.length - 1; i >= 0; i--) {
		var intParm = parseInt(listParm[i].value);
		if (intParm>=15000) {
			list.push(listParm[i]);
		};
	};
	this.cache = {};
	this.statisticallist = list;
	return this;
}
util.inherits(statisticalManager,manager);
//平均数算法和总数算法
statisticalManager.prototype.cache = {};
statisticalManager.prototype.avg = function(parmList,next){
		parmList.exec(function(err, results) {
			var count = results.length;
			var cCount = 0;
			var avgFunc = function(parm,cb){
				cCount += parm.count;
				cb();
			}
			async.forEach(parmList,avgFunc,function(){
				var avgInt = cCount/count;
				next(err,avgInt);
			});
		});
}
statisticalManager.prototype.sum = function(parmList,next){
			parmList.exec(function(err, results) {
			var count = results.length;
			var cCount = 0;
			var avgFunc = function(parm,cb){
				cCount += parm.count;
				cb();
			}
			async.forEach(parmList,avgFunc,function(){
				var avgInt = cCount;
				next(err,avgInt);
			});
		});
}
//待遗弃
function showDailyBegin(logDate){
	var Nowdate=new Date(logDate*1000);
	var day = Nowdate.getHours()*60*60*1000+Nowdate.getMinutes()*60*1000+Nowdate.getSeconds()*1000+Nowdate.getMilliseconds();
	var dailyBegin = new Date(Nowdate-day);
	dailyBegin = dailyBegin/1000;
	return dailyBegin;
}
//待遗弃
function showDailyEnd(logDate){
	var tomorrow = new Date(logDate*1000+86400000);
	var dailyEnd = showDailyBegin(tomorrow/1000);
	return dailyEnd;
}
//待遗弃
function showWeekFirstDay(logDate)
{
var Nowdate=new Date(logDate*1000);
var day = Nowdate.getHours()*60*60*1000+Nowdate.getMinutes()*60*1000+Nowdate.getSeconds()*1000+Nowdate.getMilliseconds();
var WeekFirstDay=new Date(Nowdate-(Nowdate.getDay()-1)*86400000-day);
WeekFirstDay = WeekFirstDay/1000;
return WeekFirstDay;
}
//待遗弃
function showWeekLastDay(logDate)
{
var Nowdate=new Date(logDate*1000);
var day = Nowdate.getHours()*60*60*1000+Nowdate.getMinutes()*60*1000+Nowdate.getSeconds()*1000+Nowdate.getMilliseconds();
var WeekFirstDay=new Date(Nowdate-(Nowdate.getDay()-2)*86400000-day);
var WeekLastDay=new Date((WeekFirstDay/1000+6*86400)*1000);
WeekLastDay = WeekLastDay/1000;
return WeekLastDay;
}
//待遗弃
function showMonthFirstDay(logDate)
{
var Nowdate=new Date(logDate*1000);
var MonthFirstDay=new Date(Nowdate.getYear()+1900,Nowdate.getMonth(),1);
MonthFirstDay = MonthFirstDay/1000;
return MonthFirstDay;
}
//待遗弃
function showMonthLastDay(logDate)
{
var Nowdate=new Date(logDate*1000);
var MonthNextFirstDay=new Date(Nowdate.getYear()+1900,Nowdate.getMonth()+1,1);
var MonthLastDay=new Date(MonthNextFirstDay);
MonthLastDay = MonthLastDay/1000;
return MonthLastDay;
}

function isArray(obj) {   
  return Object.prototype.toString.call(obj) === '[object Array]';    
}  
function getGlobalData(statisticalJSON,q,parm,next){
	//console.log("getGlobalDate");
	q.exec(function(err,results){
	//	console.log("getGlobalDate .length:"+results.length);
		//console.log("online: resultCount:"+results.length+",firstDate:"+firstDate+",lastDate:"+lastDate*1000);
		//取出所有globalLog,然后根据批次不同进行分组，组内求和，组外求平均数
		//console.log("online result:"+ results);
		if (!results||results.length==0||err) {
			next(err);
			return;
		};

		var parmResult = _.groupBy(results,function(parm){return parm.tag});

		var values =  _.values(parmResult);
		var parmCount = [];
		for(var i=0;i<values.length;i++){
			var innlogGlobalparm = values[i];
			var parmCountG = 0;
			for(var j=0;j<innlogGlobalparm.length;j++)
			{
				//parmCountG+=innlogGlobalparm[j].userCount;
				eval("parmCountG+=innlogGlobalparm[j]."+parm);
			}
			parmCount.push(parmCountG);
		}

		var cCount = 0;
		var count = parmCount.length||0;
		if (count==0) {
			console.log("该区间内没有数据");
			return;
		};

		for(var i=0;i<parmCount.length;i++)
		{
			cCount+=parmCount[i];
		}
		//console.log("parmResult:"+parmResult+" online cCount:"+cCount+":count:"+count);
		// _.each(results,function(ele,index,list){
		// 	cCount+= ele.online;
		// 	//console.log("[online] parm:"+ele);
		// });
		//console.log("[online] parm is over");
		if (isNaN(statisticalJSON.count)) {
			console.error("[userCount] count is Not a Num, parmCount:"+parmCount);
			return;
		};
		statisticalJSON.count = cCount/count;
		next();
	});
}
//

statisticalManager.prototype.insert = function(statistical,logDate,next)
{
	

	//测试数据添加
	var statistics = [];
	if (statistical) {
		if (isArray(statistical)) {
			for (var i = statistical.length - 1; i >= 0; i--) {
				statistics.push(statistical[i]);
			};
		}
		else
			statistics.push(statistical);

	}else
	{
		console.error("Error add newone , statistical is null");
		console.error(err);
		if (next) {
			next(err);
		};
		return;
	}
	//console.log("statistics:%s",JSON.stringify(statistics));
	function createStatistical(newone, done) {
		newone.logDate = logDate;
		//console.log(JSON.stringify(newone));
		var Statistical = keystone.list('Statistical');
		newone.tType = parseInt(newone.tType);
		var newone = new Statistical.model(newone);
		if(newone&&isNaN(newone.tType))
		{
			newone.tType=1;
		}
		//newAdmin.isAdmin = true;
		
		newone.save(function(err) {
			if (err) {
				console.error("Error adding newone " + JSON.stringify(newone) + " to the database:");
				console.error(err);
			} else {
				 //console.log("Added newone " + JSON.stringify(newone) + " to the database.");
			}
			done();
		});
	}
	async.forEach(statistics, createStatistical, function(err){
		if (err) {
			console.error(err);
		}else{
			//console.log("finish insert Statistical");
			if (next) {
				//console.log("insert next type: "+typeof next);
				//console.log(JSON.stringify(next));
				next();
			}
		}
	});
}
statisticalManager.prototype.build = function(firstDate,lastDate,next)
{
	var logDate = Date.now()/1000;
	var q = keystone.list("InnLog_Global").model.find().where('logDate').gte(firstDate).where("logDate").lt(lastDate);
	this.online(q,firstDate,lastDate,logDate);
	this.userCount(q,firstDate,lastDate,logDate);
	//this.Gemonsumed(firstDate,lastDate,logDate);
	this.getHandlerError(firstDate,lastDate,logDate);
	this.getMsgError(firstDate,lastDate,logDate);

	this.sessionBuild(firstDate,lastDate,logDate,next);

	var isGetErrorLog = keystone.get("GetErrorLog");
	if (isGetErrorLog) {
		var gem =new gameErrorManager();
		gem.onTimeAdd(logDate,firstDate,lastDate,next);
	};
	//console.log((new Date(logDate*1000)).format("yyyy-MM-dd hh:mm:ss")+">>> build complited！！！ ");
	//session数据处理
} 
statisticalManager.prototype.sessionBuild = function(firstDate,lastDate,logDate,next)
{
	var statisticalJSON = {firstDate:firstDate,lastDate:lastDate,sType:"4",count:0}; 
	statisticalJSON.count = keystone.get("sessionCount");
	keystone.set("sessionCount",0);
	if (isNaN(statisticalJSON.count)) {
		console.error("[sessionBuild]1 session count is Not a Num");
		return;
	};				
	//console.log(JSON.stringify(statisticalJSON));
	this.insert(statisticalJSON,logDate);
	statisticalJSON.sType = "5";
	statisticalJSON.count = keystone.get("registerCount");
	if (isNaN(statisticalJSON.count)) {
		console.error("[sessionBuild]2 register count is Not a Num");
		return;
	};
	keystone.set("registerCount",0);
	//console.log("RegisterCount:%s" ,JSON.stringify(statisticalJSON));
	this.insert(statisticalJSON,logDate);

	statisticalJSON.sType = "6";
	statisticalJSON.count = keystone.get("onlineUid").length;
	if (isNaN(statisticalJSON.count)) {
		console.error("[sessionBuild]3 onlineUid count is Not a Num");
		return;
	};
	keystone.set("onlineUid",[]);
	//console.log(JSON.stringify(statisticalJSON));
	this.insert(statisticalJSON,logDate);

	statisticalJSON.sType = "11";
	if(keystone.get("payingPlayerCount"))
		statisticalJSON.count = keystone.get("payingPlayerCount").length;
	else 
		statisticalJSON.count = 0;
	keystone.set("payingPlayerCount",0);

	this.insert(statisticalJSON,logDate);
	
	if (keystone.get("GemConsumed")) {
		statisticalJSON.sType = "7";
		var count = keystone.get("GemConsumed");
		if(isNaN(count)){
			console.error("[sessionBuild]4 GemConsumed count isNaN");
			return;
		}
		statisticalJSON.count = parseInt(count);
		this.insert(statisticalJSON,logDate,function(err){
			if (err) {
				console.error("[sessionBuild]4 insert error err:"+err);
				return;
			};
			keystone.set("GemConsumed",0);
		});
	};

	next();
}
//实时信息(计算并使用基础数据进行运算)
statisticalManager.prototype.online = function(q,firstDate,lastDate,logDate,next){
	var self = this;

	var statisticalJSON = {firstDate:firstDate,lastDate:lastDate,sType:"1",count:0}; 
	 _config.gameids
	 var i=0;
	 statisticalJSON.count=0;
	 async.whilst(
	 	function(){
	 		return i<_config.gameids.length;
	 	},
	 	function(callback){
	 		var gameid = _config.gameids[i];
	 		keystone.list("InnLog_Global").model.find({gameid:gameid+""}).sort({logDate:-1}).limit(1).exec(function(err,results){
				if(results.length==1)
				{
					statisticalJSON.count+=parseInt(results[0].online);
					
				}
				i++;
				callback();
	 		});
	 	},
	 	function(err){
	 		self.insert(statisticalJSON,logDate,next);
	 	}
	 	);
}

statisticalManager.prototype.userCount = function(q,firstDate,lastDate,logDate,next){
	var self = this;
	var statisticalJSON = {firstDate:firstDate,lastDate:lastDate,sType:"3",count:0}; 
	var q = keystone.list("InnLog").model.find({logType:"Register"}).count(function(err,count){
		//console.log("userCount staticalJSON:"+JSON.stringify(statisticalJSON));	
		statisticalJSON.count = count;
		self.insert(statisticalJSON,logDate,next);
	});
		
}
statisticalManager.prototype.getHandlerError = function(firstDate,lastDate,logDate,next){
	var self = this;
	var statisticalJSON = {firstDate:firstDate,lastDate:lastDate,sType:"10",count:0};
	var getIt = function(err,count){
		statisticalJSON.count = count;
		self.insert(statisticalJSON,logDate,next);
	};
	var q = keystone.list("InnLog").model.find().where("timeStamp").gte(firstDate).where("timeStamp").lt(lastDate).where("logType","HandlerErr").count(getIt);
}
statisticalManager.prototype.getMsgError = function(firstDate,lastDate,logDate,next){
	var self = this;
	var statisticalJSON = {firstDate:firstDate,lastDate:lastDate,sType:"9",count:0};
	var getIt = function(err,count){
		statisticalJSON.count = count;
		self.insert(statisticalJSON,logDate,next);
	}
	var q = keystone.list("InnLog").model.find().where("timeStamp").gte(firstDate).where("timeStamp").lt(lastDate).where("logType","MgrErr").count(getIt);
}

/////////////////////////////////////
//以下内容为阶段统计功能
//by 2014 10/13
var dailyDistribution = function(sType,logDate,statisticalManager,next){
	var self = statisticalManager;
	async.waterfall([
		function(cb){
			self.getBaseDistribution_innLevel(sType,logDate,cb);
		},
		function(cb){
			console.log("getBaseDistribution_innLevel over");
			self.getBaseDistribution_advCount(sType,logDate,cb);	
		},
		function(cb){
			console.log("getBaseDistribution_advCount over");
			self.getBaseDistribution_questCount(sType,logDate,cb);
		},
		function(cb){
			console.log("getBaseDistribution_questCount over");
			self.getBaseDistribution_taskCount(sType,logDate,cb);
		},
		function(cb){
			console.log("getBaseDistribution_taskCount over");
			self.getBaseDistribution_tutorialCount(sType,logDate,cb);		
		},
		function(cb){
			console.log("getBaseDistribution_tutorialCount");
			self.getBaseDistribution_errorTypeCount(sType,logDate,cb);
		},
		function(cb){
			console.log("getBaseDistribution_errorTypeCount");
			self.getBaseDistribution_dailyGameTimeCount(sType,logDate,cb);
		},
		// function(cb){
		// 	console.log("getBaseDistribution_dailyGameTimeCount");
		// 	self.getBaseDistribution_dailyGameTimeDis(sType,logDate,cb);
		// },
		// function(cb){
		// 	console.log("getBaseDistribution_dailyGameTimeDis");
		// 	self.getBaseDistribution_paycontentCount(sType,logDate,cb);
		// },
		// function(cb){
		// 	console.log("getBaseDistribution_paycontentCount");
		// 	self.getBaseDistribution_GemBuySubCount(sType,logDate,cb);
		// },
		// function(cb){
		// 	console.log("getBaseDistribution_GemBuySubCount");
		// 	self.getBaseDistribution_pvpInformation(sType,logDate,cb);
		// },
		function(cb){
			console.log("getBaseDistribution_pvpInformation");
			self.getBaseDistribution_odysseyInformation(sType,logDate,cb);
		},
		function(cb){
			console.log("getBaseDistribution_odysseyInformation");
			self.getBaseDistribution_GetLastQuest(sType,logDate,cb);
		},
		function(cb){
			console.log("getBaseDistribution_GetLastQuest");
			self.getBaseDistribution_GetClientLog(sType,logDate,cb);
		},
		// function(cb){
		// 	self.getBaseDistribution_getGemContent(sType,logDate,cb);
		// 	console.log("over Gemonsumed");
		// },
		function(cb){
			self.getBaseDistribution_GetMapOfCountry(sType,logDate,cb);
			console.log("getBaseDistribution_GetMapOfCountry");
		}
		],function(err){
		if(err) console.log(new Date() + "dailyStatistical has error");
		console.log("getBaseDistribution_GetClientLog over");
		next(null);
	});
}
statisticalManager.prototype.LinshiFunction_GetGem=function(sType,logDate,next){
	var self = this;
	async.waterfall([
		function(cb){
			self.deleteCurrentStatistical(sType,logDate,cb);
			console.log("deleteCurrentStatistical");
		}
		],function(err){
			console.log("toturials over");
			if (err) {
				console.error(err);
				console.error(JSON.stringify(err));
			};
			var statisticalJSONs = [];
			next();
			//self.gameLog(statisticalJSONs,self.statisticallist.length-1,sType,logDate,next);
			console.log("over phaseStatistical");
	});
}
statisticalManager.prototype.deleteCurrentStatistical=function(sType,logDate,next){
	    var statisticalJSON =  {firstDate:0,lastDate:0,sType:"0",count:0,tType:0}; 
		if(sType!="daily")
		{
			next();
			return;
		}
		this.getFirstAndLastDate(statisticalJSON,sType,logDate);
		switch(sType){
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
		keystone.list("Statistical").model.find({firstDate:statisticalJSON.firstDate,lastDate:statisticalJSON.lastDate}).remove(function(){
			next();
		});
}
statisticalManager.prototype.updateAdvCurrent=function(sType,logDate,next){
	    var statisticalJSON =  {firstDate:0,lastDate:0,sType:"0",count:0,tType:0}; 
	    var self = this;
		if(sType!="daily")
		{
			next();
			return;
		}
		this.getFirstAndLastDate(statisticalJSON,sType,logDate);
		switch(sType){
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
		async.waterfall([
			function(cb){
				keystone.list("ConsumptionAdvSummon").model.find({timeStamp:{$gte:statisticalJSON.firstDate,$lt:statisticalJSON.lastDate}}).remove(function(err){
					cb();
				})
			},
			function(cb){
				var sql = {logType:_config.logType.advSummon,timeStamp:{$gte:statisticalJSON.firstDate,$lt:statisticalJSON.lastDate}};
				var doIt =function(arrary,thenext){
					if(arrary.length==0){
						thenext();
						return;
					}
					var handleIt = function(i,callback){
						var parm = arrary[i];
						var arrMsg= parm.message.split(",");
						var advsummon = {timeStamp:parm.timeStamp,uid:parm.uid,gem:parseInt(parm.gembuy)+parseInt(parm.gemother),instId:arrMsg[0],typeId:arrMsg[1],advType:arrMsg[2],cost:arrMsg[4]};
						var conAdv = keystone.list("ConsumptionAdvSummon");
						var advs = new conAdv.model(advsummon);
						advs.save(function(err){
							if(err){
								console.error(new Date()+err);
							}
							if(--i<0)
								callback();		
							else
								handleIt(i,callback);
						});
					};
					handleIt(arrary.length-1,function(){
						thenext();
					});
				};
				self.selectByStream(sql,doIt,function(){cb();});
			},
			function(cb){
				cb();
				return;
				var sql={logType:_config.logType.statistical,timeStamp:{$gte:statisticalJSON.firstDate,$lt:statisticalJSON.lastDate}};
				var doit = function(arrary,thenext){
					if(arrary.length==0)
					{
						thenext();
						return;
					}
					console.log("arrary.length:%s",arrary.length);
					async.waterfall([
						function(cb){
							var removeuids=[];
							_.each(arrary,function(parm){
								removeuids.push(parm.uid);
							})
							keystone.list("Adventurer").model.find({uid:{$in:removeuids}}).remove(function(err){
								if(err)
									{winston.debug("adv remove error"+err),thenext();return;}
								winston.info("remove users adv ,%s",arrary.length);
								cb();
							});
						},
						function(cb){
							winston.info("begin insert adv");
							var i=-1;
							async.whilst(
								function(){return i<arrary.length},
								function(callback)
								{
									i++;
								 try{
									var parm=arrary[i];
									winston.info("handleIt parm:%s",JSON.stringify(parm));
									var arrStr = {};

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
										winston.info("#InnLog save event#statistical add error, %s,the message:%s",err,JSON.stringify(parm));
										callback();
										return;
									}

									parm.innLevel = arrStr.tavernlevel;
									
									//console.log(typeof arrStr);
									var advs = [];
									if(arrStr.advs)
										advs = arrStr.advs;

									if (advs.length==0) {
										console.error("statictical message is null,the message:%s",parm.message);
										callback();
										return;
									};	
									_.each(advs,function(advParm){
										winston.info("will insert adv :%s",JSON.stringify(advParm));
										var theAdv = keystone.list("Adventurer");
										var advObj = new theAdv.model(advParm);
										if(advObj)
											{
												advObj.save(function(err){
													if(err)
														winston.info("there has error on insert adv,%s",err);
													winston.info("success insert a adv");
												});
											}
									});
									callback();
																	
								},
								function(err){
									winston.info("will bulk.execute");
									cb();
								}
								);							

							
						}
						],function(err){
							thenext();
					});
	
				};
				self.selectByStream(sql,doit,function(){cb()});
			}
			],function(err){
				next();
		});	
}
statisticalManager.prototype.phaseStatistical=function(sType,logDate,next){
	var self = this;
	async.waterfall([
		// function(cb){
		// 	self.Gemonsumed(sType,logDate,cb);
		// 	console.log("updateBuyGemOther over");
		// },
		function(cb){
			self.AllUserCount(sType,logDate,cb);
			console.log("begein phaseStatistical");
		},
		function(cb){
			self.registerUser(sType,logDate,cb);
			console.log("AllUserCount over");
		},
		// function(cb){
		// 	self.logonUserRD(sType,logDate,cb);
		// 	console.log("registerUser over");
		// },
		function(cb){
			self.logonUserAvg(sType,logDate,cb);
			console.log("logonUserRD over");
		},
		// function(cb){
		// 	self.logonUserWithoutRD(sType,logDate,cb);
		// 	console.log("logonUserAvg over");
		// },
		function(cb){
			self.DWM_AU(sType,logDate,cb);
			console.log("logonUserWithoutRD over");
		},
		function(cb){
			self.avgOnline(sType,logDate,cb);
			console.log("DWM_AU over");
		 },
		function(cb){
			self.lossUserCount(sType,logDate,cb);
			console.log("Gemonsumed over");
		},
		function(cb){
			self.allPayUsers(sType,logDate,cb);
			console.log("lossUserCount over");
		},
		function(cb){
			self.payUsers(sType,logDate,cb);
			console.log("allPayUsers over");
		},
		function(cb){
			self.income(sType,logDate,cb);
			console.log("payUsers over");
		},
		function(cb){
			self.perPayofUsers(sType,logDate,cb);
			console.log("income over");
		},
		function(cb){
			self.perPayofActiveUsers(sType,logDate,cb);
			console.log("perPayofUsers over");
		},
		function(cb){
			self.payDegree(sType,logDate,cb);
			console.log("perPayofActiveUsers over");
		},
		function(cb){
			self.payDegreeAvg(sType,logDate,cb);
			console.log("payDegree over");
		},
		function(cb){
			self.conversion(sType,logDate,cb);
			console.log("payDegreeAvg over");
		},
		function(cb){
			self.newUserConversion(sType,logDate,cb);
			console.log("conversion over");
		},
		function(cb){
			self.ARPU(sType,logDate,cb);
			console.log("newUserConversion over");
		},
		function(cb){
			self.ARPPU(sType,logDate,cb);
			console.log("ARPU over");
		},
		function(cb){
			self.fullConversion(sType,logDate,cb);
			console.log("ARPPU over");
		},
		function(cb){
			self.pvpInformation(sType,logDate,cb);
			console.log("fullConversion over");
		},
		function(cb){
			var IsGetErrorLog = keystone.get("GetErrorLog");
			console.log("pvpInformation over");
			if (IsGetErrorLog) {
				var gem =new gameErrorManager();
				gem.phaseAdd(sType,logDate,cb);
			}
			else
				cb(null);
		},
		function(cb){
			console.log("gameErrorManager over");
			if(sType == "daily")
				dailyDistribution(sType,logDate,self,cb);
			else
				cb(null);
		}
		// function(cb){
		// 	console.log("gameLog");
		// 	var statisticalJSONs = [];
		// 	self.gameLog(statisticalJSONs,self.statisticallist.length-1,sType,logDate,cb);			
		// }
		],function(err){
			console.log("toturials over");
			if (err) {
				console.error(err);
				console.error(JSON.stringify(err));
			};
			console.log("over phaseStatistical");
			next();
	});
}

//阶段统计注册用户
//day
statisticalManager.prototype.dailyStatistical = function(logDate,next){
	var sType = "daily";
	winston.info("#manager#statistical#dailyStatistical");
	this.phaseStatistical(sType,logDate,next);
}
//week
statisticalManager.prototype.weeklyStatistical = function(logDate,next){
	//logDate需要求上一周的
	//写法和daily一些样
	var sType="weekly";
	this.phaseStatistical(sType,logDate,next);
}
//month
statisticalManager.prototype.monthlyStatistical = function(logDate,next){
	//logDate需要求上一个月的
	var sType="monthly";
	
	this.phaseStatistical(sType,logDate,next);
}

//临时方法，解决目前buyGemOther不全的问题
statisticalManager.prototype.updateBuyGemOther = function(sType,logDate,next){
        var statisticalJSON =  {firstDate:0,lastDate:0,sType:"0",count:0,tType:0}; 
        var self = this;
		if(sType!="daily")
		{
			next();
			return;
		}
		this.getFirstAndLastDate(statisticalJSON,sType,logDate);
		switch(sType){
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
		var taskObj = {"11200013":50,
						"11200014":50,
						"11200015":50,
						"11200016":50,
						"11200017":50,
						"11200018":50,
						"11200019":50,
						"11200020":50,
						"11200021":10,
						"11200022":10,
						"11200023":10,
						"11200024":10,
						"11200025":10,
						"11200026":10,
						"11200027":10,
						"11200028":10,
						"11200029":10,
						"11200030":10,
						"11200031":10,
						"11200032":10,
						"11200033":10,
						"11200034":10,
						"11200035":10,
						"11200036":10,
						"11200037":10,
						"11200038":10,
						"11200039":10,
						"11200040":10,
						"11200041":10,
						"11200042":10,
						"11200043":10,
						"11200044":10,
						"11200045":10,
						"11200046":10,
						"11200047":10,
						"11200048":10,
						"11200049":10,
						"11200050":10,
						"11200051":10,
						"11200052":10,
						"11200053":10,
						"11200054":10,
						"11200055":10,
						"11200056":10,
						"11200057":10,
						"11200058":10,
						"11200059":10,
						"11200060":10,
						"11200061":10,
						"11200062":10,
						"11200063":10,
						"11200064":10,
						"11200065":10,
						"11200066":10,
						"11200067":10,
						"11200068":10,
						"11200069":10,
						"11200070":10,
						"11200071":10,
						"11200072":10,
						"11200073":10,
						"11200074":10,
						"11200075":10,
						"11200076":10,
						"11200077":10,
						"11200078":10,
						"11200079":10,
						"11200080":10,
						"11200081":10,
						"11200082":10,
						"11200083":10,
						"11200084":10,
						"11200085":10,
						"11200086":10,
						"11200087":10,
						"11200088":10,
						"11200089":10,
						"11200090":10,
						"11200091":10,
						"11200092":10,
						"11200093":10,
						"11200094":10,
						"11200095":10,
						"11200096":10,
						"11200097":10,
						"11200098":10,
						"11200099":10,
						"11200100":10,
						"11100000":50,
						"11100001":100,
						"11100002":150,
						"11100003":100,
						"11100004":200,
						"11100005":200,
						"11100006":50,
						"11100007":50,
						"11100008":50,
						"11100009":100,
						"11100010":100,
						"11100011":200,
						"11100012":200,
						"11100013":10,
						"11100014":20,
						"11100015":50,
						"11100016":50,
						"11100017":100,
						"11100018":100,
						"11100019":10,
						"11100020":20,
						"11100021":50,
						"11100022":50,
						"11100023":100,
						"11100024":100,
						"11100025":20,
						"11100026":20,
						"11100027":50,
						"11100028":50,
						"11100029":100,
						"11100030":100,
						"11100031":200,
						"11100032":10,
						"11100033":20,
						"11100034":30,
						"11100035":50,
						"11100036":50,
						"11100037":100,
						"11100038":200,
						"11100039":300,
						"11100040":10,
						"11100041":10,
						"11100042":10,
						"11100043":20,
						"11100044":50,
						"11100045":50,
						"11100046":100,
						"11100047":100,
						"11100048":200,
						"11100049":200};
		var getIt = function(results,cb){
			// if(err)
			// {
			// 	winston.info("updateBuyGemOther error ,%s",err);
			// }
			//这里有问题的话，化成async方法来foreach
			async.eachSeries(results,function(parm,callback){
				parm.subType="getgem";
				parm.R1=0;
				var arrMsg=parm.message.split(",");
				//winston.debug("get InnLog for update BuyGemOther:%s",JSON.stringify(parm));
				switch(parm.logType)
				{
					case "MailTake":
						var arrCost=arrMsg[3].split("-");
						for(var i=0;i<arrCost.length;i++){
							if(arrCost[i].indexOf("4000_")!=-1)
							{
								 var arrThisCost = arrCost[i].split("_");
								 parm.R1=parseInt(parm.R1)+parseInt(arrThisCost[1]);
							}
						}
						//winston.debug("the MailTake R1:%d",parm.R1);
					break;
					case "TaskTakeRW":
						if(taskObj[arrMsg[0]])
							parm.R1=parseInt(taskObj[arrMsg[0]]);
						//winston.debug("the TakeRw %d",parm.R1);
					break;
					case "Register":
						parm.R1=parseInt( parm.gemother);
						//winston.debug("the Rgister R1:%d",parm.R1);
					break;
					default:
					break;
				}
				parm.R1 =parm.R1+"";

				parm.save(function(err){
					callback(err);
				});
			},function(err){
				if(err)
					winston.debug("updateBuyGemOther error 2:%s",err);
				cb();
			});
		}
		self.selectByStream({timeStamp:{$gte:statisticalJSON.firstDate,$lt:statisticalJSON.lastDate},logType:{$in:["MailTake","TaskTakeRW","Register"]}},getIt,next);
		//keystone.list("InnLog").model.find({timeStamp:{$gte:statisticalJSON.firstDate,$lt:statisticalJSON.lastDate},logType:{$in:["MailTake","TaskTakeRW","Register"]}}).exec(getIt);
}
statisticalManager.prototype.AllUserCount = function(sType,logDate,next){
	var statisticalJSON = this.initStatisticalJSON(sType,logDate,"101");
	var self = this;
	var cb = function(err,result){
		var count = result;

		statisticalJSON.count=count;
		self.cache.allUserCount = count;
		self.insert(statisticalJSON,logDate,next);
	}
	var q = keystone.list("InnLog").model.find({logType:"Register",timeStamp:{$lt:statisticalJSON.lastDate}}).count(cb);
}
//阶段统计新增注册用户
statisticalManager.prototype.registerUser = function(sType,logDate,next){
	var statisticalJSON = this.initStatisticalJSON(sType,logDate,"102");
	var self = this;
	var cb = function(err,count){
		if (err) {
			console.error("registerUser error!"+JSON.stringify(statisticalJSON));
			return;
		};
		statisticalJSON.count = count;
		self.cache.registerUserCount = statisticalJSON.count;
		self.insert(statisticalJSON,logDate,next);
	}
	var q = keystone.list("InnLog").model.find().where('timeStamp').gte(statisticalJSON.firstDate).where("timeStamp").lt(statisticalJSON.lastDate).where('logType','Register').count(cb);
	
}
//用户登录次数 去重
statisticalManager.prototype.logonUserRD = function(sType,logDate,next){
	var statisticalJSON = {firstDate:0,lastDate:0,sType:"0",count:0,tType:0}; 
	var self = this;
	this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	switch(sType){
		case "daily":
			statisticalJSON.sType="103";
			statisticalJSON.tType=1;
		break;
		case "weekly":
			statisticalJSON.sType="103";
			statisticalJSON.tType=2;
		break;
		case "monthly":
			statisticalJSON.sType="103";
			statisticalJSON.tType=3;
		break;
		default:
		break; 
	}
	var cb = function(err,result){
		var count = result.length;
		if (err) {
			console.error("logonUserRD error!"+JSON.stringify(statisticalJSON));
			return;
		};
		statisticalJSON.count = count;
		self.insert(statisticalJSON,logDate,next);
	}
	var q = keystone.list("InnLog").model.find().where('timeStamp').gte(statisticalJSON.firstDate).where("timeStamp").lt(statisticalJSON.lastDate).where('logType','LogOn').distinct('uid').exec(cb);
}
//用户登录次数 不去重
statisticalManager.prototype.logonUserWithoutRD = function(sType,logDate,next){
	var statisticalJSON = {firstDate:0,lastDate:0,sType:"0",count:0,tType:0}; 
	var self = this;
	this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	switch(sType){
		case "daily":
			statisticalJSON.sType="104";
			statisticalJSON.tType=1;
		break;
		case "weekly":
			statisticalJSON.sType="104";
			statisticalJSON.tType=2;
		break;
		case "monthly":
			statisticalJSON.sType="104";
			statisticalJSON.tType=3;
		break;
		default:
		break; 
	}
	var cb = function(err,count){
		if (err) {
			console.error("logonUserWithoutRD error!"+JSON.stringify(statisticalJSON));
			return;
		};
		statisticalJSON.count = count;
		self.insert(statisticalJSON,logDate,next);	
	}
	var q = keystone.list("InnLog").model.find().where('timeStamp').gte(statisticalJSON.firstDate).where("timeStamp").lt(statisticalJSON.lastDate).where('logType','LogOn').count(cb);
	
}
//用户登录次数 平均值
statisticalManager.prototype.logonUserAvg = function(sType,logDate,next){
	var statisticalJSON = {firstDate:0,lastDate:0,sType:"0",count:0,tType:0}; 
	var self = this;
	this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	switch(sType){
		case "daily":
			statisticalJSON.sType="105";
			statisticalJSON.tType=1;
		break;
		case "weekly":
			statisticalJSON.sType="105";
			statisticalJSON.tType=2;
		break;
		case "monthly":
			statisticalJSON.sType="105";
			statisticalJSON.tType=3;
		break;
		default:
		break; 
	}
	var avg ={_id:"$uid",count:{$sum:1}};
	var q = keystone.list("InnLog").model.aggregate([{$match:{timeStamp:{$gte:statisticalJSON.firstDate,$lt:statisticalJSON.lastDate},logType:'LogOn'}},
		{$group:{_id:"$uid",count:{$sum:1}}},
		{$group:{_id:null,avg:{$avg:"$count"}}}]).exec(function(err,result){
			if (err) {
				console.error("logonUserAvg error 2 !"+JSON.stringify(statisticalJSON));
				return;
			};
			if(isNaN(result[0]))
			{
				result[0] = 0;
							}
			statisticalJSON.count = result[0];
			self.insert(statisticalJSON,logDate,next);		
		});
	// var q = keystone.list("InnLog").model.aggregate.match({timeStamp:{$gte:statisticalJSON.firstDate,$lt:statisticalJSON.lastDate},logType:'LogOn'}).group(avg).group({_id:null,avg:{$avg:"$count"}}).exec(
	// 	function(err,result){

	// 	});

}
//活跃用户
statisticalManager.prototype.DWM_AU = function(sType,logDate,next){
	var statisticalJSON = {firstDate:0,lastDate:0,sType:"0",count:0,tType:0}; 
	var self = this;
	this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	switch(sType){
		case "daily":
			statisticalJSON.sType="106";
			statisticalJSON.tType=1;
		break;
		case "weekly":
			statisticalJSON.sType="106";
			statisticalJSON.tType=2;
		break;
		case "monthly":
			statisticalJSON.sType="106";
			statisticalJSON.tType=3;
		break;
		default:
		break; 
	}
	var cb = function(err,result){
		var count =result.length;
		if (err) {
			console.error("DWM_AU error!"+JSON.stringify(statisticalJSON));
			return;
		};
		statisticalJSON.count = count;
		self.cache.activeUserCount = count;
		self.insert(statisticalJSON,logDate,next);
	}
	var q = keystone.list("InnLog").model.find().where('timeStamp').gte(statisticalJSON.firstDate).where("timeStamp").lt(statisticalJSON.lastDate).where('logType','LogTime').where('logtime').gt(self.logTimeBase).where('sessionCount').gt(self.sessionCountBase).distinct('uid').exec(cb);
} 
//平均在线
statisticalManager.prototype.avgOnline = function(sType,logDate,next){
	var statisticalJSON = {firstDate:0,lastDate:0,sType:"0",count:0,tType:0}; 
	var self = this;
	this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	switch(sType){
		case "daily":
			statisticalJSON.sType="108";
			statisticalJSON.tType=1;
		break;
		case "weekly":
			statisticalJSON.sType="108";
			statisticalJSON.tType=2;
		break;
		case "monthly":
			statisticalJSON.sType="108";
			statisticalJSON.tType=3;
		break;
		default:
		break; 
	}
	var cb = function(err,result){  
		var count =result.length;
		if (err) {
			console.error("logonUserRD error!"+JSON.stringify(statisticalJSON));
			return;
		};
		statisticalJSON.count = count;
		self.insert(statisticalJSON,logDate,next);
	}
	var q = keystone.list("InnLog").model.find().where('timeStamp').gte(statisticalJSON.firstDate).where("timeStamp").lt(statisticalJSON.lastDate).where('logType','LogTime').where('logtime').gt(self.logTimeBase).where('sessionCount').gt(self.sessionCountBase).distinct('uid').exec(cb);
}
//流失用户数 目前按周来算
statisticalManager.prototype.lossUserCount = function(sType,logDate,next){
	var statisticalJSON = {firstDate:0,lastDate:0,sType:"0",count:0,tType:0}; 
	var self = this;
	this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	switch(sType){
		case "daily":
			statisticalJSON.sType="109";
			statisticalJSON.tType=1;
		break;
		case "weekly":
			statisticalJSON.sType="109";
			statisticalJSON.tType=2;
		break;
		case "monthly":
			statisticalJSON.sType="109";
			statisticalJSON.tType=3;
		break;
		default:
		break; 
	}
	var p = keystone.list("InnLog_Global").model.find().where("logDate").lt(statisticalJSON.lastDate).where("logDate").gte(statisticalJSON.firstDate).sort({logDate:-1}).limit(1).exec(function(err,result){
		if (err) {
			console.error("lossUserCount error!"+JSON.stringify(statisticalJSON));
			return;
		};
		var fullcount = 0;
		if (result.length>0) {
			fullcount = result[0].userCount;
		}else{
			console.log("1009 result:"+ JSON.stringify(result));
			fullcount = 0;
		}

		//console.log("103 fullCount result:"+JSON.stringify(result));
		var cb = function(err,result){
			var count = result.length;
			if (err) {
				console.error("lossUserCount error!2"+JSON.stringify(statisticalJSON));
				return;
			};
			//console.log(JSON.stringify(result));
			//console.log("fullCount:%s,count:%s,beginDate:%s,endDate:%s",fullcount,count,statisticalJSON.firstDate,statisticalJSON.lastDate);
			statisticalJSON.count = fullcount - count;
			//console.log("103 fullcount:"+fullcount+";count:"+count);
			self.insert(statisticalJSON,logDate,next);
		}
		var q = keystone.list("InnLog").model.find().where('timeStamp').gte(statisticalJSON.firstDate).where("timeStamp").lt(statisticalJSON.lastDate).where('logType','LogTime').where('logtime').gt(self.logTimeBase).where('sessionCount').gt(self.sessionCountBase).distinct('uid').exec(cb);
	});
	
}

statisticalManager.prototype.gameLog = function(statisticalJSONs,i,sType,logDate,next){
	var list = this.statisticallist;
	//console.log(JSON.stringify("i"+i));
	var self = this;
	var value = list[i].value;
	var label = list[i].label;
	var statisticalJSON = {firstDate:0,lastDate:0,sType:value,count:0,tType:0}; 
	this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	statisticalJSON.sType = value;
	switch(sType){
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

	var getCount =function(err,count){  
		if (err) {
			console.log("gameLog error!"+JSON.stringify(statisticalJSON));
			return;
		};
		//console.log("getCount");
		statisticalJSON.count = count;
		if (i==0) {
			self.insert(statisticalJSONs,logDate,next);
		}else{
			statisticalJSONs.push(statisticalJSON);
			//console.log("gameLog i:"+i+",list count:"+list.length+";datetime:"+new Date());
			self.gameLog(statisticalJSONs,--i,sType,logDate,next);
		}
	}
	//console.log("gamelog开始计算");
	var q = keystone.list("InnLog").model.find().where('timeStamp').gte(statisticalJSON.firstDate).where("timeStamp").lt(statisticalJSON.lastDate).where('logType',label).count(getCount);				

}

//Gemonsumed
statisticalManager.prototype.Gemonsumed = function(sType,logDate,next){
	var statisticalJSON = {firstDate:0,lastDate:0,sType:"7",count:0,tType:0}; 
	var self = this;
	this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	switch(sType){
		case "daily":
			statisticalJSON.sType="111";
			statisticalJSON.tType=1;
		break;
		case "weekly":
			statisticalJSON.sType="111";
			statisticalJSON.tType=2;
		break;
		case "monthly":
			statisticalJSON.sType="111";
			statisticalJSON.tType=3;
		break;
		default:
		break; 
	}
	var gembuygetcount = 0;
	var gemothergetcount =0;
	var gemcost =0;
	async.waterfall([
		function(callback){
			var cb = function(err,results){
				if (err) {
					console.error("Gemonsumed is error!"+JSON.stringify(results));
					return;
				};

				var counts = 0;
				_.each(results,function(parm){
					var count = parm.R1;
					if(isNaN(count)){
						console.error("Gemonsumed is error! count isNaN:"+count);
						return;
					}
					counts += parseInt(count);
					var arrMsg=parm.message.split(",");
					winston.debug("foreach the TavernBuyGem ,%s \n the gemOther:%s",JSON.stringify(parm),arrMsg[3]);
					if(!isNaN(arrMsg[3]))
						gemothergetcount += parseInt(arrMsg[3]);
					else if(!isNaN(arrMsg[12]))
						gemothergetcount += parseInt(arrMsg[12]);
					else
						winston.info("error# get gemothergetcount error,parm:%s",JSON.stringify(parm));
				});
				statisticalJSON.count = counts;
				gembuygetcount = counts;
				self.insert(statisticalJSON,logDate,callback);
			}
			var q = keystone.list("InnLog").model.find().where('timeStamp').gte(statisticalJSON.firstDate).where("timeStamp").lt(statisticalJSON.lastDate).where('subType',_config.subType.buygem).select("message R1").exec(cb);	
		},
		function(callback){
			var getGemOther = function(err,results){
				_.each(results,function(parm){
					if(!isNaN(parm.R1))
						gemothergetcount+=parseInt(parm.R1);
					else
						winston.info("gemOthercount get error,the Parm.R1:%s",parm.R1);
				});
				statisticalJSON.count = gemothergetcount+gembuygetcount;
				statisticalJSON.sType="169";
				self.insert(statisticalJSON,logDate,callback);
			}
			keystone.list("InnLog").model.find({subType:"getgem",timeStamp:{$gte:statisticalJSON.firstDate,$lt:statisticalJSON.lastDate}}).select("R1").exec(getGemOther);
		},
		function(callback){
			var getGemCost = function(err,results){
				_.each(results,function(parm){
					gemcost += parseInt(parm.R1);
				});
				statisticalJSON.count=gemcost;
				statisticalJSON.sType="170";
				self.insert(statisticalJSON,logDate,callback);
			}
			keystone.list("InnLog").model.find({subType:"paid",timeStamp:{$gte:statisticalJSON.firstDate,$lt:statisticalJSON.lastDate}}).select("R1").exec(getGemCost);
		}
		],function(err,results){
			next();
	});

}
statisticalManager.prototype.allPayUsers = function(sType,logDate,next){
	var statisticalJSON = {firstDate:0,lastDate:0,sType:"0",count:0,tType:0}; 
	var self = this;
	this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	switch(sType){
		case "daily":
			statisticalJSON.sType="123";
			statisticalJSON.tType=1;
		break;
		case "weekly":
			statisticalJSON.sType="123";
			statisticalJSON.tType=2;
			
		break;
		case "monthly":
			statisticalJSON.sType="123";
			statisticalJSON.tType=3;
		break;
		default:
		break; 
	}
	var cb = function(err,results){
		var count = results.length;
		if (err) {
			console.error("PayUsers is error!"+JSON.stringify(results));
			return;
		};
		statisticalJSON.count = count || 0;
		self.cache.allpayUserCount = statisticalJSON.count;
		self.insert(statisticalJSON,logDate,next);
	}
	var q = keystone.list("InnLog").model.find({timeStamp:{$gte:statisticalJSON.firstDate,$lt:statisticalJSON.lastDate}}).where('subType',_config.subType.buygem).distinct("uid").exec(cb);
}
statisticalManager.prototype.payUsers = function(sType,logDate,next){
	var statisticalJSON = {firstDate:0,lastDate:0,sType:"0",count:0,tType:0}; 
	var self = this;
	this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	switch(sType){
		case "daily":
			statisticalJSON.sType="112";
			statisticalJSON.tType=1;
		break;
		case "weekly":
			statisticalJSON.sType="112";
			statisticalJSON.tType=2;
			
		break;
		case "monthly":
			statisticalJSON.sType="112";
			statisticalJSON.tType=3;
		break;
		default:
		break; 
	}
	var cb = function(err,results){
		var count = results.length;
		if (err) {
			console.error("PayUsers is error!"+JSON.stringify(results));
			return;
		};
		statisticalJSON.count = count || 0;
		self.cache.payUserCount = statisticalJSON.count;
		console.log("payuserCount:%s,firstDate:%s,lastDate:%s",self.cache.payUserCount,statisticalJSON.firstDate,statisticalJSON.lastDate);
		self.insert(statisticalJSON,logDate,next);
	}
	var q = keystone.list("InnLog").model.find().where('subType',_config.subType.buygem).where('timeStamp').gte(statisticalJSON.firstDate).where("timeStamp").lt(statisticalJSON.lastDate).distinct("uid").exec(cb);
}
//需要使用cache
statisticalManager.prototype.perPayofUsers = function(sType,logDate,next){
	var statisticalJSON = {firstDate:0,lastDate:0,sType:"0",count:0,tType:0}; 
	var self = this;
	this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	switch(sType){
		case "daily":
			statisticalJSON.sType="113";
			statisticalJSON.tType=1;
		break;
		case "weekly":
			statisticalJSON.sType="113";
			statisticalJSON.tType=2;
		break;
		case "monthly":
			statisticalJSON.sType="113";
			statisticalJSON.tType=3;
		break;
		default:
		break; 
	}
	var allUsers = self.cache.allUserCount || 0;
	var payUsers = self.cache.allpayUserCount || 0;
	var results =0;
	if (allUsers!=0) {
		results = payUsers/allUsers*100;
	}else
		results =0;
	statisticalJSON.count = results;
	self.insert(statisticalJSON,logDate,next);
}
//需要使用cache
statisticalManager.prototype.perPayofActiveUsers = function(sType,logDate,next){
	var statisticalJSON = {firstDate:0,lastDate:0,sType:"0",count:0,tType:0}; 
	var self = this;
	this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	switch(sType){
		case "daily":
			statisticalJSON.sType="114";
			statisticalJSON.tType=1;
		break;
		case "weekly":
			statisticalJSON.sType="114";
			statisticalJSON.tType=2;
		break;
		case "monthly":
			statisticalJSON.sType="114";
			statisticalJSON.tType=3;
		break;
		default:
		break; 
	}
	var activeUsers = self.cache.activeUserCount || 0;
	var payUsers = self.cache.payUserCount || 0;
	var results =0;
	if (activeUsers!=0) {
		results = payUsers/activeUsers*100;
	}
	statisticalJSON.count=results;
	self.insert(statisticalJSON,logDate,next);
}
statisticalManager.prototype.payDegree = function(sType,logDate,next){
	var statisticalJSON = {firstDate:0,lastDate:0,sType:"0",count:0,tType:0}; 
	var self = this;
	this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	switch(sType){
		case "daily":
			statisticalJSON.sType="115";
			statisticalJSON.tType=1;
		break;
		case "weekly":
			statisticalJSON.sType="115";
			statisticalJSON.tType=2;
		break;
		case "monthly":
			statisticalJSON.sType="115";
			statisticalJSON.tType=3;
		break;
		default:
		break; 
	}
	var cb = function(err,count){
		if (err) {
			console.error("payDegree is error!"+JSON.stringify(count));
			return;
		};
		statisticalJSON.count = count || 0;
		self.cache.payDegree = statisticalJSON.count;
		self.insert(statisticalJSON,logDate,next);
	}
	var q = keystone.list("InnLog").model.find().where('subType',_config.subType.buygem).where('timeStamp').gte(statisticalJSON.firstDate).where("timeStamp").lt(statisticalJSON.lastDate).count(cb);	
}
statisticalManager.prototype.payDegreeAvg= function(sType,logDate,next){
	var statisticalJSON = {firstDate:0,lastDate:0,sType:"0",count:0,tType:0}; 
	var self = this;
	this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	switch(sType){
		case "daily":
			statisticalJSON.sType="116";
			statisticalJSON.tType=1;
		break;
		case "weekly":
			statisticalJSON.sType="116";
			statisticalJSON.tType=2;
		break;
		case "monthly":
			statisticalJSON.sType="116";
			statisticalJSON.tType=3;
		break;
		default:
		break; 
	}	
	var payUsers = self.cache.payUserCount || 0;
	var payDegree = self.cache.payDegree || 0;
	var results =0;
	if (payUsers) {
		results = payDegree/payUsers;
	};	
	statisticalJSON.count = results;
	self.insert(statisticalJSON,logDate,next);
}
// 目前意义与Gemonsumed方法重合，先不用
statisticalManager.prototype.income = function(sType,logDate,next){
	next();
	// var statisticalJSON = {firstDate:0,lastDate:0,sType:"0",count:0,tType:0}; 
	// var self = this;
	// this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	// switch(sType){
	// 	case "daily":
	// 		statisticalJSON.sType="117";
	// 		statisticalJSON.tType=1;
	// 	break;
	// 	case "weekly":
	// 		statisticalJSON.sType="117";
	// 		statisticalJSON.tType=2;
	// 	break;
	// 	case "monthly":
	// 		statisticalJSON.sType="117";
	// 		statisticalJSON.tType=3;
	// 	break;
	// 	default:
	// 	break; 
	// }
	// var cb = function(err,result){
	// 	if (err) {
	// 		console.error("income is error!"+JSON.stringify(results));
	// 		return;
	// 	};
	// 	var income = 0;
	// 	_.each(result,function(parm){
	// 		var arrMsg = parm.message.split(",");
	// 		income+= parseInt(arrMsg[10]) + parseInt(arrMsg[11]);
	// 	});
	// 	statisticalJSON.count = income;
	// 	self.cache.income = income;
	// 	console.log("income:%s",self.cache.income);
	// 	self.insert(statisticalJSON,logDate,next);
	// }
	// var q = keystone.list("InnLog").model.find().where('subType',_config.subType.buygem).where('timeStamp').gte(statisticalJSON.firstDate).where("timeStamp").lt(statisticalJSON.lastDate).select("uid message").exec(cb);
}
//未完成，收入没法计算
statisticalManager.prototype.ARPU = function(sType,logDate,next){
	var statisticalJSON = {firstDate:0,lastDate:0,sType:"0",count:0,tType:0}; 
	var self = this;
	this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	switch(sType){
		case "daily":
			statisticalJSON.sType="118";
			statisticalJSON.tType=1;
		break;
		case "weekly":
			statisticalJSON.sType="118";
			statisticalJSON.tType=2;
		break;
		case "monthly":
			statisticalJSON.sType="118";
			statisticalJSON.tType=3;
		break;
		default:
		break; 
	}	
	var income = self.cache.income || 0;
	var actUser = self.cache.activeUserCount || 0;
	var result = 0;
	if(actUser!=0)
		result = income/actUser;
	statisticalJSON.count = result;
	self.insert(statisticalJSON,logDate,next);

}
//未完成，收入没法计算
statisticalManager.prototype.ARPPU = function(sType,logDate,next){
	var statisticalJSON = {firstDate:0,lastDate:0,sType:"0",count:0,tType:0}; 
	var self = this;
	this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	switch(sType){
		case "daily":
			statisticalJSON.sType="119";
			statisticalJSON.tType=1;
		break;
		case "weekly":
			statisticalJSON.sType="119";
			statisticalJSON.tType=2;
		break;
		case "monthly":
			statisticalJSON.sType="119";
			statisticalJSON.tType=3;
		break;
		default:
		break; 
	}	
	var income = self.cache.income || 0;
	var payUser = self.cache.payUserCount || 0;
	var result = 0;
	if(payUser!=0)
		result = income/payUser*100;
	statisticalJSON.count = result;
	console.log("ARPPU:%s",result);
	self.insert(statisticalJSON,logDate,next);

}
statisticalManager.prototype.conversion = function(sType,logDate,next){
	var statisticalJSON = {firstDate:0,lastDate:0,sType:"0",count:0,tType:0}; 
	var self = this;
	this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	switch(sType){
		case "daily":
			statisticalJSON.sType="120";
			statisticalJSON.tType=1;
		break;
		case "weekly":
			statisticalJSON.sType="120";
			statisticalJSON.tType=2;
		break;
		case "monthly":
			statisticalJSON.sType="120";
			statisticalJSON.tType=3;
		break;
		default:
		break; 
	}		
	var payUser = self.cache.payUserCount || 0;
	var actUser = self.cache.activeUserCount || 0;
	var result=0;
	if (payUser!=0) {
		result=payUser/actUser*100;
	};
	statisticalJSON.count = result;
	self.insert(statisticalJSON,logDate,next);
}
//目前没有需要这个功能的显示
statisticalManager.prototype.fullConversion = function(sType,logDate,next){
	var statisticalJSON = {firstDate:0,lastDate:0,sType:"0",count:0,tType:0}; 
	var self = this;
	this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	switch(sType){
		case "daily":
			statisticalJSON.sType="121";
			statisticalJSON.tType=1;
		break;
		case "weekly":
			statisticalJSON.sType="121";
			statisticalJSON.tType=2;
		break;
		case "monthly":
			statisticalJSON.sType="121";
			statisticalJSON.tType=3;
		break;
		default:
		break; 
	}		
	var allUsers = self.cache.allUserCount || 0;
	var allpayusers = self.cache.allpayUserCount || 0;
	var result=0;
	if(allUsers)
	   result = allpayusers/allUsers*100;
	statisticalJSON.count = result;
	self.insert(statisticalJSON,logDate,next);		
	
	// var q = keystone.list("InnLog").model.find({logType:"TavernBuyGem"}).where("timeStamp").lt(statisticalJSON.lastDate).distinct("uid").exec(cb);
}
statisticalManager.prototype.newUserConversion = function(sType,logDate,next){
	var statisticalJSON = {firstDate:0,lastDate:0,sType:"0",count:0,tType:0}; 
	var self = this;
	this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	switch(sType){
		case "daily":
			statisticalJSON.sType="122";
			statisticalJSON.tType=1;
		break;
		case "weekly":
			statisticalJSON.sType="122";
			statisticalJSON.tType=2;
		break;
		case "monthly":
			statisticalJSON.sType="122";
			statisticalJSON.tType=3;
		break;
		default:
		break; 
	}		
	var payUser = self.cache.payUserCount || 0;
	var registerUser = self.cache.registerCount || 0;
	var result = 0;
	if(registerUser!=0){
		result = payUser/registerUser*100;
	}
	statisticalJSON.count = result;
	self.insert(statisticalJSON,logDate,next);
}
statisticalManager.prototype.pvpInformation = function(sType,logDate,next){
		var statisticalJSON = {firstDate:0,lastDate:0,sType:"0",count:0,tType:0}; 
	var self = this;
	this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	switch(sType){
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
	var getIt = function(err,count){
		if(err){
			console.error("pvpInformation error");
			console.error(new Date()+err);
		}
		statisticalJSON.sType="159";
		statisticalJSON.count = count;
		self.insert(statisticalJSON,logDate,function(){
			var getAvg=function(err,results){
				var count = results.length;
				var result = 0;
				if(count!=0)
					result = statisticalJSON.count / count;
				statisticalJSON.count = result;
				statisticalJSON.sType="160";
				self.insert(statisticalJSON,logDate,next);
			}
			var q2 = keystone.list("InnLog").model.find({logType:{$in:["PvP","BePvP"]}}).where("timeStamp").lt(statisticalJSON.lastDate).where("timeStamp").gte(statisticalJSON.firstDate).distinct("uid").exec(getAvg);
		});
	}
	var q = keystone.list("InnLog").model.find({logType:"PvP"}).where("timeStamp").lt(statisticalJSON.lastDate).where("timeStamp").gte(statisticalJSON.firstDate).count(getIt);
}
//获取酒馆等级分布，冒险者数量分布和冒险者详细分布数据
statisticalManager.prototype.getBaseDistribution_innLevel = function(sType,logDate,next){
	var statisticalJSON = {firstDate:0,lastDate:0,sType:"0",countObj:"",tType:0};
	var self = this;
	this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	switch(sType){
		case "daily":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=1;
		break;
		case "weekly":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=2;
		break;
		case "monthly":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=3;
		break;
		default:
		break; 
	}
	var getIt = function(err,results){
        var dis =[];
        for (var i = results.length - 1; i >= 0; i--) {
        	dis.push(results[i].innLevel);
        };
		statisticalJSON.countObj=getGroupAndSum(dis);
		statisticalJSON.sType ="124";
		self.insert(statisticalJSON,logDate,next);
	};
	var q = keystone.list("InnLog").model.aggregate([
		{$match:{logType:"Statistical",timeStamp:{$gte:statisticalJSON.firstDate,$lt:statisticalJSON.lastDate}}},
		{$group:{_id:"$uid",innLevel:{$max:"$innLevel"}}}
		]).exec(getIt);	
}
//冒险者等级，  
//缺少  普通、传奇，星级，进阶等级。
statisticalManager.prototype.getBaseDistribution_advCount = function(sType,logDate,next){
	var statisticalJSON = {firstDate:0,lastDate:0,sType:"0",countObj:"",tType:0};
	var self = this;
	this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	switch(sType){
		case "daily":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=1;
		break;
		case "weekly":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=2;
		break;
		case "monthly":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=3;
		break;
		default:
		break; 
	}

	
	//星级、进阶等级等统计
	////一到五星分别计算的冒险者等级分布
	var getAdv = function(err,results){
		var legends=[],stars=[],equipSets =[],typeids=[],generations=[],starsLegend=[];
		var advLevel1=[],advLevel2=[],advLevel3=[],advLevel4=[],advLevel5=[];
		var legendLevel1=[],legendLevel2=[],legendLevel3=[],legendLevel4=[],legendLevel5=[];
		_.each(results,function(parm){
			legends.push(parm.islegend==true?"isLegend":"notLegend");
			if(parm.islegend==false)
				stars.push(parm.star);
			else if(parm.islegend==true)
				starsLegend.push(parm.star);
			switch(parm.star){
				case 1:advLevel1.push(parm.level);break;
				case 2:advLevel2.push(parm.level);break;
				case 3:advLevel3.push(parm.level);break;
				case 4:advLevel4.push(parm.level);break;
				case 5:advLevel5.push(parm.level);break;
				default:break;
			}
			switch(parm.star){
				case 1:legendLevel1.push(parm.level);break;
				case 2:legendLevel2.push(parm.level);break;
				case 3:legendLevel3.push(parm.level);break;
				case 4:legendLevel4.push(parm.level);break;
				case 5:legendLevel5.push(parm.level);break;
				default:break;				
			}
			equipSets.push(parm.equipSet);
			typeids.push(parm.typeId);
			generations.push(parm.generation);
		});
		console.log("getAdv parameter over");
		async.waterfall([
			function(cb){
				statisticalJSON.sType="126";
				statisticalJSON.countObj = getGroupAndSum(legends);
				self.insert(statisticalJSON,logDate,cb);
			},
			function(cb){
				statisticalJSON.sType="127";
				statisticalJSON.countObj = getGroupAndSum(stars);
				self.insert(statisticalJSON,logDate,cb);
			},
			function(cb){
				statisticalJSON.sType="128";
				statisticalJSON.countObj = getGroupAndSum(equipSets);
				self.insert(statisticalJSON,logDate,cb);
			},
			function(cb){
				statisticalJSON.sType="136";
				statisticalJSON.countObj = getGroupAndSum(advLevel1);
				self.insert(statisticalJSON,logDate,cb);				
			},
			function(cb){
				statisticalJSON.sType="137";
				statisticalJSON.countObj = getGroupAndSum(advLevel2);
				self.insert(statisticalJSON,logDate,cb);				
			},
			function(cb){
				statisticalJSON.sType="138";
				statisticalJSON.countObj = getGroupAndSum(advLevel3);
				self.insert(statisticalJSON,logDate,cb);				
			},
			function(cb){
				statisticalJSON.sType="139";
				statisticalJSON.countObj = getGroupAndSum(advLevel4);
				self.insert(statisticalJSON,logDate,cb);				
			},
			function(cb){
				statisticalJSON.sType="140";
				statisticalJSON.countObj = getGroupAndSum(advLevel5);
				self.insert(statisticalJSON,logDate,cb);				
			},
			function(cb){
				statisticalJSON.sType="141";
				statisticalJSON.countObj = getGroupAndSum(typeids);
				self.insert(statisticalJSON,logDate,cb);
			},
			function(cb){
				statisticalJSON.sType="142";
				statisticalJSON.countObj = getGroupAndSum(generations);
				self.insert(statisticalJSON,logDate,cb);
			},
			function(cb){
				statisticalJSON.sType="151";
				statisticalJSON.countObj = getGroupAndSum(legendLevel1);
				self.insert(statisticalJSON,logDate,cb);				
			},
			function(cb){
				statisticalJSON.sType="152";
				statisticalJSON.countObj = getGroupAndSum(legendLevel2);
				self.insert(statisticalJSON,logDate,cb);				
			},
			function(cb){
				statisticalJSON.sType="153";
				statisticalJSON.countObj = getGroupAndSum(legendLevel3);
				self.insert(statisticalJSON,logDate,cb);				
			},
			function(cb){
				statisticalJSON.sType="154";
				statisticalJSON.countObj = getGroupAndSum(legendLevel4);
				self.insert(statisticalJSON,logDate,cb);				
			},
			function(cb){
				statisticalJSON.sType="155";
				statisticalJSON.countObj = getGroupAndSum(legendLevel5);
				self.insert(statisticalJSON,logDate,cb);				
			},
			function(cb){
				statisticalJSON.sType="156";
				statisticalJSON.countObj = getGroupAndSum(starsLegend);
				self.insert(statisticalJSON,logDate,cb);				
			},
			//招募类型统计
			function(cb){
				//console.log("base adv get over");
				statisticalJSON.sType = "148";
		// 			var q = keystone.list("InnLog").model.aggregate([{$match:{timeStamp:{$gte:statisticalJSON.firstDate,$lt:statisticalJSON.lastDate},logType:'LogOn'}},
		// {$group:{_id:"$uid",count:{$sum:1}}},
				var q = keystone.list("ConsumptionAdvSummon").model.aggregate([{$match:{timeStamp:{$gte:statisticalJSON.firstDate,$lt:statisticalJSON.lastDate}}},{$group:{_id:"$advType",count:{$sum:1}}}]).exec(function(err,result){
					var datas = {};
					_.each(result,function(parm){
						datas[parm._id] = parm.count;
					});
					statisticalJSON.countObj = JSON.stringify(datas);
					self.insert(statisticalJSON,logDate,cb);
				});
			},
			//兑换数量统计
			function(cb){
				console.log("AdvSummon over");
				var q = keystone.list("InnLog").model.find({logType:"FameShopPurchase",timeStamp:{$gte:statisticalJSON.firstDate,$lt:statisticalJSON.lastDate}}).select("message").exec(function(err,result){
					var arrTypeIds = [];
					_.each(result,function(parm){
						//console.log(JSON.stringify(parm));
						var arrs = parm.message.split(",");
						arrTypeIds.push(arrs[2]);
					});
					statisticalJSON.sType="149";
					statisticalJSON.countObj = getGroupAndSum(arrTypeIds);
					self.insert(statisticalJSON,logDate,cb);
				})
			}
			],
			function(err,cb){
				if (err) {
					console.log(new Date()+err);
				};
				console.log("FameShopPurchase over");
				//冒险者招募统计和兑换统计
				//冒险者数量

				var getIt = function(err,results){
					var ac = [];
					_.each(results,function(parm){
						ac.push(parm.advCount);
					});
					statisticalJSON.sType = "125";
					statisticalJSON.countObj = getGroupAndSum(ac);
					self.insert(statisticalJSON,logDate);
					console.log("gameUser updateall over");
					if (next) {
						next();
					};
				}
				var q = keystone.list("GameUser").model.find({timeStamp:{$gte:statisticalJSON.firstDate,$lt:statisticalJSON.lastDate}}).select("advCount").exec(getIt);

		});
	}
	keystone.list("Adventurer").model.find({timeStamp:{$gte:statisticalJSON.firstDate,$lt:statisticalJSON.lastDate}}).select("islegend typeId star equipSet level generation").exec(getAdv);
}
//任务完成情况，先不区分不同种类的任务类型 奥德赛模式先不管
statisticalManager.prototype.getBaseDistribution_questCount = function(sType,logDate,next){
	var statisticalJSON = {firstDate:0,lastDate:0,sType:"0",countObj:"",tType:0};
	var self = this;
	this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	switch(sType){
		case "daily":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=1;
		break;
		case "weekly":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=2;
		break;
		case "monthly":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=3;
		break;
		default:
		break; 
	}
	statisticalJSON.sType="129";
	var getIt = function(err,results){
		if(err){
			console.log(new Date()+err);
		}
		var datas = [];
		_.each(results,function(parm){
			var arrStr = parm.message.split(",");
			var data = {};
			data.typeid = arrStr[0];
			data.uid = parm.uid;
			datas.push(data);
		});
		statisticalJSON.countObj = getGroupAndSum(_.map(datas,function(data){return data.typeid}));

		//console.log("show questCount:%s",JSON.stringify(statisticalJSON));
		self.insert(statisticalJSON,logDate,function(){
			//console.log("wuhaha ,测试任务完成情况，独立ID完成情况计算开始");
			var parms = [];
			_.each(datas,function(data){
				var hasIt = false;
				for(var i=0;i<parms.length;i++){
					var parm = parms[i];
					if(parm.uid==data.uid&&parm.typeid==data.typeid){
						hasIt = true;
						break;
					}
				}
				if(!hasIt)
				{
					parms.push(data);
				}
			});
			statisticalJSON.sType="143";
			statisticalJSON.countObj = getGroupAndSum(_.map(parms,function(data){return data.typeid}));
			self.insert(statisticalJSON,logDate);
		});

		//筛选下去重

	}
	var getSweep = function(err,results){
			if(err){
			console.log(new Date()+err);
		}
		var datas = [];
		_.each(results,function(parm){
			var arrStr = parm.message.split(",");
			var data = {};
			data.typeid = arrStr[0];
			data.uid = parm.uid;
			datas.push(data);
		});
		statisticalJSON.countObj = getGroupAndSum(_.map(datas,function(data){return data.typeid}));

		//console.log("show questCount:%s",JSON.stringify(statisticalJSON));
		statisticalJSON.sType = "157";
		self.insert(statisticalJSON,logDate,function(){
			
			var parms = [];
			_.each(datas,function(data){
				var hasIt = false;
				for(var i=0;i<parms.length;i++){
					var parm = parms[i];
					if(parm.uid==data.uid&&parm.typeid==data.typeid){
						hasIt = true;
						break;
					}
				}
				if(!hasIt)
				{
					parms.push(data);
				}
			});
			statisticalJSON.sType="158";
			statisticalJSON.countObj = getGroupAndSum(_.map(parms,function(data){return data.typeid}));
			self.insert(statisticalJSON,logDate,next);
		});

		//筛选下去重	
	}
	var q = keystone.list("InnLog").model.find({logType:"QuestFinish",timeStamp:{$gte:statisticalJSON.firstDate,$lt:statisticalJSON.lastDate}}).select("message uid").exec(getIt);


	var q2 = keystone.list("InnLog").model.find({logType:"QuestSweep",timeStamp:{$gte:statisticalJSON.firstDate,$lt:statisticalJSON.lastDate}}).select("message uid").exec(getSweep);
}
function getGroupAndSum(arr){
	var datas = _.groupBy(arr,function(num){return num});
	var keys = _.keys(datas);
	for (var i = keys.length - 1; i >= 0; i--) {
		datas[keys[i]] = datas[keys[i]].length;
	};
	return JSON.stringify(datas);
}
statisticalManager.prototype.getBaseDistribution_taskCount = function(sType,logDate,next){
	var statisticalJSON = {firstDate:0,lastDate:0,sType:"0",countObj:"",tType:0};
	var self = this;
	this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	switch(sType){
		case "daily":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=1;
		break;
		case "weekly":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=2;
		break;
		case "monthly":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=3;
		break;
		default:
		break; 
	}
	var getIt = function(err,results){
		if (err) {
			console.log(new Date()+err);
		};
		var tids=[],phases=[],datas=[];
		_.each(results,function(parm){
			var arrStr =  parm.message.split(",");
			if (arrStr[0]=="phase") 
				phases.push(arrStr[0]);
			else {
				tids.push(arrStr[0]);
				var data = {};
				data.tid=arrStr[0];
				data.uid=parm.uid;
				datas.push(data);
			}
		});
		statisticalJSON.sType="130";
		statisticalJSON.countObj = getGroupAndSum(tids);
		self.insert(statisticalJSON,logDate,function(){
			statisticalJSON.sType="144";
			statisticalJSON.countObj = getGroupAndSum(phases);
			self.insert(statisticalJSON,logDate,function(){
				var parms = [];
				_.each(datas,function(data){
					var hasIt = false;
					for(var i=0;i<parms.length;i++){
						var parm = parms[i];
						if (parm.uid==data.uid&&parm.tid==data.tid) {
							hasIt = true;
							break;
						};
					};
					if(!hasIt){
						parms.push(data);
					}
				});
			statisticalJSON.sType="145";
			statisticalJSON.countObj = getGroupAndSum(_.map(parms,function(data){return data.tid}));
			self.insert(statisticalJSON,logDate,next);
			});
		});
	}
	var q = keystone.list("InnLog").model.find({logType:"TaskUp",timeStamp:{$gte:statisticalJSON.firstDate,$lt:statisticalJSON.lastDate}}).select("message uid").exec(getIt);
}
statisticalManager.prototype.getBaseDistribution_tutorialCount = function(sType,logDate,next){
	var statisticalJSON = {firstDate:0,lastDate:0,sType:"0",countObj:"",tType:0};
	var self = this;
	this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	switch(sType){
		case "daily":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=1;
		break;
		case "weekly":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=2;
		break;
		case "monthly":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=3;
		break;
		default:
		break; 
	}
	var getIt = function(err,results){
		if (err) {
			console.log(new Date()+err);
		};
		var ttsf = [],ttss = [];
		_.each(results,function(parm){
			var arrStr = parm.message.split(",");
			if(arrStr[0]=="f")
				ttsf.push(arrStr[1]);
			if(arrStr[0]=="s")
				ttss.push(arrStr[1]);
		});
		statisticalJSON.sType = "131";
		statisticalJSON.countObj = getGroupAndSum(ttsf);
		self.insert(statisticalJSON,logDate,function(){
			statisticalJSON.sType = "147";
			statisticalJSON.countObj = getGroupAndSum(ttss);
			self.insert(statisticalJSON,logDate,next);
		});
	}
	var q = keystone.list("InnLog").model.find({logType:"Tutorial",timeStamp:{$gte:statisticalJSON.firstDate,$lt:statisticalJSON.lastDate}}).select("message").exec(getIt);
	

}
//没有对应数据
statisticalManager.prototype.getBaseDistribution_paycontentCount = function(sType,logDate,next){
	var statisticalJSON = {firstDate:0,lastDate:0,sType:"0",countObj:"",tType:0};
	var self = this;
	this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	switch(sType){
		case "daily":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=1;
		break;
		case "weekly":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=2;
		break;
		case "monthly":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=3;
		break;
		default:
		break; 
	}
	
	var getIt = function(err,result){
		var results = {};
		_.each(result,function(parm){
			if(parm.logType=="GemShopPurchase")
			{
				var arrMsg = parm.message.split(",");
				switch(arrMsg[1]){
					case "1":
						parm.logType="AdvShopPurchase";
						break;
					case "2":
						parm.logType="normalShopPurchase";
						break;
					case "3":
						parm.logType="odysseyShopPurchase";
						break;
					case "4":
						parm.logType="pvpShopPurchase";
						break;
					case "5":
						parm.logType="coinShopPurchase";
						break;
					case "6":
						parm.logType="blackShopPurchase";
						break;
					default:
						break;
				}
			}
		    if(!results[parm.logType])
				results[parm.logType] = 0;
			 if(!isNaN(parm.R1))
			{
				results[parm.logType]+= (parseInt(parm.R1) || 0);
			}
		});

		statisticalJSON.sType="132";
		statisticalJSON.countObj = JSON.stringify(results);
		self.insert(statisticalJSON,logDate,next);
	}
	var q = keystone.list("InnLog").model.find({subType:"paid",timeStamp:{$gte:statisticalJSON.firstDate,$lt:statisticalJSON.lastDate}}).select("logType R1 message").exec(getIt);
}
statisticalManager.prototype.getBaseDistribution_getGemContent = function(sType,logDate,next){
	var statisticalJSON = {firstDate:0,lastDate:0,sType:"0",countObj:"",tType:0};
	var self = this;
	if(sType!="daily")
	{
		next();
		return;
	}
	this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	switch(sType){
		case "daily":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=1;
		break;
		case "weekly":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=2;
		break;
		case "monthly":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=3;
		break;
		default:
		break; 
	}
	statisticalJSON.sType="171";
	var handleGem = function(err,results){
		var parms={};
		_.each(results,function(parm){
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
				winston.debug("getGemContent handle mailTake ,%s \n the title:%s,index:%s",JSON.stringify(parm),arrMsg[2],arrMsg[1]);
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
		});
		var getGemBuy = function(err,results)
		{
			_.each(results,function(parm){
				if(parms["buygem"])
					parms["buygem"]+=parseInt(parm.R1);
				else
					parms["buygem"]=parseInt(parm.R1);
				var arrMsg=parm.message.split(",");
				winston.debug("foreach the TavernBuyGem ,%s \n the gemOther:%s",JSON.stringify(parm),arrMsg[3]);
				var gemother = 0;
				if(!isNaN(arrMsg[3]))
					gemother = parseInt(arrMsg[3]);
				else if(!isNaN(arrMsg[12]))
					gemother = parseInt(arrMsg[12]);
				else
					winston.info("error# get gemothergetcount error,parm:%s",JSON.stringify(parm));

				if(parms["buygemother"])
					parms["buygemother"]+=parseInt(gemother);
				else
					parms["buygemother"]=parseInt(gemother);
			});
		statisticalJSON.countObj = JSON.stringify(parms);
		self.insert(statisticalJSON,logDate,next);			
		}
		keystone.list("InnLog").model.find({timeStamp:{$gte:statisticalJSON.firstDate,$lt:statisticalJSON.lastDate},subType:"buygem"}).select("R1 message").exec(getGemBuy);

	}
	keystone.list("InnLog").model.find({timeStamp:{$gte:statisticalJSON.firstDate,$lt:statisticalJSON.lastDate},subType:"getgem"}).select("logType R1 message").exec(handleGem);
}
statisticalManager.prototype.getBaseDistribution_dailyGameTimeCount = function(sType,logDate,next){
	var statisticalJSON = {firstDate:0,lastDate:0,sType:"0",countObj:"",tType:0};
	var self = this;
	this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	switch(sType){
		case "daily":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=1;
		break;
		case "weekly":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=2;
		break;
		case "monthly":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=3;
		break;
		default:
		break; 
	}
	var getIt = function(err,datas){
		if (err) {
			console.log(new Date()+err);
		};
		//console.log(JSON.stringify(results));
		var logtimes = [];
		var results = {"0-15":0,"15-30":0,"30-60":0,"60-120":0,"120-180":0,">180":0};
		_.each(datas,function(parm){
			logtimes.push(parm.logtime);
		});
		//console.log(logtimes);
		for (var i = logtimes.length - 1; i >= 0; i--) {
			var time_t = logtimes[i];
			//console.log(time_t);
			if (time_t<=15*60) {
				results["0-15"]++;
				continue;
			};
			if (time_t>15*60&&time_t<=60*30) {
				results["15-30"]++;
				continue;
			};
			if (time_t>60*30&&time_t<=60*60) {
				results["30-60"]++;
				continue;
			};
			if (time_t>60*60&&time_t<=60*120) {
				results["60-120"]++;
				continue;
			};
			if (time_t>60*120&&time_t<=60*180) {
				results["120-180"]++;
				continue;
			};
			if (time_t>60*180) {
				results[">180"]++;
				continue;
			};
		};
		statisticalJSON.sType="133";
		statisticalJSON.countObj = JSON.stringify(results);
		self.insert(statisticalJSON,logDate,next);
	}
	var q = keystone.list("InnLog").model.find({logType:"LogTime"}).where("timeStamp").gte(statisticalJSON.firstDate).where("timeStamp").lt(statisticalJSON.lastDate).select("logtime").exec(getIt);
}
statisticalManager.prototype.getBaseDistribution_PaidContent = function(sType,logDate,next){
	var statisticalJSON = {firstDate:0,lastDate:0,sType:"0",countObj:"",tType:0};
	var self = this;
	this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	switch(sType){
		case "daily":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=1;
		break;
		case "weekly":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=2;
		break;
		case "monthly":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=3;
		break;
		default:
		break; 
	}	
}
//游戏时间段分布
statisticalManager.prototype.getBaseDistribution_dailyGameTimeDis = function(sType,logDate,next){
	var statisticalJSON = {firstDate:0,lastDate:0,sType:"0",countObj:"",tType:0};
	var self = this;
	this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	switch(sType){
		case "daily":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=1;
		break;
		case "weekly":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=2;
		break;
		case "monthly":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=3;
		break;
		default:
		break; 
	}
	var base = 3600;//表示一小时
	var result = {};
	//var basetime = statisticalJSON.firstDate;
	var getItItIt = function(basetime,cb){
		var getIt = function(err,count){
			if (err) {
				console.log(new Date()+err);
			};
			var hour = (new Date(basetime*1000)).getHours().toString();
			result[hour] = count;
			var btime = basetime+base;
			//console.log(JSON.stringify(result));
			if (btime>statisticalJSON.lastDate) {
				statisticalJSON.sType="134";
				statisticalJSON.countObj=JSON.stringify(result);
				//console.log(JSON.stringify(statisticalJSON));
				self.insert(statisticalJSON,logDate,cb);
			}else{
			getItItIt(btime,cb);
			}
		}
		if (basetime<=statisticalJSON.lastDate) {
			var q = keystone.list("InnLog").model.find().where("timeStamp").gte(basetime).where("timeStamp").lt(basetime+base).count(getIt);
		}
	}
	getItItIt(statisticalJSON.firstDate,next);
}
statisticalManager.prototype.getBaseDistribution_odysseyInformation = function(sType,logDate,next){
	var statisticalJSON = {firstDate:0,lastDate:0,sType:"0",countObj:"",tType:0};
	var self = this;
	this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	switch(sType){
		case "daily":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=1;
		break;
		case "weekly":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=2;
		break;
		case "monthly":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=3;
		break;
		default:
		break; 
	}
	var getIt = function(err,results){
		if(err)
		{
			console.error(new Date()+ err);
			return;
		}
		var arrTypeIDs = [];
		_.each(results,function(parm){
			var arrStr = parm.message.split(",");
			if(arrStr.length>5){
				
				if(arrStr[1]=="0"){
					arrTypeIDs.push(arrStr[0]);
				}
			}	
		});
		statisticalJSON.sType="165";
		statisticalJSON.countObj = getGroupAndSum(arrTypeIDs);
		self.insert(statisticalJSON,logDate,next);
	}
	var q = keystone.list("InnLog").model.find({logType:"QuestEliteFinish",timeStamp:{$gte:statisticalJSON.firstDate,$lt:statisticalJSON.lastDate}}).select("message").exec(getIt);
}
statisticalManager.prototype.fgetBaseDistribution_pvpInformation = function(sType,logDate,next){
	var statisticalJSON = {firstDate:0,lastDate:0,sType:"0",countObj:"",tType:0};
	var self = this;
	this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	switch(sType){
		case "daily":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=1;
		break;
		case "weekly":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=2;
		break;
		case "monthly":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=3;
		break;
		default:
		break; 
	}
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
	var getIt = function(err,results){
		if(err)
		{
			console.error(new Date()+ err);
			return;
		}
		var arrAdv=[],arrSkill=[],arrWinAdv=[],arrWinSkill=[];
		
		_.each(results,function(parm){
			try{
				var arrStr = parm.message.split(",");
				if(arrStr&&arrStr.length&&arrStr.length>=6)
				{
					var p ="";
					if(arrStr)
					  p = arrStr[6];
					
					var arrP = p.split(":");
					if(arrP.length==4)
					{
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
					}
				}
			}
			catch(err){
				winston.info("pvp foreach err,the log:%s",JSON.stringify(parm));
			}
		});

		async.waterfall([
			function(cb){
				statisticalJSON.sType = "161";
				statisticalJSON.countObj = getGroupAndSum(arrAdv);
				self.insert(statisticalJSON,logDate,cb);				
			},
			function(cb){
				statisticalJSON.sType="162";
				statisticalJSON.countObj = getGroupAndSum(arrSkill);
				self.insert(statisticalJSON,logDate,cb);
			},
			function(cb){
				statisticalJSON.sType="163";
				statisticalJSON.countObj=getGroupAndSum(arrWinAdv);
				self.insert(statisticalJSON,logDate,cb);
			}
			],function(err){
				statisticalJSON.sType="164";
				statisticalJSON.countObj=getGroupAndSum(arrWinSkill);
				self.insert(statisticalJSON,logDate,next);
			});
	}
	var q = keystone.list("InnLog").model.find({logType:{$in:["PvPFinish","BePvPFinish"]},timeStamp:{$gte:statisticalJSON.firstDate,$lt:statisticalJSON.lastDate}}).select("message").exec(getIt);

}
statisticalManager.prototype.getBaseDistribution_errorTypeCount = function(sType,logDate,next){
	var statisticalJSON = {firstDate:0,lastDate:0,sType:"0",countObj:"",tType:0};
	var self = this;
	this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	switch(sType){
		case "daily":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=1;
		break;
		case "weekly":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=2;
		break;
		case "monthly":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=3;
		break;
		default:
		break; 
	}
	var errIds =[];
	var getIt = function(err,results){
		if (err) {
			console.log(new Date()+err);
		};
		_.each(results,function(parm){
			if(parm.category!=0)
				errIds.push(parm.category);
		})
		statisticalJSON.sType="135";
		statisticalJSON.countObj = getGroupAndSum(errIds);
		self.insert(statisticalJSON,logDate,next);
	}
	var  q = keystone.list("InnLog").model.find({logType:{$in:["MgrErr","HandlerErr"]},timeStamp:{$gte:statisticalJSON.firstDate,$lt:statisticalJSON.lastDate}}).select("category").exec(getIt);
}
statisticalManager.prototype.getBaseDistribution_GemBuySubCount=function(sType,logDate,next){
	var statisticalJSON = {firstDate:0,lastDate:0,sType:"0",countObj:"",tType:0};
	var self = this;
	this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	switch(sType){
		case "daily":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=1;
		break;
		case "weekly":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=2;
		break;
		case "monthly":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=3;
		break;
		default:
		break; 
	}
	var getIt = function(err,results)
	{
		if(err)
		{
			console.log(new Date() + err);
		}
		var result = {};
		_.each(results,function(parm){
			if(!result[parm.logType])
				result[parm.logType] = 0;
			if(!isNaN(parm.R1))
			result[parm.logType] +=parseInt( parm.R1);
		});

		statisticalJSON.sType="150";
		statisticalJSON.countObj = JSON.stringify(result);
		self.insert(statisticalJSON,logDate,next);		
	}
	var q = keystone.list("InnLog").model.find({logType:{$in:["BuyGemBuy","BuyGemOther","SubGemBuy","SubGemOther"]},timeStamp:{$gte:statisticalJSON.firstDate,$lt:statisticalJSON.lastDate}}).select("logType R1").exec(getIt);
}
statisticalManager.prototype.getBaseDistribution_GetMapOfCountry = function(sType,logDate,next){
	var statisticalJSON = {firstDate:0,lastDate:0,sType:"0",countObj:"",tType:0};
	var self = this;
	this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	switch(sType){
		case "daily":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=1;
		break;
		case "weekly":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=2;
		break;
		case "monthly":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=3;
		break;
		default:
		break; 
	}
	var getIt = function(err,results){
		if(err){
			console.error(new Date()+ err);
		}
		//console.log("MapCountry:%s",JSON.stringify(results));
		statisticalJSON.sType="166";
		var countObj = [];
		_.each(results,function(parm){
			countObj.push(parm.country.toLowerCase());
		});
		statisticalJSON.countObj = getGroupAndSum(countObj);
		self.insert(statisticalJSON,logDate,next);
	}
	keystone.list("Statistical").model.find({sType:"166"}).remove(function(err){
		var q = keystone.list("GameUser").model.find({country:{$ne:""}}).exec(getIt);
	});
	
}
statisticalManager.prototype.getBaseDistribution_GetLastQuest = function(sType,logDate,next){
	var statisticalJSON = {firstDate:0,lastDate:0,sType:"0",countObj:"",tType:0};
	var self = this;
	this.getFirstAndLastDate(statisticalJSON,sType,logDate);
	switch(sType){
		case "daily":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=1;
		break;
		case "weekly":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=2;
		break;
		case "monthly":
			//statisticalJSON.sType="124";
			statisticalJSON.tType=3;
		break;
		default:
		break; 
	}
	var getIt = function(err,results){
		if(err){
			console.error(new Date()+ err);
		}	
		var lastQuests= [];	
		_.each(results,function(parm){
			lastQuests.push(parm.lastQuest);
		});
		lastQuests = _.sortBy(lastQuests,function(num){
			var intArr = num.replace(/.(\d+?)_.(\d+?)_.+/g,"$1,$2").split(',');
			return parseInt(intArr[0]*100)+parseInt(intArr[1]);
		});
		statisticalJSON.sType="167";
		statisticalJSON.countObj = getGroupAndSum(lastQuests);
		//console.log("lastQuest:%s",statisticalJSON.countObj);
		self.insert(statisticalJSON,logDate,next);
	}
	var q = keystone.list("GameUser").model.find({timeStamp:{$gte:statisticalJSON.firstDate,$lt:statisticalJSON.lastDate}}).select("lastQuest").exec(getIt);
}
statisticalManager.prototype.getBaseDistribution_GetClientLog = function(sType,logDate,next){
	var statisticalJSON = this.initStatisticalJSON(sType,logDate,"168");
	var self = this;
	var getIt = function(err,results){
		if(err){
			console.log(new Date()+"#getBaseDistribution_GetClientLog#"+err);
		}
		var thelogs = [];
		_.each(results,function(parm){
			var arrMsg = parm.message.split(",");
			thelogs.push(arrMsg[0]);
		});
		statisticalJSON.countObj = getGroupAndSum(thelogs);
		self.insert(statisticalJSON,logDate,next);
	}
	var q = keystone.list("InnLog").model.find({logType:"PlayerClientLog",timeStamp:{$gte:statisticalJSON.firstDate,$lt:statisticalJSON.lastDate}}).exec(getIt);
}
statisticalManager.prototype.addSignEffective = function(sType,logDate,next)
{
	var self = this;
	var statisticalJSON = this.initStatisticalJSON(sType,logDate,"");
	async.waterfall([
		function(cb){
			keystone.list("InnLog").model.update({timeStamp:{$gte:statisticalJSON.firstDate,$lt:statisticalJSON.lastDate},effective:{$exists:false}},{$set:{effective:true}},{multi:true},function(err,results){
				cb();
			});
		},
		function(cb){
			keystone.list("SiteLog").model.find({postType:"/tavernedit",timeStamp:{$lte:statisticalJSON.lastDate}}).select("message").exec(function(err,results){
				var clearUids=[];
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
				cb(null,clearUids);
			});
		},
		function(clearUids,cb){
			sql = {timeStamp:{$gte:statisticalJSON.firstDate,$lt:statisticalJSON.lastDate},uid:{$in:clearUids}};
			var doIt = function(arrary,thenext){
				var i=0;
				async.whilst(
					function(){
						return i<arrary.length;
					},
					function(callback){
						var log = arrary[i];
						log.effective = false;
						log.save(function(err){
							i++;
							callback();
						});
					},
					function(err){
						thenext();
					}
					);
			};
			self.selectByStream(sql,doIt,function(){
				cb();
			});
		}
		],function(err){
			next();
	});
}
statisticalManager.prototype.addSignCountryOfInnLog = function(op,ed,next)
{
	  var SignAddSignCountry = keystone.get("addSignCountry");
      if(!!SignAddSignCountry==false)
      {
          async.waterfall([
              function(cb){
                keystone.list("GameUser").model.aggregate([{$match:{country:{$ne:""}}},{$group:{_id:"$uid",country:{$first:"$country"}}}]).exec(
                  function(err,results){
                    //console.log(JSON.stringify(results));
                    var theparms={};
                    _.each(results,function(parm){
                      theparms[parm._id] = parm.country;
                    });
                    cb(null,theparms);
                  });
              },
              function(theparms,cb)
              {
              	//winston.debug("theparms:%s",JSON.stringify(theparms));
                addSignCountry(theparms,op,ed,cb);
              }
            ],function(err){
              //winston.info("over add SignCountry");
              keystone.set("addSignCountry",false);
              next();
          });
      }
      else
      	{next();}
}
  function addSignCountry(uids,op,ed,callback)
   {  	
      var stream = keystone.list("InnLog").model.find({$or:[{country:{$exists:false}},{country:""}],timeStamp:{$gte:op,$lt:ed}}).stream();

      keystone.set("addSignCountry",ed);
      // process.nextTick(function(){
        
      // });
      // stream.stream();
      var cache = [];
     // console.log(stream);
     var k = 0;
      stream.on('data',function(item){

         // cache.push(item);
         // if(cache.length==100){
              /** signal mongo to pause reading **/
              stream.pause();
              item.country=uids[item.uid];
             // winston.debug("add country ,country:%s",uids[item.uid]);
              item.save(function(){
              	//winston.info(k+++"")
              	stream.resume();
              });
              // process.nextTick(function(){
              //     doLotsWork(cache,function(){
              //         cache=[];
              //         * signal mongo to continue, fetch next record *
              //         console.log("over get addSignCountry 100");
              //         stream.resume();
              //     });
              // });
         // }
      });
      stream.on('end',function(){ 
      	//console.log('query ended'); 
      });
      stream.on('close',function(){ 
      	//console.log('query closed');
                  //  doLotsWork(cache,function(){
                  //     cache=[];
                  //     /** signal mongo to continue, fetch next record **/
                  //     winston.info("over get  addSignCountry all");
                  //     keystone.set("addSignCountry",false);
                  //    // stream.resume();
                     callback();
                  // });     
       });
      // var doLotsWork = function(parms,cb)
      // {
      //     var i = 0;
      //     async.whilst(
      //       function(){return i<parms.length},
      //       function(thenext){
      //       	var p = parms[i];
      //       	p.country=uids[parms[i].uid];
      //       	p.save(function(){
      //                 i++;
      //                 winston.debug("parms:%s",++k+"");
      //               //winston.debug("the over result:%s",JSON.stringify(results));
      //               thenext();                 		
      //       	});
      //       },
      //       function(err){
      //         process.nextTick(function(){
      //         	cb();
      //         })
      //       });
      // }
   }
statisticalManager.prototype.getMem=function(mongodbMem,nodejsMem,next){
	var logDate = Date.now()/1000;
	var self = this;
	var mongodbStatistical = self.initStatisticalJSON("daily",logDate,"998");
	var nodejsStatistical = self.initStatisticalJSON("daily",logDate,"999");
	mongodbStatistical.count = parseFloat(mongodbMem);
	nodejsStatistical.count = parseFloat(nodejsMem);
	this.insert(mongodbStatistical,logDate);
	this.insert(nodejsStatistical,logDate,next);
}
exports = module.exports = statisticalManager;


