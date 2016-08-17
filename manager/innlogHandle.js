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
var gameUserManager = require("./gameUserManager");
var daysLeftManager = require('./DaysLeftManager');
var gameConfigExchange = require("./GameConfigExchange");
var winston = require("./util/LogsBackup");
var syslog = require("../sys_log");
var utils = require("./util/utils");

var statisticalHandler = function(){
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
util.inherits(statisticalHandler,manager);
//平均数算法和总数算法
statisticalHandler.prototype.cache = {};

function isArray(obj) {   
  return Object.prototype.toString.call(obj) === '[object Array]';    
}  

statisticalHandler.prototype.getPriceByGem = function(options,next){
	var gcx = new gameConfigExchange();

		gcx.getHistoryExchange({table:"skus",typeid:"gemCount",value:"price",firstDate:options.firstDate},function(results){
			next(results);
		});
}
statisticalHandler.prototype.getPriceWithExcelChanged = function(innlog,prices)
{
	var result = 0;
	//UTC 2015-06-25 12:00:00 更改了月卡价格，从$2.99上调到$4.99 timeStamp为1435233600

	if(innlog.timeStamp>1435233600&&innlog.R1=="300")
	{
		var arrStr = innlog.message.split(",");
		var type = arrStr[1];		
		if(type=="m")
			result = 4.99;
		else 
			result = 2.99;
	}
	else
	{
		if(prices[innlog.R1])
			result = parseFloat(prices[innlog.R1].substring(1));
		else
		{
			winston.error("GameConfig skus matching error,prices:%s,R1:%s",JSON.stringify(prices),innlog.R1);
		}
	}
		
	return result;

}
statisticalHandler.prototype.getLTV = function(firstDate,lastDate,logDate,country,region,next){
	var theSummary = {};
	var self = this;
	var scale = 0.7;
	var prices=[];
	var countryInnLog = country;
	if(country=="Not_CN")
		countryInnLog={$ne:"CN"};
	async.waterfall([
		function(cb){
			winston.debug("begen search Summary to get the summary"+Date.parse(new Date()));
			var q = keystone.list("Summary").model.find({firstDate:firstDate,lastDate:lastDate});
			if(country)
			{
				q=q.where("country",country);
			}
			else
				q=q.where("country",{$exists:false});
			if(region)
			{
				q=q.where("region",parseInt(region));
			}
			else
				q=q.where("region",{$exists:false});
			//console.log(q);
			winston.debug("summary q :%s",JSON.stringify(q._conditions));
			q.exec(function(err,results){
				winston.debug("over search Summary to get the summary"+Date.parse(new Date()));
				if(!!results==false||results.length>1||results.length==0)
				{
					winston.debug("error summary length >1 or can't find summary",JSON.stringify(results));
					cb("error summary length >1 or can't find summary");
					return;
				}
				theSummary = results[0];
				// if(self.cache[theSummary.firstDate]&&self.cache[theSummary.firstDate].lastDate==theSummary.lastDate&&self.cache[theSummary.country]==theSummary.country)
				// {
				// 	cb("has done it,continue");
				// 	return;
				// }
				//console.log("logDate:%s,theSummary:%s",logDate,JSON.stringify(results));
				theSummary.logDate = logDate;
			  	winston.debug("this summary:%s",JSON.stringify(theSummary));
				cb(null);
			});
		},
		function(cb){
			winston.debug("begen get the Prices"+Date.parse(new Date()));
			self.getPriceByGem({firstDate:firstDate},function(results){
				winston.debug("over get the Prices"+Date.parse(new Date()));
				prices = results;
				cb(null);
			});
		},
		function(cb){
			winston.debug("begen get the register"+Date.parse(new Date()));
			var getIt = function(err,results){
				winston.debug("over get the Prices"+Date.parse(new Date()));
				cb(null,results);
			}
			var q = keystone.list("InnLog").model.find({logType:"Register"}).where("timeStamp").gte(firstDate).where("timeStamp").lt(lastDate);
			if(country)
				q=q.where("country",countryInnLog);
			if(region)
				q=q.where("R2",region+"");
			winston.debug("get register q:%s",q._conditions);
			q.distinct("uid").exec(getIt);
		},
		function(uids,cb){
			//console.log("getUids:%s",JSON.stringify(uids));
			//如果与现在时间相差大于7天就不跑LTV7了。。。有需要再加
			var getLTV7 = function(err,results){
				if(err){
					cb(err,null);
					return;
				}
				//console.log("LTV7 :%s",JSON.stringify(results));
				winston.debug("over get the LTV7"+Date.parse(new Date()));
				var gemCount = 0;
				_.each(results,function(parm){
					if(prices[parm.R1]){
						//gemCount+=parseFloat(prices[parm.R1].substring(1));
						gemCount+=self.getPriceWithExcelChanged(parm,prices);
					}
					else{
						console.log("there has error,the R1:%s,prices:%s",parm.R1,JSON.stringify(prices));
						//syslog.writeLog("#Summary - Rvenue# there has error,the R1:"+parm.R1+",prices:"+JSON.stringify(prices)+",innlog:"+JSON.stringify(parm)+"");						
					}
				});	
				winston.debug("over  yunsuan the LTV7"+Date.parse(new Date()));
				//console.log("LTV7 gemcount:%s",gemCount);
				if(theSummary.DNU&&theSummary!=0)
					theSummary.LTV7 = (gemCount*scale)/theSummary.DNU;		

				//console.log("LTV7:%s,gemCount:%s,DNU:%s",theSummary.LTV7,gemCount,theSummary.DNU);
				cb(null,uids);
			}
			winston.debug("begen get the LTV7"+Date.parse(new Date()));
			var q = keystone.list("InnLog").model.find({subType:"buygem",uid:{$in:uids}}).where("timeStamp").gte(firstDate).where("timeStamp").lt(lastDate+7*86400);
			if(country)
				q=q.where("country",countryInnLog);
			if(region)
				q=q.where("R2",region+"");			
			winston.debug("get LTV7 q:%s",q._conditions);
			q.select("R1 message timeStamp").exec(getLTV7);
		},
		function(uids,cb){
			var getLTV15 = function(err,results){
				winston.debug("over get the LTV15"+Date.parse(new Date()));
				if(err){
					cb(err,null);
					return;
				}
				var gemCount = 0;
				_.each(results,function(parm){
					if(prices[parm.R1]){
						//gemCount+=parseFloat(prices[parm.R1].substring(1));
						gemCount+=self.getPriceWithExcelChanged(parm,prices);
					}
					else{
						console.log("there has error,the R1:%s,prices:%s",parm.R1,JSON.stringify(prices));
						syslog.writeLog("#Summary - Rvenue# there has error,the R1:"+parm.R1+",prices:"+JSON.stringify(prices)+",innlog:"+JSON.stringify(parm)+"");						
					}
				});	
				winston.debug("over yunsuan the LTV15"+Date.parse(new Date()));
				//console.log("LTV15 gemcount:%s",gemCount);
				if(theSummary.DNU&&theSummary!=0)
				theSummary.LTV15 = (gemCount*scale)/theSummary.DNU;		
				//console.log("LTV15:%s",theSummary.LTV15);
				cb(null,uids);
			}
			winston.debug("begen get the LTV15"+Date.parse(new Date()));
			var q = keystone.list("InnLog").model.find({subType:"buygem",uid:{$in:uids}}).where("timeStamp").gte(firstDate).where("timeStamp").lt(lastDate+15*86400);
			if(country)
				q=q.where("country",countryInnLog);
			if(region)
				q=q.where("R2",region+"");			
			q.select("R1 message timeStamp").exec(getLTV15);
		}
		],function(err,result){
			if(err)
			{
				next(err)
				return;
			}
			//console.log("theSummsr:%s",JSON.stringify(theSummary));
			theSummary.save(function(err){
					if(err){
						console.error(err);
						next(err);
						return;
					}
					//self.cache[theSummary.firstDate]=theSummary;
					next(null);				
			});
		});
	
}
statisticalHandler.prototype.getLTV_60_90 = function(firstDate, lastDate, country, region, next){
	var self = this;
	var first = firstDate - 90*86400;
	var last = lastDate + 90*86400;
	winston.info("get LTV60_90 byDate:%d to %d", first,lastDate);
	var summarys = [];
	var payinginfos =[];
	var gameusers = [];
	var scale = 0.7;
	var uids = [];
	async.waterfall([
		function(cb){
			var sql = {registerdate:{$gte:first,$lt:last}};
			if(country)
			{
				sql.country = country;
			}
			if(region)
			{
				sql.region = parseInt(region);
			}
			
			keystone.list("GameUser").model.find(sql).select("uid registerdate").exec(function(err,results){
				self.showError(err);
				gameusers = results;
				_.each(gameusers,function(user){
					uids.push(user.uid);
				});
				cb();
			});
		},
		function(cb){
			keystone.list("PayingInfo").model.find({uid:{$in:uids},timeStamp:{$gte:first,$lt:last}}).select("gem money uid timeStamp").exec(function(err,results){
				self.showError(err);
				payinginfos= results;
				cb();
			});
		},
		function(cb){
			var sql = {firstDate:{$gte:first,$lt:last}};
			if(country)
			{
				sql.country = country;
			}

			if(region)
			{
				sql.region = region;
			}

			keystone.list("Summary").model.find(sql).exec(function(err,results){
				self.showError(err);
				summarys = results;
				var i=0;
				if(!results||results.length==0)
				{
					cb();
					return;
				}
				async.whilst(
					function(){
						return i<summarys.length;
					},
					function(callback){

						var summary = summarys[i];
						var sumfirst = summary.firstDate;
						var sumlast = summary.lastDate;
						var sumusers = _.filter(gameusers,function(user){
							return user.registerdate>=sumfirst&&user.registerdate<sumlast;
						});
						var sumuids = _.map(sumusers,function(user){
							return user.uid;
						});
						var sumpayinginfosLTV60 = _.filter(payinginfos,function(info){return info.timeStamp>=sumfirst&&info.timeStamp<(sumlast+60*86400)&&_.contains(sumuids,info.uid)});						
						var sumpayinginfosLTV90 = _.filter(payinginfos,function(info){return info.timeStamp>=sumfirst&&info.timeStamp<(sumlast+90*86400)&&_.contains(sumuids,info.uid)});
						var ltv60=0,ltv90=0;
			
						var moneyCountLtv60=0;
						var moneyCountLtv90=0;

						_.each(sumpayinginfosLTV60,function(info){
							moneyCountLtv60+=parseFloat(info.money);
						});
						_.each(sumpayinginfosLTV90,function(info){
							moneyCountLtv90+=parseFloat(info.money);
						});
						// (gemCount*scale)/theSummary.DNU;	
						//winston.debug("firstDate:%d,region:%d",summary.firstDate,region);
						if(isNaN(summary.DNU)||summary.DNU==0)
						{
							summary.LTV60=0;	
							summary.LTV90=0;											
						}
						else
						{
							summary.LTV60 = (moneyCountLtv60*scale)/summary.DNU;
							summary.LTV90 = (moneyCountLtv90*scale)/summary.DNU;	
						}

						//winston.debug("summary1:%s",JSON.stringify(summary));
						keystone.list("Summary").model.find({_id:summary._id}).exec(function(err,sum){
							self.showError(err);
							//winston.debug("sum:%s",JSON.stringify(sum));
							if(sum[0])
							{
								sum[0].LTV60 = summary.LTV60;
								sum[0].LTV90 = summary.LTV90;
								sum[0].save(function(err){
									self.showError(err);
									i++;
									callback();										
								});							
							}
							else
							{
								i++;
								callback();
							}

						})
					},
					function(err){
						cb();
					}
				);
			})
		},
		],function(err){
			next();
	});
}
statisticalHandler.prototype.getLTV_v2 = function(firstDate,lastDate,country,region,next){
	var self = this;
	var first = firstDate - 90*86400;
	var last = lastDate + 90*86400;
	winston.info("get LTV byDate:%d to %d", first,lastDate);
	var summarys = [];
	var payinginfos =[];
	var gameusers = [];
	var scale = 0.7;
	var uids = [];
	async.waterfall([
		function(cb){
			var sql = {registerdate:{$gte:first,$lt:last}};
			if(country)
			{
				sql.country = country;
			}
			if(region)
			{
				sql.region = parseInt(region);
			}
			
			keystone.list("GameUser").model.find(sql).select("uid registerdate country region").exec(function(err,results){
				self.showError(err);
				gameusers = results;
				_.each(gameusers,function(user){
					uids.push(user.uid);
				});
				cb();
			});
		},
		function(cb){
			winston.info("LTV get PayingInfo:%d to %d", first,last);
			keystone.list("PayingInfo").model.find({uid:{$in:uids},timeStamp:{$gte:first,$lt:last}}).select("gem money uid timeStamp").exec(function(err,results){
				self.showError(err);
				payinginfos= results;
				cb();
			});
		},
		function(cb){
			var sql = {firstDate:{$gte:first,$lt:last}};
			if(country)
			{
				sql.country = country;
			}

			if(region)
			{
				sql.region = region;
			}
			winston.info("LTV get Summary:%d to %d", first,last);
			keystone.list("Summary").model.find(sql).exec(function(err,results){
				self.showError(err);
				summarys = results;
				var i=0;
				if(!results||results.length==0)
				{
					cb();
					return;
				}
				async.whilst(
					function(){
						return i<summarys.length;
					},
					function(callback){
						var summary = summarys[i];
						var sumfirst = summary.firstDate;
						var sumlast = summary.lastDate;
						var sumusers = [];
						if(summary.country&&summary.region)
						{
							sumusers = _.filter(gameusers,function(user){
							return user.registerdate>=sumfirst&&user.registerdate<sumlast&&user.country==summary.country&&user.region==summary.region;
							});	
						}
						else if(summary.country)
						{
							sumusers = _.filter(gameusers,function(user){
							return user.registerdate>=sumfirst&&user.registerdate<sumlast&&user.country==summary.country;
							});								
						}
						else if(summary.region)
						{
							sumusers = _.filter(gameusers,function(user){
							return user.registerdate>=sumfirst&&user.registerdate<sumlast&&user.region==summary.region;
							});							
						}
						else
						{
							sumusers = _.filter(gameusers,function(user){
							return user.registerdate>=sumfirst&&user.registerdate<sumlast;
							});						
						}

						var sumuids = _.map(sumusers,function(user){
							return user.uid;
						});
						//sumuids = _.union(sumuids);
						var sumpayinginfosLTV7 = _.filter(payinginfos,function(info){return info.timeStamp>=sumfirst&&info.timeStamp<(sumlast+6*86400)&&_.contains(sumuids,info.uid)});						
						var sumpayinginfosLTV15 = _.filter(payinginfos,function(info){return info.timeStamp>=sumfirst&&info.timeStamp<(sumlast+14*86400)&&_.contains(sumuids,info.uid)});
						var sumpayinginfosLTV30 = _.filter(payinginfos,function(info){return info.timeStamp>=sumfirst&&info.timeStamp<(sumlast+29*86400)&&_.contains(sumuids,info.uid)});
						var ltv7=0,ltv15=0,ltv30=0;
						var moneyCountLtv7=0;
						var moneyCountLtv15=0;
						var moneyCountLtv30=0;

						var sumpayinginfosLTV60 = _.filter(payinginfos,function(info){return info.timeStamp>=sumfirst&&info.timeStamp<(sumlast+59*86400)&&_.contains(sumuids,info.uid)});						
						var sumpayinginfosLTV90 = _.filter(payinginfos,function(info){return info.timeStamp>=sumfirst&&info.timeStamp<(sumlast+89*86400)&&_.contains(sumuids,info.uid)});
						var ltv60=0,ltv90=0;
			
						var moneyCountLtv60=0;
						var moneyCountLtv90=0;

						_.each(sumpayinginfosLTV60,function(info){
							moneyCountLtv60+=parseFloat(info.money);
						});
						_.each(sumpayinginfosLTV90,function(info){
							moneyCountLtv90+=parseFloat(info.money);
						});
						
						_.each(sumpayinginfosLTV7,function(info){
							moneyCountLtv7+=parseFloat(info.money);
						});
						_.each(sumpayinginfosLTV15,function(info){
							moneyCountLtv15+=parseFloat(info.money);
						});
						_.each(sumpayinginfosLTV30,function(info){
							moneyCountLtv30+=parseFloat(info.money);
						});
						sumpayinginfosLTV7 = [];
						sumpayinginfosLTV15 = [];
						sumpayinginfosLTV30 = [];
						sumpayinginfosLTV60 = [];
						sumpayinginfosLTV90 = [];
						// (gemCount*scale)/theSummary.DNU;	
						//winston.debug("firstDate:%d,region:%d",summary.firstDate,region);
						if(isNaN(summary.DNU)||summary.DNU==0)
						{
							summary.LTV7 =0;
							summary.LTV15=0;	
							summary.LTV30=0;		
							summary.LTV60=0;	
							summary.LTV90=0;
						}
						else
						{
							summary.LTV7 = (moneyCountLtv7*scale)/summary.DNU;
							summary.LTV15 = (moneyCountLtv15*scale)/summary.DNU;
							summary.LTV30 = (moneyCountLtv30*scale)/summary.DNU;	
							summary.LTV60 = (moneyCountLtv60*scale)/summary.DNU;
							summary.LTV90 = (moneyCountLtv90*scale)/summary.DNU;							
							//winston.debug("region:%s,fristDate:%d,moneyCountLtv7:%d,summary.DNU:%s,LTV7:%d,LTV15:%d",region+"",summary.firstDate,moneyCountLtv7,summary.DUN,summary.LTV7,summary.LTV15);
							// if(summary.firstDate==1440201600&&!country)
							// {
							// 	winston.debug("sumpayinginfosLTV7:%s",JSON.stringify(sumpayinginfosLTV7));
							// }	
						}
						summary.save(function(err){
							if(err)
							{
								winston.error("#innlogHandle# summary.saved error");
								utils.showErr(err);
							}
							i++;
							callback();
						});
							//winston.debug("summary1:%s",JSON.stringify(summary));
						// keystone.list("Summary").model.find({_id:summary._id}).exec(function(err,sum){
						// 	self.showError(err);
						// 	//winston.debug("sum:%s",JSON.stringify(sum));
						// 	if(sum[0])
						// 	{
						// 		sum[0].LTV7 = summary.LTV7;
						// 		sum[0].LTV15 = summary.LTV15;
						// 		sum[0].LTV30 = summary.LTV30;
						// 		sum[0].LTV60 = summary.LTV60;
						// 		sum[0].LTV90 = summary.LTV90;								
						// 		sum[0].save(function(err){
						// 			self.showError(err);
						// 			i++;
						// 			callback();										
						// 		});							
						// 	}
						// 	else
						// 	{
						// 		i++;
						// 		callback();
						// 	}

						// })
					},
					function(err){
						cb();
					}
				);
			})
		},
		],function(err){
			next();
	});
}
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
statisticalHandler.prototype.cache={};
statisticalHandler.prototype.phaseStatistical=function(sync,firstDate,lastDate,logDate,country,region,next){
	var self = this;
	var theSummary ={};
	theSummary.firstDate = firstDate;
	theSummary.lastDate = lastDate;
	theSummary.logDate = logDate;
	var personUids = [];
	var prices=[];
	var scale = 0.7;
	var countryInnLog=country;
	if(country=="Not_CN")
		countryInnLog={$ne:"CN"};
	var regionInnLog = region;
	
	//console.log("begin innlogHandler - phaseStatistical");
	async.waterfall([
		function(cb){
			if(sync.prices.length!=0)
			{
				prices = sync.prices;
				cb();
			}
			else
			{
				self.getPriceByGem({firstDate:firstDate},function(results){
					prices = results;
					cb(null);
				});				
			}
		},
		//当日平台分成后收入(总收入*0.7)
		function(cb){

			var gemCount = 0;
			//console.log(JSON.stringify(results));
			theSummary.DNU=0;
			var paiduids=[];
			_.each(sync.logs,function(parm){
				if(region&&parm.R2!=region)
					return;
				if(country&&!validateCountry(parm.country,country))
					return;				

				if(parm.logType=="Register")
				{
					theSummary.DNU++;
				}
				if(parm.subType=="buygem")
				{
					if(!_.contains(paiduids,parm.uid))
					{
						paiduids.push(parm.uid);
					}
					if(prices[parm.R1]){
						//gemCount+=parseFloat(prices[parm.R1].substring(1));
						gemCount+=self.getPriceWithExcelChanged(parm,prices);
					}
					else{
						console.log("there has error,the R1:%s,prices:%s",parm.R1,JSON.stringify(prices));
						syslog.writeLog("#Summary - Rvenue# there has error,the R1:"+parm.R1+",prices:"+JSON.stringify(prices)+",innlog:"+JSON.stringify(parm)+"");						
					}					
				}
			});
			theSummary.PaidMan = paiduids.length;
			theSummary.Revenue = gemCount*scale;
			
			cb(null);
		},
	//db.runCommand({"distinct":"innlogs","key":"uid","query":{timeStamp:{$gte:1438646400,$lt:1438732800},logType:{$in:["Register","LogOn","LogOut"]}}}).values.length	
		function(cb){
			var userCount = 0;
			_.each(sync.gameusers,function(user){
				if(country&&!validateCountry(user.country,country))
					return;	
				if(region&&(user.region+"")!=region)
					return;
				userCount++;
			});
			theSummary.DAU = userCount;
			cb();
		}
		],function(err,uids){
			if (err) {
				winston.error(JSON.stringify(err));
				next(err);
				return;
			};
			theSummary.EDAU = theSummary.DAU - theSummary.DNU;
			if(theSummary.DAU&&theSummary.DAU!=0)
				theSummary.ARPU = theSummary.Revenue/theSummary.DAU;
			if(theSummary.PaidMan&&theSummary.PaidMan!=0)
				theSummary.ARPPU = theSummary.Revenue/theSummary.PaidMan;
			if(theSummary.DAU&&theSummary.DAU!=0)
				theSummary.PaidPercentage = theSummary.PaidMan/theSummary.DAU;
			if(!!country!=false)
				theSummary.country=country;
			if(region)
				theSummary.region=parseInt(region);
			var summaryModel = keystone.list("Summary");
			var summaryS =new summaryModel.model(theSummary);
			var q = keystone.list("Summary").model.find({"firstDate":firstDate,"lastDate":lastDate});
			winston.debug("current country:%s,theSummary:%s",country,JSON.stringify(theSummary));
			if(country)
				q=q.where("country",country);
			else
				q=q.where("country",{$exists:false});
			if(region)
				q=q.where("region",parseInt(region));
			else
				q=q.where("region",{$exists:false});
			//console.log(JSON.stringify(theSummary));
			//console.log(q);
			winston.info("theSummary:%s",JSON.stringify(theSummary));
			q.remove(function(){
				summaryS.save(function(err){
					self.showError(err);
					self.getLTV_v2(firstDate,lastDate,country,region,next);
				});
			});
	});
}

statisticalHandler.prototype.updateRegistersAndRevenues = function(date, next){
	var self = this;
	var firstDate = this.showDailyBegin(date);
	var lastDate = this.showDailyEnd(date);
	var prices=[];
	var allRegisters = [];
	var scale = 0.7;
	var registers = [];
	var revenues = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	winston.debug("updateRegistersAndRevenues");
	async.waterfall([
		function(cb){
			self.getPriceByGem({logDate:firstDate},function(results){
				prices = results;
				cb(null);
			});
		},
		function(cb){
			keystone.list("Summary").model.find({firstDate:{$lt:firstDate}}).select("registers").exec(function(err,results){
				if(err){
					cb(err);
				} else {
					winston.debug("get pre registers");
					_.each(results, function(item){
						allRegisters.push(item.splite(","));
					});
					cb();
				}
			});
		},
		function(cb){
			var logTypes = [_config.logType.register, _config.subType.buygem];
			keystone.list("InnLog").model.find({timeStamp:{$gte:firstDate,$lt:lastDate},
				logType:{$in:logTypes}}).exec(function(err, results){
					if(err){
						winston.debug("get log error");
						cb(err);
						return;
					}
					winston.debug("get register & bug gem logs");
					_.each(results, function(item){
						if(item.logType == _config.logType.register){
							registers.push(item.uid);
						} else if(item.logType == _config.subType.buygem){
							var rev = parseFloat(prices[item.R1].substring(1)) * scale;
							if(registers.indexOf(item.uid) >= 0){
								revenues[0] += rev;  
							} else {
								for(var i = 0; i < allRegisters.length; ++i){
									if(allRegisters[i].indexOf(item.uid) >= 0){
										revenues[i] += rev;
										break;
									}
								}
							}
						}
					});
					cb();
			});
		}],
		function(err){
			if(err){
				next(err);
				return;
			}
			keystone.list("Summary").model.findOne({firstDate:firstDate,lastDate:lastDate}).exec(function(err,result){
				if(err)
				{
					next(err);
					return;
				} else if(result) {
					winston.debug("udpate summary");
					result.registers = registers.join(",");
					result.revenues = revenues.join(",");
					result.save(function(err){
						if(err){
							next(err);
							return;
						}
						next();
					});
				} else {
					var theSummary = {};
					theSummary.firstDate = firstDate;
					theSummary.lastDate = lastDate;
					theSummary.Revenue = 0;
					theSummary.EDAU = 0;
					theSummary.DAU = 0;
					theSummary.ARPU = 0;
					theSummary.ARPPU = 0;
					theSummary.PaidMan = 0;
					theSummary.PaidPercentage = 0;
					theSummary.LTV7 = 0;
					theSummary.LTV15 = 0;
					theSummary.logDate = date;
					theSummary.DNU = registers.length;
					theSummary.registers = registers.join(",");
					theSummary.revenues = revenues.join(",");
					var summaryModel = keystone.list("Summary");
					var summary = new summaryModel.model(theSummary);
					summary.save(function(err){
						if(err)
							winston.debug(err.toString());
						next();
					});
				}
			});
		}
		);
}
statisticalHandler.prototype.phaseStatisticalAll=function(options,next)
{
	var self = this;
	async.waterfall([
		function(cb){
			self.phaseStatistical(options.firstDate,options.lastDate,options.logDate,"",cb);
		},
		function(cb){
			self.phaseStatistical(options.firstDate,options.lastDate,options.logDate,"Not_CN",cb);
		}
		],function(err){
		next();
	});
}
exports = module.exports = statisticalHandler;
