var keystone = require("keystone"),
	async = require('async'),
	_ = require('underscore'),
	innLog = keystone.list("InnLog"),
	gameUser = keystone.list("GameUser"),
    util = require("util");
var manager = require("./manager");
var statistical = require("./statistical");
var _config = keystone.get("_config");
var whois = require("./util/whois");
var configTimeZone2 = require("../config/configuration_timezone2");
var fs = require("fs");
var utils = require("./util/utils");
var winston = require('winston');
var isServer = _config.isServer;
var globaldatas = require("./GlobalDatas");
var dbipcountryManager = require("./dbipcountryManager");
var payingInfo = keystone.list("PayingInfo");
var gameUser = keystone.list("GameUser");
var gameusers = {};
var willsaved = [];
var dbipcountry = new dbipcountryManager();
var GameUserManager = function(){
	manager.call(this);
	var self = this;
	self.datas = {};
	self.registerDatas={};
	self.userBindCountDatas = {};
	self.getHostNameDatas = {};
	self.buygemDatas = {};
};
util.inherits(GameUserManager,manager);
GameUserManager.prototype.GetHostNameByWhoise = function(logObj,theuser,next)
{
	if(!logObj||!theuser)
	{
		if(typeof next == "function")
		next();
		return;
	}
	var getHostName = function(theuser,next){
		var arrMsg = logObj.message.split(",");
		var country="";
		var i=0;

		var ip = arrMsg[0];
		var host=[["-h","whois.arin.net",ip],["-h","whois.ripe.net",ip],["-h","whois.apnic.net","-l",ip],["-h","whois.lacnic.net",ip]];
		var countrys=[];
		//winston.debug("#manager#gameUser# handle ip:%s,message:%s",ip,logObj.message);
		var getWhois = function(item,thenext)
		{
			whois.whois(item,function(err, data){
				var country = "";
				//winston.debug("#manager#gameUser#whois data:%s",JSON.stringify(data));
			    if(data&&(data.country||data.Country)){
			    	if(data["country"] instanceof Array)
			    	{
			    		country = data.country[data.country.length-1];
			    	}
			    	else
			    		country = data.country;
			    	if(data["Country"] instanceof Array)
			    	{
			    		country = data.Country[data.Country.length-1];
			    	}
			    	else
			    		country = data.Country;
			    }
			    if(country)
			    {
			    	countrys.push(country);
			    }
			    thenext();
			});
		};
		async.waterfall([
			function(cb){
				getWhois(host[0],cb);
			},
			function(cb){
				if(countrys.length>0)
				{
					cb();
					return;
				}
				getWhois(host[1],cb);
			},
			function(cb){
				if(countrys.length>0)
				{
					cb();
					return;
				}
				getWhois(host[2],cb);
			},
			function(cb){
				if(countrys.length>0)
				{
					cb();
					return;
				}
				getWhois(host[3],cb);
			}
			],function(err){
				country = "";
				if(countrys.length>1)
				{
					for(var i=0;i<countrys.length;i++){
						var found = false;
						for(var j=i+1;j<countrys.length;j++)
						{
							if(countrys[i].toUpperCase()==countrys[j].toUpperCase())
							{
								country = countrys[i];
								found = true;
								break;
							}
						}
						if(found)
						{
							break;
						}
					}
					if(!country)
						winston.debug("#manager#gameUser# can't not found country correct,countrys:%s",JSON.stringify(countrys));
				}
				else if(countrys.length==1)
				{
					country = countrys[0];
				}
				if(!country)
				{
					winston.error("#manager#gameUser# can't get country by whois,ip:%s,countrys:%s",ip,JSON.stringify(countrys));
				}
				next(err,theuser,country);
		});
	};
	var doIt = function(theuser){
		var thewhoisesize = keystone.get("whoiseSize");
		if(thewhoisesize&&thewhoisesize>_config.whoisesize)
		{
			// process.nextTick(function(){
			 	console.log("whois is full, goto nextTick");
			// 	doIt(theuser);
			// });
			
			setImmediate(doIt,theuser);
			return;
		}
		else
		{
			var whoisesite = keystone.get("whoiseSize");
			if(!whoisesite)
			{
				keystone.set("whoiseSize",1);
			}
			else
			{
				keystone.set("whoiseSize",++whoisesite);
			}						
			getHostName(theuser,function(err,theuser,country){
				//console.log("fdsa,data:%s",JSON.stringify(theuser));
				if(country=="GB" || country=="gb" || country=="UK" || country=="uk")
					country="GB";
				var whoisesite = keystone.get("whoiseSize");
				keystone.set("whoiseSize",--whoisesite);
				if(!theuser)
				{
					winston.error("#manager#gameUser# can't get GameUser:%s,logObj:%s",JSON.stringify(theuser),JSON.stringify(logObj));
					if(typeof next == "function")
					next();
					return;
				}
				keystone.list("GameUser").model.find({uid:theuser.uid}).exec(function(err,result){
					if(result.length==1)
					{
						//console.log("country:%s",country);
						result[0].country = country.toUpperCase();
						result[0].save(function(){

						});
					}

					if(typeof next == "function")
					next();
							
				});
			});
		}
	}
    process.nextTick(function(){
		doIt(theuser);
    });				
}
GameUserManager.prototype.updateGameUser = function(uid,timeStamp,maps,next){
	gameUser.model.update({uid:uid},{$inc:maps},function(err){
		if(err)
		{
			winston.info("#updateGameUser#error");
			utils.showErr(err);
		}
		next();
	})
}
GameUserManager.prototype.initPayingInfo = function(log){
	var self =this;
	
	if(!log)
	{
		winston.error("#gameUserManager#insertPayingInfo error,log:%s",JSON.stringify(log));
		return undefined;
	}
	if(!log.subType||log.subType!="buygem")
	{
		winston.error("#gameUserManager#insertPayingInfo error, log's subtype is not buygem,log:%s",JSON.stringify(log));
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
	var newPayingInfo = {
		timeStamp : log.timeStamp,
		orderId:orderid,
		gamer:"",
		innlog:innlogid,
		gem:gem,
		money:money,
		uid:uid,
		region:region
	};
	return newPayingInfo;
}
GameUserManager.prototype.databind = function(theuser,logObj,next)
{
	var self = this;
	var theuser = theuser;
	var logObj = logObj;
	var retention = keystone.get("retentionManager");
	async.waterfall([
		function(cb){
			//winston.debug("#gameUserManager#databind#1 ,%s",JSON.stringify(process.hrtime()));

			if(logObj.logType == "LogOut"&&logObj.timeStamp>theuser.timeStamp)
			{
				var arrMsg = logObj.message.split(",");
				var logTime = parseInt(arrMsg[0]);
				theuser.activetime += logTime;
			}
			if(logObj.logType == "TavernBuyGem"&&logObj.timeStamp>theuser.timeStamp)
			{
				var price = utils.GetProduct_Price("2",logObj.message);
				if(!theuser.user_pay_amt)
					theuser.user_pay_amt = 0;
				theuser.user_pay_amt += price;
				if(!theuser.user_pay_times)
					theuser.user_pay_times=0;
				theuser.user_pay_times ++;
				var nextday = self.showDailyEnd(Date.now()/1000);
				var nextday2 = self.showDailyEnd(theuser.timeStamp);
				if(nextday2!=nextday)
					theuser.user_pay_all = 0;
				theuser.user_pay_all = price;
				if(!theuser.firstpaydate)
				{
					theuser.firstpaydate = logObj.timeStamp;
				}
			}
			if(logObj.logType == "TavernBuyEnergy"&&logObj.timeStamp>theuser.timeStamp)
			{
				if(!theuser.eng_gem_cost)
					theuser.eng_gem_cost = 0;
				theuser.eng_gem_cost +=parseInt(logObj.R1);
			}
			if(logObj.logType == "DishCookFinish"&&logObj.R1!=0&&logObj.timeStamp>theuser.timeStamp)
			{
				if(!theuser.speed_gem_cost)
					theuser.speed_gem_cost = 0;
				theuser.speed_gem_cost+= parseInt(logObj.R1);
			}
			if(logObj.logType == "SmithMakeFinish"&&logObj.R1!=0&&logObj.timeStamp>theuser.timeStamp)
			{
				if(!theuser.fill_gem_cost)
					theuser.fill_gem_cost = 0;
				theuser.fill_gem_cost += parseInt(logObj.R1);
			}
			if(logObj.logType.indexOf("ShopPurchase")>=0&&logObj.R1!=0&&logObj.timeStamp>theuser.timeStamp)
			{
				if(!theuser.shop_gem_cost)
					theuser.shop_gem_cost = 0;
				theuser.shop_gem_cost += parseInt(logObj.R1);
			}
			if(logObj.logType == _config.logType.LogOut)
			{
				var logMsg = logObj.message.split(',');
				if(logMsg[0]&&logObj.timeStamp>theuser.timeStamp)
				{
					if(isNaN(theuser.activetime))
						theuser.activetime = 0;
					theuser.activetime += parseInt(logMsg[0]);
				}
				if(logMsg[2]) 
					theuser.advCount = logMsg[2];
				if(logMsg[3])
					theuser.lastQuest = logMsg[3];
				if(logMsg[4])
					theuser.tavernName = logMsg[4];
			}			
			if(logObj.logType == "Register")
			{
				theuser.registerdate = parseInt(logObj.timeStamp);
			}
			else
			{
				theuser.timeStamp = logObj.timeStamp;
				theuser.innExp = logObj.innExp;
				theuser.gembuy = logObj.gembuy;
				theuser.gemother = logObj.gemother;
				theuser.gold = logObj.gold;
				theuser.power = logObj.power;
				theuser.gameid = logObj.gameid;
				if(_.contains(["LogOn","LogOut"],logObj.logType))
				{
					theuser.lastlogdate = logObj.timeStamp*1000;
					theuser.lastlogtime = logObj.timeStamp;
				}
				theuser.registerdate = parseInt(logObj.userRegTime);
				theuser.pvpCoin = logObj.pvpCoin;
				theuser.odysseyCoin = logObj.odysseyCoin;
				theuser.sweepTicket = logObj.sweepTicket;
				theuser.gembuytotal = logObj.gembuytotal;
				theuser.gemothertotal = logObj.gemothertotal;
				theuser.guildCoin = logObj.guildCoin;
				theuser.fame = logObj.fame;
			}
			if(!isNaN(logObj.R2))
				theuser.region = logObj.R2;

			
			if(parseInt(theuser.gembuy)<0)
				theuser.gembuy = "0";
			if(parseInt(theuser.gemother)<0)
				theuser.gemother = "0";
		
			if(logObj.logType == "QuestFinish")
			{
				var arrMsg = logObj.message.split(",");
				if(arrMsg.length>=3)
				{
					var challengestar = parseInt(arrMsg[3]);
					var finishType = parseInt(arrMsg[1]);
					var quest_typeid = parseInt(arrMsg[0]);
					if(finishType == utils.quest_finishType.win)
					{	
						if(challengestar==utils.quest_challengeStar.normal&&theuser.lastQuestTypeId<quest_typeid)
						{
							theuser.lastQuestTypeId = quest_typeid;
						}
						if(challengestar==utils.quest_challengeStar.hard&&theuser.lastQuestTypeId<quest_typeid)
						{
							theuser.lastHardQuestTypeId = quest_typeid;
						}
					}
				}
			}
			if(logObj.logType == "QuestEliteFinish")
			{
				var arrMsg = logObj.message.split(",");
				if(arrMsg.length>=2)
				{
					var finishType = parseInt(arrMsg[1]);
					var questOdy_typeid = parseInt(arrMsg[0]);
					if(finishType == utils.questElite_finishType.win&&theuser.lastOdyQuestTypeId<questOdy_typeid)
					{
						theuser.lastOdyQuestTypeId = questOdy_typeid;
					}
				}
			}

			if(_.contains(["RevengeFinish","PvPFinish","BePvPFinish","PvPGet"],logObj.logType))
			{
				var arrMsg = logObj.message.split(",");
				var pvpScore = 0;
				if(logObj.logType=="PvPGet")
					pvpScore = parseInt(arrMsg[1]);
				else if(logObj.logType=="BePvPFinish")
					pvpScore = parseInt(arrMsg[3]);
				else if(logObj.logType=="PvPFinish")
					pvpScore = parseInt(arrMsg[3]);
				else if(logObj.logType =="RevengeFinish")
					pvpScore = parseInt(arrMsg[3]);
				if(!isNaN(pvpScore))
					theuser.pvp_score = pvpScore;
				else 
					theuser.pvp_score =0;
			}


			if(logObj.logType == _config.logType.userBindAccount)
			{
				var logMsg = logObj.message.split(",");
				if(logMsg[2])
				{
					theuser.bindAccout=[];
					theuser.bindAccout.push(logMsg[2]);
					theuser.markModified("bindAccout");
				}
					
				//console.log("theuser:%s",JSON.stringify(theuser));
			}
			if(logObj.logType == "GuildCreate2")
			{
				theuser.guildid = parseInt((logObj.message.split(","))[0]);
			}
			if(logObj.logType == "GuildBePermit")
			{
				theuser.guildid = parseInt((logObj.message.split(","))[1]);	
			}
			if(logObj.logType == "GuildExit2")
			{
				theuser.guildid = 0;
			}
			if(logObj.logType == "GuildNotify")
			{
				var arrMsg = logObj.message.split(",");
				if(arrMsg[0] == "6")
					theuser.guildid = 0;
			}

			cb();
		},
		function(cb){
			//console.log("logType:%s",logObj.logType);
			if(_.contains(_config.logType.buygem,logObj.logType))
			{
				if(!theuser.lastpaydate)
				{
					theuser.lastpaydate=0;
				}
				if(theuser.lastpaydate>=logObj.timeStamp)
				{
					cb();
					return;
				}
				keystone.list("PayingInfo").model.find({uid:theuser.uid}).count(function(err,count){
					keystone.list("GameUser").model.find({uid:theuser.uid}).exec(function(err,parmuser){
						if(parmuser&&parmuser[0])
						{
							parmuser[0].paidtime = count;
							parmuser[0].save(function(err){});
						}
					});
				});
				var arrMsg = logObj.message.split(",");
				if(arrMsg[1]=="m")
					theuser.m_card = parseInt(arrMsg[4]);
				var info = self.initPayingInfo(logObj);
				if(info==undefined)
				{
					cb();
					return;
				}
				info.gamer = theuser._id;
				var data_pay = new payingInfo.model(info);
				data_pay.save(function(err){
					if(err)
					{
						utils.showErr(err);
						winston.info("#gameUserManager#payingInfo saved error");
					}
					theuser.lastpaydate = logObj.timeStamp;
					cb();
				});
			}
			else{
				cb();
			}			
		},
		function(cb){
			//winston.debug("#gameUserManager#databind#2 ,%s",JSON.stringify(process.hrtime()));
			if(logObj.logType == "Statistical")
			{
				var jsonStr = logObj.message.substring(0,logObj.message.lastIndexOf("_"));
				var jsonData = {};
				try{
					jsonData = JSON.parse(jsonStr);
				}
				catch(err)
				{
					winston.info("#gameUserManager#json parse error,jsonStr:%s");
				}
				if(jsonData.advs)
				{
					if(!theuser.advs)
						theuser.advs=[];					
					_.each(jsonData.advs,function(adv){
						var baseAdv = _.find(theuser.advs,function(theadv){
							return adv.instId == theadv.instId;
						});
						if(!baseAdv)
						{
							theuser.advs.push(adv);
						}
						else
						{
							baseAdv.typeId = theuser.typeId;
							baseAdv.instId = theuser.instId;
							baseAdv.islegend = theuser.islegend;
							baseAdv.star = theuser.star;
							baseAdv.equipSet = theuser.equipSet;
							baseAdv.uid = theuser.uid;
							baseAdv.level = theuser.level;
							baseAdv.rating = theuser.rating;
						}
					});
				}
				if(jsonData.tavernlevel)
				{
					theuser.tavernlevel = parseInt(jsonData.tavernlevel);
				}
				theuser.markModified("advs");
				cb();
			}
			else
			{
				cb();
			}
		},
		function(cb){
			//winston.debug("#gameUserManager#databind#3 ,%s",JSON.stringify(process.hrtime()));
			if(logObj.logType == _config.logType.getHostName || logObj.logType == "LogInLog" || logObj.logType == "RegisterLog")
			{
				//self.GetHostName(logObj,theuser);
				//winston.info("#manager#gameUser#begin compare dbipcountry");
				
				var arrMsg = logObj.message.split(",");
				var ip = "";
				theuser.device_type = arrMsg[6];
				theuser.device_id = arrMsg[5];
				if(logObj.logType == _config.logType.getHostName)
					ip = arrMsg[0];				
				else if(logObj.logType == "LogInLog" || logObj.logType == "RegisterLog")
				{
					ip = arrMsg[1];
					theuser.lastlogin_app_ver = arrMsg[2];
					theuser.lastlogin_OS_ver = arrMsg[3];
				}

					
				if(arrMsg[8])
				{
					var timezone = arrMsg[8];
					if(configTimeZone2[timezone])
					{
						theuser.timezone = configTimeZone2[timezone];
					}
					else
					{
						var arrTimezone = timezone.split(":");
						timezone = arrTimezone[0].substring(arrTimezone[0].length-3);
						if(parseInt(arrTimezone[1])!=0)
							timezone = parseInt(timezone) + 0;
						else
							timezone = parseInt(timezone);
						if(!isNaN(timezone))
							theuser.timezone = timezone;
						else 
							theuser.timezone = 0;
					}
				}
				theuser.lastlogin_ip = ip;
				if(theuser.country&&theuser.country.length>0)
				{
					cb();
				}
				else
				{
					dbipcountry.compare(ip,function(country){
						//winston.info("#manager#gameUser#over compare dbipcountry,$s",ip);
						if(country&&country.length>0)
						{
							theuser.country = country.toUpperCase();
							logObj.country = theuser.country;
						}
						else
							winston.error("#manager#gameUser#get country error,ip:%s,country:%s",ip,country);
						retention.getRetention(logObj, function(log){
							if (log) {
								log.country = theuser.country;
								log.timezone = theuser.timezone;
								log.save(function(){
									//winston.info("country retionmanager add");
									cb();
								});
							}
							else
								cb();
						});
					});					
				}
			}
			else
			{
				cb();
			}
		}
		],function(){
		theuser.save(function(err,result){
			if (err) {
					console.error(new Date() + "#update userData error#"+ JSON.stringify(err)+"#theuser:"+JSON.stringify(theuser));
				};	
				next();
		});
	});
	//console.log("update user %s,",theuser.uid);
}
GameUserManager.prototype.InsertInnLog_v2 = function(logObj,next)
{
	var self = this;
	if(gameusers[logObj.uid])
	{
		var parm = {};
		async.waterfall([
			function(cb){
				self.databind(parm,logObj,cb);
			},
			function(){

			}
			],function(){

			});
	}
}
GameUserManager.prototype.InsertInnLog_PvPStatistical = function(logObj,next)
{
	if(!logObj.logType||logObj.logType!="PvPStatistical")
	{
		next();
		return;
	}
	var jsonParm = {};
	try{
		 jsonParm = JSON.parse(logObj.message.substring(0,logObj.message.length-2));
	}
	catch(err){
		utils.showErr(err);
		winston.info("#gameUserManager#InsertInnLog#error json.parse,%s",logObj.message);
		next();
		return;
	} 
	var willsaved = [];
	_.each(jsonParm.users,function(user){
		willsaved.push(user);
	});
	var i = 0;
	async.whilst(
		function(){
			return i<willsaved.length;
		},
		function(callback){
			var theuser = willsaved[i];
			keystone.list("GameUser").model.update({uid:theuser.uid},{$set:{pvp_wincount:theuser.pvpwincount,pvp_totalcount:theuser.pvptotalcount,pvp_rank:theuser.pvprank,pvpfp:theuser.pvpfp,pvp_rank_type:jsonParm.rankType,pvp_score:theuser.pvpscore}},function(err){
				if(err)
				{
					winston.info("#gameUserManager#InsertInnLog_PvPStatistical#error");
					utils.showErr(err);
				}
				i++;
				callback();
			});			
		},
		function(){
			next();
		}
		);
}
GameUserManager.prototype.InsertInnLog = function(logObj,cb){
	
	var self= this;
	if(!logObj)
	{
		winston.info("logObj's has nod uid,%s",utils.stringify(logObj));
		cb();
		return;
	}
	// if(!(_.contains(_config.logType.updateUser,logObj.logType)))
	// {
	 	//winston.info("this logType not in logtype.updateUser,%s",utils.stringify(logObj));
	// 	cb();
	// 	return;
	// }

	gameUser.model.find({uid:logObj.uid}).exec(function(err,results){
		if(results[0])
		{
			var theuser = results[0];
			
			self.databind(theuser,logObj,cb);
		}
		else 
		{
			var parm ={};
			parm.uid=logObj.uid;
			parm.gameid = logObj.gameid;
			
			parm.userRegTime=logObj.userRegTime;
			parm.innExp=logObj.innExp;
			parm.gembuy=logObj.gembuy;
			parm.gemother=logObj.gemother;
			parm.gold=logObj.gold;
			parm.power=logObj.power;
			parm.lastlogtime=logObj.timeStamp;
			parm.lastlogdate=logObj.timeStamp;
			
			if(logObj.R2&&!isNaN(logObj.R2))
				parm.region = logObj.R2;
			if(logObj.logType=="RegisterLog"||logObj.logType=="LogInLog")
			{
				var arrStr = logObj.message.split(',');
				parm.username=arrStr[0];
			}
			parm.activetime=0;
			parm.registerdate = parseInt(logObj.timeStamp);
			var userData = new gameUser.model(parm);
			//console.log("insert user %s,",parm.uid);
			async.waterfall([
				function(cbb){
					userData.save(function(err,user){
						if (err) {
							winston.info("insert GameUser error");
							utils.showErr(err);
						};
						gameusers[parm.uid] = {uid:user.uid,username:user.username,lastlogin_ip:"0.0.0.0",_id:user._id};
						cbb(err);
					});
				},
				function(cbb){
					self.InsertInnLog(logObj,cbb);
				}
				],function(){
					cb();
			});
		}
	});
}
GameUserManager.prototype.updateHistory = function(cb){
	keystone.list("GameUser").model.find({$or:[{country:{$exists:false}},{country:""}]}).exec(function(err,results){
		var i=0;
		if(!results||results.length==0)
		{
			cb();
			return;
		}
		async.whilst(
			function(){return i<results.length},
			function(callback){
				var user = results[i];
				keystone.list("InnLog").model.findOne({uid:user.uid,logType:"LogInLog"}).exec(function(err,log){
					if(!log||!log.message)
					{
						i++;
						callback();
						return;
					}
					
					var arrmsg = log.message.split(",");
					var ip = arrmsg[1];
					var dbipcountry = new dbipcountryManager();
					dbipcountry.compare(ip,function(country){
						//winston.info("#manager#gameUser#over compare dbipcountry,$s",ip);
						if(country)
						{
							user.country = country;
							user.save(function(){
								i++;
								callback();
							})
						}
						else{
							winston.error("#manager#gameUser#get country error2,ip:%s",ip);
							i++;
							callback();
						}
					});					
				});
			},
			function(err){
				cb();
			}
			);
	});
}

GameUserManager.prototype.saveNewOne_byLogInLog = function(thelog,cb)
{
			var parm = {};
			var arrStr = thelog.message.split(",");
			parm.uid = thelog.uid;
			parm.timeStamp = parseInt(new Date()/1000);
			parm.username = arrStr[0];
			parm.userRegTime = thelog.userRegTime;
			parm.innExp = thelog.innExp;
			parm.gembuy = thelog.gembuy;
			parm.gemother = thelog.gemother;
			parm.gold = thelog.gold;
			parm.power = thelog.power;
			parm.lastlogtime = parm.lastlogdate = thelog.timeStamp;
			parm.registerdate = parseInt( parm.userRegTime);

			if(thelog.R2&&!isNaN(thelog.R2))
			{
				parm.region = thelog.R2;
			}
			parm.activetime = 0;
			var userData = new keystone.list("GameUser").model(parm);
			keystone.list("GameUser").model.find({uid:parm.uid}).count(function(err,count){
				if(count>0)
				{
					userData.save(function(err){
						utils.showErr(err);
						cb();
					});					
				}
				else
					cb();
			});
}
GameUserManager.prototype.removeRepeatUser = function(cb){
	keystone.list("GameUser").model.aggregate([{$group:{_id:"$uid",count:{$sum:1}}},{$match:{count:{$gt:1}}}]).exec(function(err,results){
		var uids = [];
		_.each(results,function(user){
			uids.push(user._id);
		});
		winston.info("repeatedUser.length:%s",uids.length);
		keystone.list("GameUser").model.find({uid:{$in:uids}}).exec(function(err,userResults){
			var willremoved = [];
			for(var i=0;i<userResults.length;i++)
			{
				var thisuser = userResults[i];

					_.each(userResults,function(theotheruser){
						if(theotheruser.uid == thisuser.uid&&theotheruser._id!=thisuser._id)
							willremoved.push(theotheruser._id);
					});
				
			}
			willremoved = _.union(willremoved);
			winston.info("removing null gameusers ,%s",JSON.stringify(willremoved));
			keystone.list("GameUser").model.find({_id:{$in:willremoved}}).remove(function(){
				cb();
			});
		});
	});
}
GameUserManager.prototype.datas={};
GameUserManager.prototype.registerDatas={};
GameUserManager.prototype.userBindCountDatas={};
GameUserManager.prototype.getHostNameDatas={};
GameUserManager.prototype.buygemDatas={};
GameUserManager.prototype.updateAll_Country = function(next){
	var self =this;
	keystone.list("GameUser").model.find({$or:[{country:{$exists:false}},{country:""}]}).distinct("uid").exec(function(err,uids){
		if(!uids||uids.length==0)
		{
			next();
			return;
		}
		keystone.list("InnLog").model.aggregate([{$match:{logType:"LogInLog",uid:{$in:uids}}},{$group:{_id:"$uid",message:{$last:"$message"}}}]).exec(function(err,results){
			if(!results || results.length == 0)
			{
				next();
				return;
			}
			var i=0;
			
			async.whilst(
				function(){return i < results.length},
				function(callback){
					var log = results[i];
					var arrmsg = log.message.split(",");
					var ip = arrmsg[1];
					
					dbipcountry.compare(ip,function(country){
						//winston.info("#manager#gameUser#over compare dbipcountry,$s",ip);
						if(country&&country.length>0)
						{
							keystone.list("GameUser").model.update({uid:log._id},{$set:{country:country}},function(){
								i++;
								callback();
							});
						}
						else{
							winston.error("#manager#gameUser#get country error2,ip:%s",ip);
							i++;
							callback();
						}
					});		
				},
				function(err){
					next();
				}
			);
		});
	});
}

GameUserManager.prototype.updateRegisterAllByLog = function(logs,next){
	var self = this;
	var arrGameUser = [];
	var updateGameUsers = [];
	var innlogmanager = require("./innlogManager");
	var im = new innlogmanager();
	_.each(logs,function(logObj){
		if (typeof logObj != "string") {
			//console.log("msg:%s",msg);
			logObj = new Buffer(logObj);
			logObj = logObj.toString();
		}
		logObj = logObj.substring(logObj.indexOf(".log:")+5)
		logObj = im.getJSONByMsg(logObj);
		if(!gameusers[logObj.uid])
		{
			var parm ={};
			parm.uid=logObj.uid;
			parm.gameid = logObj.gameid;
			var arrStr = logObj.message.split(',');
			parm.username=arrStr[0];
			parm.userRegTime=logObj.userRegTime;
			parm.innExp=logObj.innExp;
			parm.gembuy=logObj.gembuy;
			parm.gemother=logObj.gemother;
			parm.gold=logObj.gold;
			parm.power=logObj.power;
			parm.lastlogtime=logObj.timeStamp;
			parm.lastlogdate=logObj.timeStamp;
			
			if(logObj.R2&&!isNaN(logObj.R2))
				parm.region = logObj.R2;
			parm.activetime=0;
			parm.registerdate = parseInt(logObj.timeStamp);
			arrGameUser.push(parm);
		}
		else
		{
			var parm ={};
			parm.registerdate = parseInt(logObj.timeStamp);
			parm.userRegTime =logObj.userRegTime;
			parm.uid = logObj.uid;
			updateGameUsers.push(parm);
		}
	});
	async.waterfall([
		function(cb){
			if(arrGameUser.length==0)
			{
				cb();
				return;
			}
			var bulk = keystone.list("GameUser").model.collection.initializeOrderedBulkOp();
			_.each(arrGameUser,function(user){
				bulk.insert(user);
			});
	      	bulk.execute(function(err,result) {
	      		if(err){
	      			winston.info("batchInsertGameUser fail");
	      			utils.showErr(err);
	      		}
	      		cb();
	      	});			

		},
		function(cb){
			var i=0;
			async.whilst(
				function(){
					return i<updateGameUsers.length;
				},
				function(callback){
					thisone = updateGameUsers[i];
					keystone.list("GameUser").model.update({uid:thisone.uid},{$set:{registerdate:thisone.registerdate}},function(){
						i++;
						callback();
					});
				},
				function(err){
					cb();
				}
				);
		}
		],function(){
		next();
	});
}
GameUserManager.prototype.initGameUser = function(next){
	var self = this;
	
	async.waterfall([
		function(cb){
			var keys = _.keys(gameusers);
			if(keys.length>0)
			{
				cb();
				return;
			}		
			keystone.list("GameUser").model.find().select("_id uid username").exec(function(err,results){
				if(err)
				{
					utils.showErr(err);
					winston.info("#gameUserManager# Error");
				}
				_.each(results,function(user){
					gameusers[user.uid] = user;
					gameusers[user.uid].lastlogin_ip = "0.0.0.0";
				});
				cb();
			});
		}
		],function(){
			next();
	});
}
GameUserManager.prototype.updateAll = function(next){
	var self = this;
	var stream = keystone.list("InnLog").model.find({logType:{$in:["RegisterLog"]},timeStamp:{$gte:1470009600}}).sort({timeStamp:1}).stream();
	var cache = [];
    stream.on('data',function(item){
        cache.push(item);
        if(cache.length==10000){
            /** signal mongo to pause reading **/
            stream.pause();
            
            doLotsWork(cache,function(){
                cache=[];
                /** signal mongo to continue, fetch next record **/
                console.log("over get 10000");
                stream.resume();
            });
            
        }
    });
    stream.on('end',function(){ console.log('query ended'); });
    stream.on('close',function(){ console.log('query closed');
                 doLotsWork(cache,function(){
                    cache=[];
                    /** signal mongo to continue, fetch next record **/
                    console.log("over get ");
                    
                    var datasKeys = _.keys(self.datas);
                    async.waterfall([
                    	function(cb){
                    		winston.info("#manager#gameUser#getRegisterInfo");
                    		var registerKeys = _.keys(self.registerDatas);
                    		var i=0;

                    		async.whilst(
                    			function(){return i<registerKeys.length},
                    			function(callback){
                    				self.InsertInnLog(self.registerDatas[registerKeys[i]],function(){
                    					i++;
                    					callback();
                    				});
                    			},
                    			function(err){
                    				cb();
                    			}
                    			);
                    	},
                    	function(cb){
                    		winston.info("#manager#gameUser#getHostNameDatas");
                    		var datasKeys = _.keys(self.getHostNameDatas);
                    		var i=0;
                    		async.whilst(
                    			function(){return i<datasKeys.length},
                    			function(callback){
                    				self.InsertInnLog(self.getHostNameDatas[datasKeys[i]],function(){
                    					i++;
                    					callback();
                    				});
                    			},
                    			function(err){
                    				cb();
                    			}
                    			);                    		
                    	},
                    	function(cb){
                    		winston.info("#manager#gameUser#userBindCountDatas");
                    		var datasKeys = _.keys(self.userBindCountDatas);
                    		var i=0;
                    		async.whilst(
                    			function(){return i<datasKeys.length},
                    			function(callback){
                    				self.InsertInnLog(self.userBindCountDatas[datasKeys[i]],function(){
                    					i++;
                    					callback();
                    				});
                    			},
                    			function(err){
                    				cb();
                    			}
                    		);                    		
                    	},
                    	function(cb){
                    		winston.info("#manager#gameUser#buygedatas");
                    		var datasKeys = _.keys(self.buygemDatas);
                    		var i=0;
                    		async.whilst(
                    			function(){return i<datasKeys.length},
                    			function(callback){
                    				self.InsertInnLog(self.buygemDatas[datasKeys[i]],function(){
                    					i++;
                    					callback();
                    				});
                    			},
                    			function(err){
                    				cb();
                    			}
                    			);                    		
                    	},                    	
                    	function(cb){
                    		winston.info("#manager#gameUser#getUpdateInfo");
                    		var datasKeys = _.keys(self.datas);
                    		var i=0;
                    		async.whilst(
                    			function(){return i<datasKeys.length},
                    			function(callback){
                    				self.InsertInnLog(self.datas[datasKeys[i]],function(){
                    					i++;
                    					callback();
                    				});
                    			},
                    			function(err){
                    				cb();
                    			}
                    			);                    		
                    	}                    	
                    	],function(err){
                    	next();
                    });
                   // stream.resume();
                });   	
     });

function doLotsWork(records,callback){
    //.....do lots of work
    //.....
    //all done, ready to deal with next 10 records
    var i=0;
    _.each(records,function(innlog){
    	if(innlog.logType=="Register")
    		self.registerDatas[innlog.uid]=innlog;
    	else if(innlog.logType==_config.logType.getHostName)
    		self.getHostNameDatas[innlog.uid]=innlog;
    	else if(innlog.logType==_config.logType.userBindAccount)
    		self.userBindCountDatas[innlog.uid] =innlog;
    	else if(_.contains(_config.logType.buygem,innlog.logType))
    		self.buygemDatas[innlog.uid] = innlog;
    	else
    		self.datas[innlog.uid]=innlog;
    });
    callback();
}
	// var writer = getWritableStreamSomehow();
	// stream.pipe(writer);

	//keystone.list("InnLog").model.find({logType:{$in:_config.logType.updateUser}}).stream().pipe();
		// var getIt = function(i,cb){
		// 	var theLog = results[i];
		// 	self.InsertInnLog(theLog,function(){
		// 		if(++i<results.length)
		// 			getIt(i,cb);
		// 		else
		// 		{
		// 			console.log("update GameUser  Success!");
		// 			cb();
		// 		}
		// 	});
		// }

	// gameUser.model.find().sort({lastlogdate:1}).exec(function(err,results){
	// 	if (err) {
	// 		console.error(new Date()+"#gameUserManager.updateAll is error !");
	// 		cb();
	// 		return;
	// 	};
	// 	//console.log(new Date()+"#gameUserManager.updateAll begin!!! result.count:%s",results.length);
	// 	self.datas = results;
	// 	self.updateRecursiveByIds(0,function(){
	// 		//console.log("update GameUser  Success!");
	// 		cb();
	// 	});
		
	// })
}

exports = module.exports = GameUserManager;
module.exports.getTop5Adv = function(user)
{
	var top5 = [];
	var advs = _.sortBy(user.advs,"rating");
	if(advs.length<=5)
	{
		return advs;
	}
	else
	{
		for(var i=advs.length-1;i>=advs.length-6;i--)
		{
			top5.push(advs[advs.length-i]);
		}
		return top5;
	}
}
module.exports.Get_User_Eqp_Rating_Avg = function(top5)
{
	if(!top5||top5.length==0)
	{
		return 0;
	}
	var result = 0;
	_.each(top5,function(adv){
		if(adv&&adv.equipSet)
		result+=adv.equipSet;
	})
	return parseFloat((result/top5.length).toFixed(2));
}
module.exports.Get_User_Star_rating_Avg = function(top5){
	
	if(!top5||top5.length==0)
	{
		return 0;
	}
	var result = 0;
	_.each(top5,function(adv){
		if(adv&&adv.star)
		result+=adv.star;
	})
	return parseFloat((result/top5.length).toFixed(2));	
}
module.exports.Get_User_Lv_Rating_Avg = function(top5){
	
	if(!top5||top5.length==0)
	{
		return 0;
	}
	var result = 0;
	_.each(top5,function(adv){
		if(adv&&adv.level)
		result+=adv.level;
	})
	return parseFloat((result/top5.length).toFixed(2));		
}
module.exports.Get_User_Power_Sum = function(top5){
	
	if(!top5||top5.length==0)
	{
		return 0;
	}
	var result = 0;
	_.each(top5,function(adv){
		if(adv&&adv.rating)
		result+=adv.rating;
	})
	return result;
}
module.exports.getGameUser = function(uid,next){
	async.waterfall([
		function(cb){
			if(gameusers[uid])
			{
				gameuser = gameusers[uid];
				cb();
				return;
			}
			keystone.list("GameUser").model.find({uid:uid}).exec(function(err,data){
				gameuser = _.pick(data[0],"uid","username","_id");
				gameuser.lastlogin_ip = "0.0.0.0";
				gameusers[uid] = gameuser;
				cb();
			});
		}
		],function(err){
		next(gameuser);
	});
}
module.exports.demo = function()
{
	console.log("##gameUserManager#gameuser:%s",JSON.stringify(gameusers));
}
module.exports.setGameUser = function(options,next){
	if(!gameusers[options.uid])
	{
		this.getGameUser(options.uid,function(gameuser){
			gameuser.lastlogin_ip = options.ip;
			next(gameuser);
		});
	}
	else
	{
		gameusers[options.uid].lastlogin_ip = options.ip;
		gameusers[options.uid].uid = options.uid;
		next(gameusers[options.uid]);
	}
	//console.log("#gameUserManager#gameusers:%s",JSON.stringify(gameusers));	
}
