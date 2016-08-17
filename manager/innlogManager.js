	var keystone = require('keystone');
	var _ = require("underscore");
	var hexy = require("hexy");
	var async = require('async');
	var isDebug = false;
	var _config = keystone.get("_config");
	var net = require('net');
	var utils = require("./util/utils");
	var cachedManager = require("./CachedManager");
	var globaldatas = require("./GlobalDatas");
	var gameUserManager = require("./gameUserManager");
	var gameconfigExchange = require("./GameConfigExchange");
	var guildManager = require("./GuildManager");
	var statsdManager = require("./statsdManager");


	var winston = require("winston");



	var user_register = require("./databases/mysql/user_register");
	var ipo_config = require("../config/IPO_config");
	var login = require("./databases/mysql/login");
	var register = require("./databases/mysql/register");
	var res_log_Food = require("./databases/mysql/res_log_Food");
	var res_log_itm = require("./databases/mysql/res_log_itm");	
	var res_log_Eqp = require("./databases/mysql/res_log_Eqp");
	var Act_log_Adv = require("./databases/mysql/Act_log_Adv");
	var Act_log_odsy = require("./databases/mysql/Act_log_odsy");
	var Act_log_Arena = require("./databases/mysql/Act_log_Arena");
	var Sys_orders = require("./databases/mysql/Sys_orders");
	var Sys_Store = require("./databases/mysql/Sys_Store");
	var Sys_Summon = require("./databases/mysql/Sys_Summon");

	var res_log_gem = require("./databases/mysql/res_log_gem");
	var res_log_coin = require("./databases/mysql/res_log_coin");
	var res_log_PvPCoin = require("./databases/mysql/res_log_PvPCoin");
	var res_log_energy = require("./databases/mysql/res_log_energy");
	var res_log_GldCoin =require("./databases/mysql/res_log_GldCoin");
	var res_log_OdsyCoin = require("./databases/mysql/res_log_OdsyCoin");
	var res_log_AreaPt = require("./databases/mysql/res_log_AreaPt");
	var res_log_VIP = require("./databases/mysql/res_log_VIP");
	var res_log_Fame = require("./databases/mysql/res_log_Fame");
	var res_log_EXP = require("./databases/mysql/res_log_EXP");
	var res_log_Food = require("./databases/mysql/res_log_Food");
	var res_log_itm = require("./databases/mysql/res_log_itm");	
	var res_log_Eqp = require("./databases/mysql/res_log_Eqp");

	var isServer = _config.isServer;
	var vipsMaxGem = "";
	var innlogManager = function(){

	}
	var filterLogType = ["RoomAdd","StorageAdd","StorageRemove","SubGemBuy","SubGemOther","BuyGemBuy","BuyGemOther"];
	var index_i=0;
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
		"FM":"fame",
		"QC":"queenCoin"};
	innlogManager.prototype.getJSONByMsg = function(msg){
			////console.log("length:"+count+":"+"getJSONMSG:"+msg);
			var parm = msg.split(",");
			var result = {};
			if (parm.length>15) {
				result.logDate = parm[0];
				if (parm[0].length==18) {
					//console.log("msg problem:"+msg);
				};
				result.timeStamp = parm[1];
				result.gameid = parm[2];
				result.uid = parm[3];
				result.userRegTime = parm[4];
				result.logType = parm[5];

				var numericals = parm[6];
				numericals = numericals.split(":");
				for(var i=0;i<numericals.length;i++)
				{
					var numerical = numericals[i];
					numerical = numerical.split("_");
					if(numerical.length!=2)
						continue;
					result[mapping_currency[numerical[0]]] = numerical[1];
				}
				result.subType = parm[7];
				result.code = parm[8];
				result.R1 = parm[9];
				result.R2 = parm[10];
				result.R3 = parm[11];
				result.R4 = parm[12];
				result.R5 = parm[13];
				result.R6 = parm[14];
				var msg = "";
				for(var i=15;i<parm.length;i++)
				{
					msg+=parm[i]+",";
				}
				msg = msg.substring(0,msg.length-1);
				result.message = msg;
				return result;
			}
			else
				return null;
		}
	innlogManager.prototype.baseRemove = function(uid,timeStamp,logType,msg,cb){
		var innLog   = keystone.list('InnLog');
		innLog.model.find().where("uid",uid).where("timeStamp",timeStamp).where("logType",logType).where("message",msg).remove(function(err,product){
	   			if (err) {
	   				return handleError(err);
	   			};
	   			////console.log("removeInnlog success");
	       		cb();
	   		});
	}
	var cache = [];
	var isbegin = false;
	innlogManager.prototype.insertLogByQueue_test = function(msg,session){
		var self = this;
		var i=0;
		cache.push(msg);
		//console.log("inter insertLogByQueue");
		if(isbegin==false)
		{
			isbegin = true;
			var insertIt = function(){
				var parm = cache.shift();
				if(parm)
				{
					//console.log("will handle msg:%s");

					self.insertLog_only(parm,session,false,function(){
						i++;
						if(i%10000==0)
						{
							winston.info("over insertLogByQueue %s",i);
						}
						
					});
					insertIt();
				}
				else
				{
					isbegin = false;
				}
			}
			insertIt();
		}
	}
	innlogManager.prototype.insertLogAll = function(msg,session){
		var self = this;
		if(_config.innSite.isGame)
		{
			self.insert_game(msg,self.initOptions(),function(){

			});
		}
		if(_config.innSite.isOther)
		{
			self.insert_other(msg,self.initOptions(),function(){

			});
		}
		if(_config.innSite.isBase)
		{
			self.insertLog_only(msg,session,false,function(){
				
			});
		}
	}

	innlogManager.prototype.insertLogByQueue = function(msg,session){
		var self = this;
		cache.push(msg);
		if(isbegin==false)
		{
			var insertIt=  function(){};
			isbegin = true;
			if(_config.innSite.isGame)
			{
				insertIt = function(){
					var parm = cache.shift();
					if(parm&&parm.length>0)
					{
						//console.log("will handle msg:%s");

						self.insert_game(parm,self.initOptions(),function(){
							insertIt();	
						});
						
					}
					else
					{
						isbegin = false;
					}
				}	
			}
			if(_config.innSite.isOther)
			{
				insertIt = function(){
					var parm = cache.shift();
					if(parm&&parm.length>0)
					{
						//console.log("will handle msg:%s");

						self.insert_other(parm,self.initOptions(),function(){
							insertIt();	
						});
						
					}
					else
					{
						isbegin = false;
					}
				}	
			}
			if(_config.innSite.isCalculate)
			{
				insertIt = function(){
					var parm = cache.shift();
					if(parm&&parm.length>0)
					{
						//console.log("will handle msg:%s");
						var log = this.initLog(parm);
						//console.log("only log,index:%s",(++index_only));
						if(!log)
						{
							insertIt();	
							return;
						}							
						keystone.get("statisticalManager").dailyStatistical_RealTime(log,function(){
							insertIt();	
						});
					}
					else
					{
						isbegin = false;
					}
				}	
			}
			if(_config.innSite.isBase)
			{
				insertIt = function(){
					var parm = cache.shift();
					if(parm&&parm.length>0)
					{
						//console.log("will handle msg:%s");

						self.insertLog_only(parm,null,false,function(){
							insertIt();	
						});	
					}
					else
					{
						isbegin = false;
					}
				}				
			}
			insertIt();
		}				
	}
	innlogManager.prototype.insertData = function(){
		var self = this;
	
	}
	innlogManager.prototype.initOptions = function(){
		var options = {};
		options.hasStatsd = false;

		options.hasMysql = false;

		options.hasIPO = false;

		options.hasLogTime = false;
		return options;

	}
	innlogManager.prototype.initLog = function(msg,session,isJudge)
	{
			var self =this;
			
			if(!msg || msg == undefined)
			{
				
				winston.info("#innlogManager#msg is undefined");
				return "";
			}
			if (typeof msg != "string") {
				////console.log("msg:%s",msg);
				msg = new Buffer(msg);
				msg = msg.toString();

			}
			if(msg.indexOf(".log:")>-1)
				msg = msg.substring(msg.indexOf(".log:")+5);
			//if(_.contains(_config.uidFilter,parseInt(msg.uid)))
			//{
			//	//console.log("uid:%s has in uidFilter,continue...",msg.uid);
			//	cb();
			//	return;
			//} 
			if (msg.length>10) {
				var parm = this.getJSONByMsg(msg);
				//过滤无用logType

				//winston.debug("the parm is :%s",JSON.stringify(parm));
				if (parm==null) {
					if(session)
						winston.error("Error adding innLog,parm is null,msg="+msg+",offset:"+JSON.stringify(session));
					else
						winston.error("Error adding innLog,parm is null,msg="+msg);
					return "";
				};

				if(_.contains(filterLogType,parm.logType))
				{
					//console.log("#innlogManager# logType is %s",parm.logType);
					return "";
				}
				var innLog   = keystone.list('InnLog');
				////console.log("JSONMSG:"+JSON.stringify(parm));

					//filter
					
				var newLog = new innLog.model(parm);
				return newLog;
			}
			else
			{
				return "";
			}

	}
	innlogManager.prototype.insertLog_only = function(msg,session,isJudge,cb){
		var newLog = this.initLog(msg,session,isJudge);
		if(newLog)
		{
			newLog.save(function(err)
			{
				if(err)
				{
					winston.info("save innlog error,log:%s",JSON.stringify(newLog));
					utils.showErr(err);
				}					
				//else
					//console.log("saved log:%s",++index_i);
				cb();
			});	
		}
		else
		{
			cb();
		}
	}
	innlogManager.prototype.insertLog = function (msg,session,isJudge,next){
		var newLog = this.initLog(msg,session,isJudge);
		if(newLog)
		{
			async.waterfall([
				function(cb){
					newLog.save(function(err)
					{
						if(err)
						{
							winston.info("save innlog error,log:%s",JSON.stringify(newLog));
							utils.showErr(err);
						}
						//else
							//console.log("saved log:%s",++index_i);
						cb();
					});	
				},
				function(cb){
					keystone.get("innlogManager").preSave(newLog,keystone.get("innlogManager").initOptions(newLog),function(){
						cb();
					});					
				}
				],function(){
					next();
				});

		}
		else
		{
			next();
		}
	}

	innlogManager.prototype.Res_log_to_mysql = function(log,currencys,next)
	{
		var self = this;

		
		async.waterfall([
			function(cb){
				//console.log("begin Res_log_to_mysql 1");
				var gem_change = null;
				if(currencys["gembuy"])
					gem_change+=parseInt(currencys["gembuy"]);
				if(currencys["gemother"])
					gem_change+=parseInt(currencys["gemother"]);
				if(gem_change!=null)
				{
					var gem_fin = log.gembuy+log.gemother;
					gameUserManager.getGameUser(log.uid,function(gameuser){
						var gem = new res_log_gem({
							User_ID:log.uid,
							User_DvcID:gameuser.username,
							User_Server:log.gameid,
							Crt_DT:(new Date(log.timeStamp*1000)).format(),
							region_id:parseInt(log.R2),
							Gem_Change:gem_change,
							Gem_Fin:gem_fin,
							Gem_Reason:log.logType
						});
						gem.save(cb);
					});
				}
				else
				{
					cb();
				}
			},
			function(cb){
				//console.log("begin Res_log_to_mysql 2");
				var coin_change = 0;
				if(currencys["gold"])
				{
					coin_change+=parseInt(currencys["gold"]);
					var coin_fin = log.gold;
					gameUserManager.getGameUser(log.uid,function(gameuser){
						var coin = new res_log_coin({
							User_ID:log.uid,
							User_DvcID:gameuser.username,
							User_Server:log.gameid,
							region_id:parseInt(log.R2),
							Crt_DT:(new Date(log.timeStamp*1000)).format(),
							Coin_Change:coin_change,
							Coin_Fin:coin_fin,
							Coin_Reason:log.logType
						});
						coin.save(cb);
					});				
				}
				else
					cb();
			},
			function(cb){
				//console.log("begin Res_log_to_mysql 3");
				var change = 0;
				if(currencys["pvpCoin"])
				{
					change+=parseInt(currencys["pvpCoin"]);
					var fin = log.pvpCoin;
					gameUserManager.getGameUser(log.uid,function(gameuser){
						var res_log = new res_log_PvPCoin({
							User_ID:log.uid,
							User_DvcID:gameuser.username,
							User_Server:log.gameid,
							region_id:parseInt(log.R2),
							Crt_DT:(new Date(log.timeStamp*1000)).format(),
							PvPCoin_Change:change,
							PvPCoin_Fin:fin,
							PvPCoin_Reason:log.logType
						});
						res_log.save(cb);
					});					
				}
				else
					cb();
			},
			function(cb){
				//console.log("begin Res_log_to_mysql 4");
				var change = 0;
				if(currencys["power"])
				{
					change+=parseInt(currencys["power"]);
					var fin = log.power;
					gameUserManager.getGameUser(log.uid,function(gameuser){
						var res_log = new res_log_energy({
							User_ID:log.uid,
							User_DvcID:gameuser.username,
							User_Server:log.gameid,
							region_id:parseInt(log.R2),
							Crt_DT:(new Date(log.timeStamp*1000)).format(),
							Energy_Change:change,
							Energy_Fin:fin,
							Energy_Reason:log.logType
						});
						res_log.save(cb);
					});					
				}
				else
					cb();
			},
			function(cb){
				//console.log("begin Res_log_to_mysql 5");
				var change = 0;
				if(currencys["guildCoin"])
				{
					change+=parseInt(currencys["guildCoin"]);
					var fin = log.guildCoin;
					gameUserManager.getGameUser(log.uid,function(gameuser){
						var res_log = new res_log_GldCoin({
							User_ID:log.uid,
							User_DvcID:gameuser.username,
							User_Server:log.gameid,
							region_id:parseInt(log.R2),
							Crt_DT:(new Date(log.timeStamp*1000)).format(),
							GldCoin_Change:change,
							GldCoin_Fin:fin,
							GldCoin_Reason:log.logType
						});
						res_log.save(cb);
					});
				}
				else
					cb();
			},
			function(cb){
				//console.log("begin Res_log_to_mysql 6");
				var change = 0;
				if(currencys["odysseyCoin"])
				{
					change+=parseInt(currencys["odysseyCoin"]);
					var fin = log.odysseyCoin;
					gameUserManager.getGameUser(log.uid,function(gameuser){
						var res_log = new res_log_OdsyCoin({
							User_ID:log.uid,
							User_DvcID:gameuser.username,
							User_Server:log.gameid,
							Crt_DT:(new Date(log.timeStamp*1000)).format(),
							region_id:parseInt(log.R2),
							OdsyCoin_Change:change,
							OdsyCoin_Fin:fin,
							OdsyCoin_Reason:log.logType
						});
						res_log.save(cb);
					});					
				}
				else
					cb();	
			},
			function(cb){
				//console.log("begin Res_log_to_mysql 7");
				var change = 0;
				if(currencys["innExp"])
				{
					change+=parseInt(currencys["innExp"]);
					var fin = log.innExp;
					gameUserManager.getGameUser(log.uid,function(gameuser){
						var res_log = new res_log_EXP({
							User_ID:log.uid,
							User_DvcID:gameuser.username,
							User_Server:log.gameid,
							Crt_DT:(new Date(log.timeStamp*1000)).format(),
							region_id:parseInt(log.R2),
							EXP_Change:change,
							EXP_Fin:fin,
							EXP_Reason:log.logType
						});
						res_log.save(cb);
					});
				}
				else
					cb();
			},
			function(cb){
				//console.log("begin Res_log_to_mysql 8");
				var exp_change = 0;
				if(currencys["gembuytotal"])
				{
					exp_change+=parseInt(currencys["gembuytotal"]);
					var exp_fin = parseInt(log.gembuytotal);
					async.waterfall([
						function(cbb)
						{
							if(!vipsMaxGem)
							{
								gce.getvipLevels(function(data){
					              vipsMaxGem = data;
					              cbb();								
								});
							}
							else
							{
								cbb();
							}
						},
						function(cbb)
						{
							var lv_begin = utils.GetVipLevel(exp_fin-exp_change,vipsMaxGem);
							var lv_end = utils.GetVipLevel(exp_fin,vipsMaxGem);
							var lv_change = lv_end - lv_begin;
							gameUserManager.getGameUser(log.uid,function(gameuser){
								var res_log = new res_log_VIP({
									User_ID:log.uid,
									User_DvcID:gameuser.username,
									User_Server:log.gameid,
									Crt_DT:(new Date(log.timeStamp*1000)).format(),
									region_id:parseInt(log.R2),
									VIP_EXP_Change:exp_change,
									VIP_EXP_Fin:exp_fin,
									VIP_Lv_Change:lv_change,
									VIP_Lv_Fin:lv_end,
									VIP_Reason:log.logType
								});
								res_log.save(cbb);
							});
						}
						],function(){
							cb();
					});				
				}
				else
				{
					cb();
				}		
			},
			function(cb){
				//console.log("begin Res_log_to_mysql 9");
				var change = 0;
				if(currencys["fame"])
				{
					change+=parseInt(currencys["fame"]);
					var fin = log.fame;
					gameUserManager.getGameUser(log.uid,function(gameuser){
						var res_log = new res_log_Fame({
							User_ID:log.uid,
							User_DvcID:gameuser.username,
							User_Server:log.gameid,
							Crt_DT:(new Date(log.timeStamp*1000)).format(),
							region_id:parseInt(log.R2),
							Fame_Change:change,
							Fame_Fin:fin,
							Fame_Reason:log.logType
						});
						res_log.save(cb);
					});
				}
				else
					cb();
			},
			function(cb){
				var itemKeys = [];
				var itemValues= [];
				var thekeys = _.keys(currencys);

				_.each(thekeys,function(thekey){
					if(isNaN(thekey))
					{
			//			console.log("not:%s",thekey);
						return;
					}
	//				console.log("yes:%s",thekey);
					itemKeys.push(thekey);
					itemValues.push(currencys[thekey]);
				});
				if(itemKeys.length==0)
				{
					cb();
					//console.log("#innlogManager#re_mysql#currencys:%s",JSON.stringify(currencys));
					return;
				}
				else
				{
					// console.log("#innlogManager#re_mysql#iteKeys:%s",JSON.stringify(itemKeys));
					var i = 0;
					async.whilst(function(){
						return i<itemKeys.length;
					},
					function(callback){
						var itemkey = itemKeys[i];
						var itemvalue = itemValues[i];
						var change = 0;
						var result = 0;
						if(isNaN(itemvalue))
						{
							var arrvalue = itemvalue.split("#");
							if(arrvalue.length!=2)
							{
								winston.error("#innlogManager#Res_log_to_mysql#error#,currencys:%s",JSON.stringify(currencys));
								i++;
								return;
							}
							change = parseInt(arrvalue[0]);
							result = parseInt(arrvalue[1]);
						}
						else
						{
							change = parseInt(itemvalue);
						}
						var type = utils.getType(itemkey);
						if(type==9000000)
						{
							//food
							gameUserManager.getGameUser(log.uid,function(gameuser){
								var res_log = new res_log_Food({
									User_ID:log.uid,
									User_DvcID:gameuser.username,
									User_Server:log.gameid,
									Crt_DT:(new Date(log.timeStamp*1000)).format(),
									region_id:parseInt(log.R2),
									Food_ID:itemkey,
									Food_Change:change,
									Food_Fin:result,
									Food_Reason:log.logType
								});
								res_log.save(function(){
									i++;
									callback();
								});
							});			
						}
						else if(type==9100000)
						{
							//equip
							gameUserManager.getGameUser(log.uid,function(gameuser){
								var res_log = new res_log_Eqp({
									User_ID:log.uid,
									User_DvcID:gameuser.username,
									User_Server:log.gameid,
									Crt_DT:(new Date(log.timeStamp*1000)).format(),
									region_id:parseInt(log.R2),
									Eqp_ID:itemkey,
									Eqp_Change:change,
									Eqp_Fin:result,
									Eqp_Reason:log.logType,
									Eqp_Qlt:0,
									Eqp_Qlt_fin:0,
									Eqp_Slot:0,
									Eqp_Slot_fin:0
								});
								res_log.save(function(){
									//self.hasMysql = true;
									i++;
									callback();
								});
							});
						}
						else
						{
							//item
							gameUserManager.getGameUser(log.uid,function(gameuser){
								var res_log = new res_log_itm({
									User_ID:log.uid,
									User_DvcID:gameuser.username,
									User_Server:log.gameid,
									Crt_DT:(new Date(log.timeStamp*1000)).format(),
									region_id:parseInt(log.R2),
									itm_ID:itemkey,
									itm_Change:change,
									itm_Fin:result,
									itm_Reason:log.logType
								});
								res_log.save(function(){
									//self.hasMysql = true;
									i++;
									callback();
								});
							});					
						}
					},
					function(){
						cb();
					});
				}
			}
			],function(){
				//console.log("over Res_log_to_mysql");
				next();
			})
	}
	var index_IPO= 0;
	innlogManager.prototype.saveIPO = function(log,options,next){
		var self = log;
		var self_innlogManager = this;
		var arrMsg = self.message.split(",");
		var arrStr = self.message.split(",");	
		var money = require("./databases/mysql/money");
		var gum = keystone.get("gameUserManager");
		var gce = keystone.get("gameconfigExchange");
		var gm = keystone.get("guildManager");	
		
		async.waterfall([
			function(cb)
			{
				//console.log("saveOther14");
				//console.log("begin presave 12");
				//winston.debug("#gameUserManager#preSave#4 ,%s",JSON.stringify(process.hrtime()));
				if(_config.IPO_SYNC&&!options.hasIPO&&(self.logType == "LogInLog"|| self.logType == "RegisterLog"))
				{
					//IPO
			    	async.waterfall([
			    		function(cbb){
							gameUserManager.setGameUser({ip:arrStr[1],uid:self.uid},function(gameuser){
								cbb(null,gameuser);
							}); 	    			
			    		},
			    		function(gameuser,cbb){
			    			var username = gameuser.username;
			    			if(!username)
			    				username = arrStr[0];
					        var reg = new login(ipo_config.project_id,self.R2,username,arrStr[1],self.uid,arrStr[0],self.logDate,arrStr[2],arrStr[3],arrStr[4],arrStr[5],arrStr[6],arrStr[7]);
					        reg.save(function(){
					        	cbb();
					        });
			    		}
			    		],function(){
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
				//console.log("saveOther15");
				//console.log("begin presave 13");
				//winston.debug("#gameUserManager#preSave#5 ,%s",JSON.stringify(process.hrtime()));
			    if(_config.IPO_SYNC&&!options.hasIPO&&self.logType == "RegisterLog")
			    {
			    	async.waterfall([
			    		function(cbb){
				        gameUserManager.setGameUser({ip:arrStr[1],uid:self.uid},function(gameuser){
				        	cbb();
				        });		    			
			    		},
			    		function(cbb){
					        var reg = new register(ipo_config.project_id,self.R2,arrStr[0],arrStr[1],self.uid,arrStr[0],self.logDate,arrStr[2],arrStr[3],arrStr[4],arrStr[5],arrStr[6],arrStr[7]);

							reg.save(function(){
								cbb();
							});
			    		}
			    		],function(){
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
				//console.log("saveOther16");
				//console.log("begin presave 14");
				//winston.debug("#gameUserManager#preSave#6 ,%s",JSON.stringify(process.hrtime()));
			    var theIPOChannel = ipo_config[self.logType];
			    if(_config.IPO_SYNC&&!options.hasIPO&&(!ipo_config.vague&&!_.contains([1015001001,1016001001,3020006001,3021006001],theIPOChannel)&&(theIPOChannel&&!isNaN(self.R1)&&self.R1!=0) || (self.logType=="Tutorial"&&self.R1==0))||(ipo_config.vague&&_.contains([1015001001,1016001001,3020006001,3021006001],theIPOChannel)))//目前tutoriaol没有R1值，临时处理tutorial，下个版本删掉
			    {
		    		async.waterfall([
		    			function(cbb){
		    				gameUserManager.getGameUser(self.uid,function(gameuser){
		    					cbb(null,gameuser);
		    				});
		    			},
		    			function(gameuser,cbb){
		    				utils.GetSerial_No(function(no){
		    					cbb(null,gameuser,no);
		    				});
		    			}
		    			],function(err,gameuser,no){
		    			if(self.logType == "Tutorial"&&self.R1==0&&self.message.indexOf("4000-")>0)
		    			{
				    		var arrM = arrMsg[2].split("_");
				    		var theGem = 0;
				    		for(var i=0;i<arrM.length;i++)
				    		{
				    			var parmT = arrM[i].split("-");
				    			if(parmT[0]&&parmT[1]&&parmT[0]==4000)
				    			{
				    				theGem += parseInt(parmT[1]);
				    			}
				    		}
				    		if(theGem!=0)
				    		{
					    		var mny = new money(ipo_config.project_id,self.R2,gameuser.username,gameuser.lastlogin_ip,self.uid,gameuser.username,self.logDate,self.timeStamp*100000,no,1,3,theGem,"",theIPOChannel,self.gembuy+self.gemother,0,0,"");
					    		mny.save(function(){
					    			cb();
					    		});	    			
				    		}
				    		else
				    			cb();	
		    			}
				    	else if(theIPOChannel>=1&&theIPOChannel<=999)
				    	{
				    		var orderid = utils.GetOrder_ID(theIPOChannel,self.message);
				    		var theGem = parseInt(arrStr[2]) + parseInt(arrStr[3]);
				    		var product_id = utils.GetProduct_ID(theIPOChannel,self.message);
				    		var themoney = utils.GetProduct_Price(theIPOChannel,self.message);
				    		var mny = new money(ipo_config.project_id,self.R2,gameuser.username,gameuser.lastlogin_ip,self.uid,gameuser.username,self.logDate,self.timeStamp*100000,no,1,3,theGem,orderid,theIPOChannel,self.gembuy+self.gemother,1,themoney,product_id);
				    		mny.save(function(){
				    			cb();
				    		});
				    	}
				    	else if(theIPOChannel>=1000001001&&theIPOChannel<1999009999)
				    	{
				    		var theGem = parseInt(self.R1);
				    		var mny = new money(ipo_config.project_id,self.R2,gameuser.username,gameuser.lastlogin_ip,self.uid,gameuser.username,self.logDate,self.timeStamp*100000,no,1,3,theGem,"",theIPOChannel,self.gembuy+self.gemother,0,0,"");
				    		mny.save(function(){
				    			cb()
				    		});
				    	}
				    	else if(theIPOChannel>=3001006001&&theIPOChannel<=3999009999)
				    	{
				    		var theGem = parseInt(self.R1);
				    		var mny = new money(ipo_config.project_id,self.R2,gameuser.username,gameuser.lastlogin_ip,self.uid,gameuser.username,self.logDate,self.timeStamp*100000,no,2,3,theGem,"",theIPOChannel,self.gembuy+self.gemother,0,0,"");
				    		mny.save(function(){
				    			cb();
				    		});
				    	}
				    	else
				    	{
				    		cb();
				    	}
		    		});
			    }
			    else
			    {
			    	cb();
			    }
			}
			],
		function()
		{
			
			//console.log("----index_IPO:%s",++index_IPO);
			next();
		});	
	}
	var index_other = 0;
	innlogManager.prototype.saveOther = function(log,options,next){
		var self = log;
		var self_innlogManager = this;
		var arrMsg = self.message.split(",");
		var arrStr = self.message.split(",");	
		var money = require("./databases/mysql/money");
		var gum = keystone.get("gameUserManager");
		var gce = keystone.get("gameconfigExchange");
		var gm = keystone.get("guildManager");	
		
		async.waterfall([
			function(cb)
			{
				//console.log("saveOther4");
				//console.log("begin presave 3");
				//winston.debug("#gameUserManager#preSave#3 ,%s",JSON.stringify(process.hrtime()));
				if(!options.hasMysql&&_config.mysql.isopen&&self.logType=="RegisterLog")
				{		    	
			    	var the_parm = {
				        uid:self.uid,
			        	username:arrStr[0],
			        	gameid:self.gameid,
			        	logDate:self.timeStamp,
			        	region_id:parseInt(self.R2),
			        	ip:arrStr[1],
			        	User_country:self.country || "",
			        	app_Ver:arrStr[2],
			        	OS_Ver:arrStr[3],
			        	OS_Type:arrStr[4],
			        	User_local:arrStr[7]    		
			    	}
			    	
			        var the_user_register = new user_register(the_parm);

					the_user_register.save(function(){
						
						cb();
					});
				}
				else
				{
					cb();
				}
			},
			function(cb){
				//console.log("saveOther5");
				//console.log("begin presave 4");
				if(!options.hasMysql&&_config.mysql.isopen&&(self.R3.length>0||self.R4.length>0)&&self.logType!="TaskUp"&&self.logType!="StorageAdd"&&self.logType!="StorageRemove")
				{
					var numericals = "";
					var currencys = {};
					var prefix = "+";
					if(self.R3.length>0){
						numericals = self.R3;
						numericals = numericals.split(":");
						for(var i=0;i<numericals.length;i++)
						{
							var numerical = numericals[i];
							numerical = numerical.split("_");
							if(numerical.length!=2)
								continue;
							if(mapping_currency[numerical[0]])
								currencys[mapping_currency[numerical[0]]] = prefix + numerical[1];
							else
								currencys[numerical[0]] = prefix + numerical[1];
						}									
					}

					if(self.R4.length>0)
					{
						numericals = self.R4;
						prefix = "-";
					
						numericals = numericals.split(":");
						for(var i=0;i<numericals.length;i++)
						{
							var numerical = numericals[i];
							numerical = numerical.split("_");
							if(numerical.length!=2)
								continue;
							if(mapping_currency[numerical[0]])
								currencys[mapping_currency[numerical[0]]] = prefix + numerical[1];
							else
								currencys[numerical[0]] = prefix + numerical[1];
						}
					}
					//console.log("currencys:%s",JSON.stringify(currencys));
					//console.log("begin presave 4 - 2");

					self_innlogManager.Res_log_to_mysql(self,currencys,function(){
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
				//console.log("saveOther6");
				//console.log("begin presave 5");
				if(!options.hasMysql&&_config.mysql.isopen&&(self.logType=="StorageAdd"||self.logType=="StorageRemove"))
				{
					var typeid = parseInt(arrMsg[0]);
					var change_count = arrMsg[1];
					var end_count = -1;
					if(arrMsg.length&&arrMsg.length>=4)
					{
						end_count = arrMsg[2];
					}
					var type = typeid<10000000? parseInt(typeid/100000)*100000:parseInt(typeid/1000000)*1000000;
					if(type==9000000)
					{
						//food
						gameUserManager.getGameUser(self.uid,function(gameuser){
							var res_log = new res_log_Food({
								User_ID:self.uid,
								User_DvcID:gameuser.username,
								User_Server:self.gameid,
								Crt_DT:(new Date(self.timeStamp*1000)).format(),
								region_id:parseInt(self.R2),
								Food_ID:typeid,
								Food_Change:change_count,
								Food_Fin:end_count,
								Food_Reason:self.logType
							});
							res_log.save(function(){
								
								cb();
							});
						});			
					}
					else if(type==9100000)
					{
						//equip
						gameUserManager.getGameUser(self.uid,function(gameuser){
							var res_log = new res_log_Eqp({
								User_ID:self.uid,
								User_DvcID:gameuser.username,
								User_Server:self.gameid,
								Crt_DT:(new Date(self.timeStamp*1000)).format(),
								region_id:parseInt(self.R2),
								Eqp_ID:typeid,
								Eqp_Change:change_count,
								Eqp_Fin:end_count,
								Eqp_Reason:self.logType,
								Eqp_Qlt:0,
								Eqp_Qlt_fin:0,
								Eqp_Slot:0,
								Eqp_Slot_fin:0,
								Eqp_Reason:self.logType
							});
							res_log.save(function(){
								//self.hasMysql = true;
								cb();
							});
						});
					}
					else
					{
						//item
						gameUserManager.getGameUser(self.uid,function(gameuser){
							var res_log = new res_log_itm({
								User_ID:self.uid,
								User_DvcID:gameuser.username,
								User_Server:self.gameid,
								Crt_DT:(new Date(self.timeStamp*1000)).format(),
								region_id:parseInt(self.R2),
								itm_ID:typeid,
								itm_Change:change_count,
								itm_Fin:end_count,
								itm_Reason:self.logType
							});
							res_log.save(function(){
								//self.hasMysql = true;
								cb();
							});
						});					
					}
				}
				else
				{
					cb();
				}
			},
			function(cb){
			//	console.log("saveOther7");
				if(!options.hasMysql&&_config.mysql.isopen&&_.contains(["SmithMakeFinish","AdvUpWeapon","AdvUpArmor","AdvUpItem","AdvUpOffHand"],self.logType))
				{
					if(self.logType == "SmithMakeFinish")
					{
						gameUserManager.getGameUser(self.uid,function(gameuser){
							var res_log = new res_log_Eqp({
								User_ID:self.uid,
								User_DvcID:gameuser.username,
								User_Server:self.gameid,
								Crt_DT:(new Date(self.timeStamp*1000)).format(),
								region_id:parseInt(self.R2),
								Eqp_ID:parseInt(arrMsg[2]),
								Eqp_Change:0,
								Eqp_Fin:1,
								Eqp_Reason:self.logType,
								Eqp_Qlt:1,
								Eqp_Qlt_fin:parseInt(arrMsg[3]),
								Eqp_Slot:0,
								Eqp_Slot_fin:0,
								Eqp_Room_Id:parseInt(arrMsg[0]),
								Eqp_Adv_Id:parseInt(arrMsg[1])
							});
							res_log.save(function(){
								//self.hasMysql = true;
								cb();
							});
						});					
					}
					else
					{
						cb();
					}
					// else
					// {
					// 	gameUserManager.getGameUser(self.uid,function(gameuser){
					// 		var res_log = new res_log_Eqp({
					// 			User_ID:self.uid,
					// 			User_DvcID:gameuser.username,
					// 			User_Server:self.gameid,
					// 			Crt_DT:(new Date(self.timeStamp*1000)).format(),
					// 			Eqp_ID:typeid,
					// 			Eqp_Change:0,
					// 			Eqp_Fin:end_count,
					// 			Eqp_Reason:self.logType,
					// 			Eqp_Qlt:0,
					// 			Eqp_Qlt_fin:0,
					// 			Eqp_Slot:1,
					// 			Eqp_Slot_fin:self.message
					// 		});
					// 		res_log.save(function(){
					// 			//self.hasMysql = true;
					// 			cb();
					// 		});
					// 	});		
					// }
				}
				else
				{
					cb();
				}
			},
			// function(cb){
			// 	//冒险者经验
			// 	if(!self.hasMysql&&_config.mysql.isopen&&_.contains(["QuestFinish","QuestRewardFinish","QuestSweep"],self.logType))
			// 	{
			// 		cb();
			// 		if(self.logType=="QuestFinish")
			// 		{
			// 			var adv_exp = 0;
			// 			if(arrMsg[3]=="1")
			// 			{
			// 				adv_exp = 10;
			// 			}
			// 			else if(arrMsg[3]=="2")
			// 			{
			// 				adv_exp = 15;
			// 			}
			// 			else if(arrMsg[3]=="3")
			// 			{
			// 				adv_exp = 20;
			// 			}
			// 			var adv_mode = arrMsg[3]=="1"?"nor":"hard";
			// 			if(arrMsg[3]=="3")
			// 				adv_mode = "hell";
			// 			var quest_typeid = arrMsg[0];
			// 			var change_type = "nor";
			// 			var adv_change_result = arrMsg[1]=="1"?"win":"loss";
			// 			var rating = arrMsg[5];
			// 			var arrLoots = arrMsg[2].split("_");

			// 		}
			// 	}
			// },
			// function(cb){
			// 	if(!self.hasMysql&&_config.mysql.isopen&&_.contains(["AdvSwitchSkill"],self.logType))
			// 	{

			// 	}
			// },
			// function(cb){
			// 	if(!self.hasMysql&&_config.mysql.isopen&&_.contains(["SmithMakeFinish","AdvUpWeapon","AdvUpArmor","AdvUpItem","AdvUpOffHand"],self.logType))
			// },
			function(cb){
				//console.log("saveOther8");
				//console.log("begin presave 6");
				if(!options.hasMysql&&_config.mysql.isopen&&_.contains(["QuestFinsih","QuestRewardFinish","QuestSweep"],self.logType))
				{
					var adv_mode ="";
					var quest_id=arrMsg[0];
					var adv_change_type = "";
					var adv_change_result = "";
					var adv_change_rating = -1;
					var arrLoots = [];
					var loots={};
					if(self.logType=="QuestSweep")
					{
						adv_change_type="sweep";
						adv_change_result = "win";
						arrLoots = arrMsg[7].split("-");
						_.each(arrLoots,function(loot){
							var arrloot = loot.split("_");
							loots[arrloot[0]] = arrloot[1];
						});
					}
					else
					{
						adv_change_type = "quest";
						adv_change_result = arrMsg[1]=="1"?"loss":"win";
						arrLoots = arrMsg[2].split("_");
						_.each(arrLoots,function(loot){
							var arrloot = loot.split("-");
							loots[arrloot[0]] = arrloot[1];
						});
					}
					if(self.logType == "QuestFinsih")
					{
						adv_change_rating = parseInt(arrMsg[5]);
						adv_mode = arrMsg[3]=="1"?"nor":"hard";
					}
					gameUserManager.getGameUser(self.uid,function(gameuser){
						var a = {
							User_ID:self.uid,
							User_DvcID:gameuser.username,
							User_Server:self.gameid,
							Crt_DT:(new Date(self.timeStamp*1000)).format(),
							region_id:parseInt(self.R2),
							Adv_Mode:adv_mode,
							Adv_std_ID:quest_id,
							Adv_stg_name:"",
							Adv_Change_Type:adv_change_type,
							Adv_Change_Result:adv_change_result,
							Adv_Change_Rating:adv_change_rating
						};
						var keys = _.keys(loots);
						var values = _.values(loots);
						for(var i=0;i<7;i++)
						{
							var j = i+1;
							if(keys.length>=j)
							{
								
								a["Adv_loot"+j] = keys[i];
								if(!isNaN(values[i]))
									a["Adv_loot"+j+"_Amt"] = parseInt(values[i]);
								else
									a["Adv_loot"+j+"_Amt"] = 0;
							}
							else
							{
								a["Adv_loot"+j] = "";
								a["Adv_loot"+j+"_Amt"] = 0;
							}
						}

						var act_log = new Act_log_Adv(a);
						act_log.save(function(){
								//self.hasMysql = true;
								cb();
							});
					});	
				}
				else
				{
					cb();
				}
			},		
			function(cb){
				//console.log("saveOther9");
				//console.log("begin presave 7");
				if(!options.hasMysql&&_config.mysql.isopen&&_.contains(["QuestEliteFinish","QuestEliteTake"],self.logType))
				{
					var odsy_id = arrMsg[0];
					var change_result = "";
					if(self.logType=="QuestEliteFinish")
						change_result = arrMsg[1] == "0"?"win":"loss";
					var	arrLoots = arrMsg[2].split("_");
					var loots = {};
					_.each(arrLoots,function(loot){
						var arrloot = loot.split("-");
						loots[arrloot[0]] = arrloot[1];
					});				
					gameUserManager.getGameUser(self.uid,function(gameuser){
						var result = {
							User_ID:self.uid,
							User_DvcID:gameuser.username,
							User_Server:self.gameid,
							Crt_DT:(new Date(self.timeStamp*1000)).format(),
							region_id:parseInt(self.R2),
							Odsy_Auto:0,
							Odsy_Stg_ID:parseInt(odsy_id),
							Odsy_stg_No:"",
							Odsy_Change_Result:change_result
						};
						var keys = _.keys(loots);
						var values = _.values(loots);
						for(var i=0;i<4;i++)
						{
							var j = i+1;
							if(keys.length>=j)
							{
								
								result["Odsy_loot"+j] = keys[i];
								if(!isNaN(values[i]))
									result["Odsy_loot"+j+"_amt"] = parseInt(values[i]);
								else 
									result["Odsy_loot"+j+"_amt"] = 0;
							}
							else
							{
								result["Odsy_loot"+j] = "";
								result["Odsy_loot"+j+"_amt"] = 0;
							}
						}

						var act_log = new Act_log_odsy(result);
						act_log.save(function(){
								//self.hasMysql = true;
								cb();
							});
					});
				}
				else
				{
					cb();
				}
			},
			function(cb){
				//console.log("saveOther10");
				//console.log("begin presave 8");
				if(!options.hasMysql&&_config.mysql.isopen&&_.contains(["PvPFinish"],self.logType))
				{
					gameUserManager.getGameUser(self.uid,function(gameuser){
						var res_log = new Act_log_Arena({
							User_ID:self.uid,
							User_DvcID:gameuser.username,
							User_Server:self.gameid,
							Crt_DT:(new Date(self.timeStamp*1000)).format(),
							region_id:parseInt(self.R2),
							Arena_power:0,
							Arena_pt:parseInt(arrMsg[2]),
							Arena_pt_Balance:parseInt(arrMsg[3]),
							Arena_rank:0,
							Arena_rank_balance:0,
							Arena_result:arrMsg[1]=="0"?"win":"loss",
							Arena_emy_ID:arrMsg[0],
							Arena_emy_power:0,
							Arena_emy_pt:0,
							Arena_emy_Balance:0,
							Arena_emy_rank:0,
							Arena_emy_rank_balance:0
						});
						res_log.save(function(){
							//self.hasMysql = true;
							cb();
						});
					});					
				}
				else
				{
					cb();
				}
			},
			function(cb){
				//console.log("saveOther11");
				//console.log("begin presave 9");
				if(!options.hasMysql&&_config.mysql.isopen&&_.contains(["CoinShopPurchase","OdysseyCoinShopPurchase","PvPCoinShopPurchase","FameShopPurchase","GemShopPurchase","GuildCoinShopPurchase"],self.logType))
				{
					gameUserManager.getGameUser(self.uid,function(gameuser){
						var res_log = new Sys_Store({
							User_ID:self.uid,
							User_DvcID:gameuser.username,
							User_Server:self.gameid,
							Crt_DT:(new Date(self.timeStamp*1000)).format(),
							region_id:parseInt(self.R2),
							Store_Type:arrMsg[1],
							Store_itm_id:arrMsg[2],
							Store_itm_name:"",
							Store_itm_Qlt:0,
							Store_itm_amy:0,
							Store_currency_type:arrMsg[0],
							Store_itm_cost:parseInt(arrMsg[3])
						});
						res_log.save(function(){
							//self.hasMysql = true;
							cb();
						});
					});					
				}
				else
				{
					cb();
				}			
			},
			// function(cb)
			// {
			// 	console.log("saveOther12");
			// 	//console.log("begin presave 10");
			// 	if(!options.hasMysql&&_config.mysql.isopen&&_.contains(["AdvSummon"],self.logType))
			// 	{
			// 		var gemcost = parseInt(arrMsg[2]);
			// 		var coincost = 0;
			// 		if(arrMsg.length>7)
			// 			coincost  = parseInt(arrMsg[7]);
			// 		var costType = "null";
			// 		if(gemcost>0)
			// 			costType = "gem";
			// 		if(coincost>0)
			// 			costType = "gold";
			// 		var cost = gemcost>0?gemcost:coincost;
			// 		if(cost<0)
			// 			cost = 0;
			// 		var advArrs = arrMsg[3].split("-");
			// 		var advids = [];
			// 		_.each(advArrs,function(str){
			// 			var parm = parseInt(str.split("_")[1]);
			// 			if(!isNaN(parm))
			// 				advids.push(parm);
			// 		})
			// 		var itm_keys = [];
			// 		var itm_values = [];
			// 		_.each(arrMsg[4].split("-"),function(str){
			// 			var parm = str.split(":")[1];
			// 			if(parm)
			// 			{
			// 				var parm2 = parm.split("_");
			// 				itm_keys.push(parm2[0]);
			// 				itm_values.push(parseInt(parm2[1]));						
			// 			}

			// 		});

			// 		gameUserManager.getGameUser(self.uid,function(gameuser){
			// 			async.waterfall([
			// 				function(cbb){
			// 					var i=0;
								
			// 					if(advids.length==0)
			// 					{
			// 						cbb();
			// 						return;
			// 					}
			// 					async.whilst(function(){
			// 						return i<advids.length;
			// 					},
			// 					function(callback){
			// 						var advid = advids[i];
									
			// 						var result = {
			// 							User_ID:self.uid,
			// 							User_DvcID:gameuser.username,
			// 							User_Server:self.gameid,
			// 							Crt_DT:(new Date(self.timeStamp*1000)).format(),
			// 							region_id:parseInt(self.R2),
			// 							Sum_type:arrMsg[0],
			// 							Sum_id:self._id || self.timeStamp,
			// 							Sum_isfree:arrMsg[1],
			// 							Sum_currency_type:costType,
			// 							Sum_cost:cost,
			// 							Sum_hero_id:advid,
			// 							Sum_hero_name:"",
			// 							Sum_hero_star:0,
			// 							Sum_hero_exist:0,
			// 							Sum_loot1:"",
			// 							Sum_loot1_amt:0
			// 						};
			// 						var res_log = new Sys_Summon(result);
			// 						res_log.save(function(){
			// 							//self.hasMysql = true;
			// 							i++;
			// 							cost=0;
			// 							callback();
			// 						});
			// 					},
			// 					function(){
			// 						cbb();
			// 					});
			// 				},
			// 				function(cbb){
								
			// 					var i=0;
			// 					if(itm_keys.length==0)
			// 					{
			// 						cbb();
			// 						return;
			// 					}
			// 					async.whilst(
			// 						function(){
			// 							return i<itm_keys.length;
			// 						},
			// 						function(callback){
										
			// 							var result = {
			// 								User_ID:self.uid,
			// 								User_DvcID:gameuser.username,
			// 								User_Server:self.gameid,
			// 								Crt_DT:(new Date(self.timeStamp*1000)).format(),
			// 								region_id:parseInt(self.R2),
			// 								Sum_type:arrMsg[0],
			// 								Sum_id:self._id || self.timeStamp,
			// 								Sum_isfree:arrMsg[1],
			// 								Sum_currency_type:costType,
			// 								Sum_cost:cost,
			// 								Sum_hero_id:0,
			// 								Sum_hero_name:"",
			// 								Sum_hero_star:0,
			// 								Sum_hero_exist:0,
			// 								Sum_loot1:itm_keys[i],
			// 								Sum_loot1_amt:itm_values[i]
			// 							};
			// 							var res_log = new Sys_Summon(result);
			// 							res_log.save(function(){
											
			// 								i++;
			// 								cost=0;
			// 								callback();
			// 							});
			// 						},
			// 						function(){
			// 							cbb();
			// 						}
			// 						)
			// 				}
			// 				],function(){
			// 					//self.hasMysql = true;
			// 					cb();
			// 			});

			// 		});					
			// 	}
			// 	else
			// 	{
			// 		cb();
			// 	}
			// },	
			function(cb)
			{
				//console.log("saveOther13");
				//console.log("begin presave 11");
				if(!options.hasMysql&&_config.mysql.isopen&&_.contains(["TavernBuyGem"],self.logType))
				{
					var orderid = arrMsg[2];
					var product_id = "";
					if(orderid.length<=8)
					{
						try{
							var json = JSON.parse( arrMsg[5]+"}");
							orderid = json.orderId;
							product_id = json.productId;
						}
						catch(err){
							try{
								var json = JSON.parse(arrMsg[2]+"}");
								orderid = json.orderId;
								product_id = json.productId;
							}
							catch(err)
							{
								utils.showErr(err);
								winston.error("#innlogManager#initTavernMyGem error,err:%s,the message:%s",arrMsg[5]+"\"}",self.message);
							}
						}
					}
					var gembuy = parseInt(arrMsg[2]);
					if(isNaN(gembuy))
						gembuy = 0;
					var gemother = parseInt(arrMsg[3]);
					if(isNaN(gemother))
						gemother = 0;
					gameUserManager.getGameUser(self.uid,function(gameuser){
						var res_log = new Sys_orders({
							User_ID:self.uid,
							User_DvcID:gameuser.username,
							User_Server:self.gameid,
							Crt_DT:(new Date(self.timeStamp*1000)).format(),
							region_id:parseInt(self.R2),
							Order_currency_type:"$",
							Order_price:utils.GetProduct_Price("2",self.message),
							Order_success:1,
							Order_portal:arrMsg[1],
							Order_gem:gembuy+gemother,
							Order_Vip_Exp:gembuy,
							Order_kind_id:orderid,
							Order_Invoice:product_id,
							Order_Channel:"android",
							Order_Pkg_ID:0
						});
						res_log.save(function(){
							//self.hasMysql = true;
							cb();
						});
					});	
				}
				else
				{
					cb();
				}
			}
		],
		function()
		{
			//console.log("------index_other:%s",(++index_other));
			next();
		});

	}
	var hrtime = "";
	var valuetime = "";
	var index_game = 0;
	innlogManager.prototype.insert_game = function(msg,options,next){
		var gum = keystone.get("gameUserManager");
		var gce = keystone.get("gameconfigExchange");
		var gm = keystone.get("guildManager");
		var self = this.initLog(msg);
		//winston.info("over gamed data:%s",(++index_game));
		if(!self)
		{
			//winston.info("error log,msg:%s",msg.toString());
			next();
			return;
		}
		var self_innlogManager = this;	
		async.waterfall([
		function(cb){
			if(self.logType == "PvPStatistical")
			{
				gum.InsertInnLog_PvPStatistical(self,cb);
			}
			else
				cb();
		},
		function(cb){
			if(!self.hasStatsd)
			{
				statsdManager.sendStatsdData(self);
			}
			cb();
		},
		function(cb)
		{
			if(self.logType == "GuildStatistical"||self.logType == "GlobalGWReward")
			{
				gm.insertGuild(self,cb);
			}
			else
				cb();
		},
		function(cb)
		{
			if(_.contains(_config.logType.updateUser, self.logType)||self.R3.length>0||self.R4.length>0)
			{
				gum.InsertInnLog(self,function(){
					cb();
				});
			}
			else
			{
				cb();
			}
		}
			],function(){
				//winston.info("------index_game:over");
				next();
		});		
	}
	var index_only = 0;
	innlogManager.prototype.insert_other = function(msg,options,next){
		var gum = keystone.get("gameUserManager");
		var gce = keystone.get("gameconfigExchange");
		var gm = keystone.get("guildManager");
		var self = this.initLog(msg);
		//console.log("only log,index:%s",(++index_only));
		if(!self)
		{
			next();
			return;
		}		
		var self_innlogManager = this;		
		async.waterfall([
		function(cb){
			self_innlogManager.saveOther(self,options,cb);
		},
		function(cb){
			self_innlogManager.saveIPO(self,options,cb);
		}
			],function(){
				next();
		});		
	}	
	innlogManager.prototype.preSave = function(log,options,next)
	{
		var gum = keystone.get("gameUserManager");
		var gce = keystone.get("gameconfigExchange");
		var gm = keystone.get("guildManager");	
		
		var self = log;
		var self_innlogManager = this;
		if(!self||!self.message)
		{
			//debugger;
			winston.error("#innlogManager#presave log is null,log:%s",JSON.stringify(log));
			next(null,self);
			return;
		}
		var arrMsg = self.message.split(",");
		async.waterfall([
		function(cb){
			if (self.logType==_config.logType.handlerErr) {
				////console.log("errorHandler insert!")
				self.category =arrMsg[0];	
				if(self.category==0)
					self.category = arrMsg[1];	
			}
			else if(self.logType == _config.logType.fameShopPurchase){
				self.category = arrMsg[4];
			}
			else if(self.logType == _config.logType.advSummon){
				self.category = arrMsg[0];
			}
			else if(self.logType == _config.logType.tutorial){
				self.category = arrMsg[1];
			}
			if(!self.hasStatsd)
			{
				statsdManager.sendStatsdData(self);
			}
			hrtime = process.hrtime();
			valuetime = hrtime;
			//winston.info("#innlogManager#presave#1 %s,logType:%s",JSON.stringify(hrtime),self.logType);
			cb();
		},
		// function(cb){

		// //	console.log("begin presave 1");
		// 	//winston.debug("#gameUserManager#preSave#1 ,%s",JSON.stringify(process.hrtime()));
		// 	if(self.logType=="LogOut"&&options.hasLogTime==false)
		// 	{
		// 		var parm = _.clone(self);
		// 		var msgLog = parm.message;
		// 		if (msgLog.length>0) {
		// 			var arrMsgLog = msgLog.split(',');
		// 			var logTime = parseInt(arrMsgLog[0]);
		// 			var sessionCount = parseInt(arrMsgLog[1]);
		// 			parm.logType="LogTime";
		// 			parm.logtime=logTime;
		// 			parm.sessionCount = sessionCount;
		// 			//需要在填写下session数量
					
		// 			parm.save(function(err){
		// 				utils.showErr(err);
		// 				if(err)
		// 				{
		// 					winston.info("#innlogManager#LogOut insert err,parm:%s",JSON.stringify(parm));
		// 				}
		// 				else
		// 				{
		// 					self.hasLogTime = true;
		// 				}
		// 				cb();
		// 			});
		// 		}
		// 		else
		// 		{
		// 			cb();
		// 		}			
		// 	}
		// 	else
		// 	{
		// 		cb();
		// 	}
		// },
		function(cb){
			//console.log("saveOther1");
			if(self.logType == "PvPStatistical")
			{
				hrtime = process.hrtime(valuetime);
				valuetime = process.hrtime();
				//winston.info("#innlogManager#presave#2 %s",JSON.stringify(hrtime));
				gum.InsertInnLog_PvPStatistical(self,cb);
			}
			else
				cb();
		},
		function(cb)
		{
			//console.log("saveOther2");
			if(self.logType == "GuildStatistical"||self.logType == "GlobalGWReward")
			{
				hrtime = process.hrtime(valuetime);
				valuetime = process.hrtime();

				//winston.info("#innlogManager#presave#3 %s",JSON.stringify(hrtime));
				gm.insertGuild(self,cb);
			}
			else
				cb();
		},
		function(cb)
		{
			//console.log("saveOther3");
			//console.log("begin presave 2");
			//winston.debug("#gameUserManager#preSave#2 ,%s",JSON.stringify(process.hrtime()));
			if(_.contains(_config.logType.updateUser, self.logType)||self.R3.length>0||self.R4.length>0)
			{
				hrtime = process.hrtime(valuetime);
				valuetime = process.hrtime();

				//winston.info("#innlogManager#presave#4 %s",JSON.stringify(hrtime));
				gum.InsertInnLog(self,function(){
						// //console.log('insert log complete');
						cb();
				});			
			}
			else
			{
				cb();
			}
		},	
		function(cb){
			//console.log("begin presave 2");
			hrtime = process.hrtime(valuetime);
			valuetime = process.hrtime();

			//winston.info("#innlogManager#presave#5 %s",JSON.stringify(hrtime));
			self_innlogManager.saveOther(self,options,cb);
		},
		function(cb){
			hrtime = process.hrtime(valuetime);
			valuetime = process.hrtime();

			//winston.info("#innlogManager#presave#6 %s",JSON.stringify(hrtime));
			self_innlogManager.saveIPO(self,options,cb);
		}
		],
		function()
		{
			hrtime = process.hrtime(valuetime);
			valuetime = process.hrtime();

			//winston.info("#innlogManager#presave#7 %s",JSON.stringify(hrtime));
			//console.log("begin presave 3");
			self.hasStatsd = true;
			if(_config.mysql.isopen)
				self.hasMysql = true;
			if(_config.IPO_SYNC)
				self.hasIPO = true;
			//console.log("over presave");
			next(null,self);
		});
	}
	innlogManager.prototype.batchInsert = function(msg, cb){
		var i = 0;
		if(msg.length == 0){
			cb();
			return;
		}
	    var bulk = keystone.list('InnLog').model.collection.initializeOrderedBulkOp();
	    var self = this;
	    async.whilst(
	      function() { return i < msg.length; },
	      function(callback) {

	        bulk.insert(self.getJSONByMsg(msg[i]));
	        i++;
	        callback();
	      },
	      function() {
	      	bulk.execute(function(err,result) {
	      		if(err){
	      			//console.log("batchInsert fail");
	      		}
	      		cb();
	      	});
	      }
	    );
	}

	exports = module.exports = innlogManager;