
var fs = require("fs");
var q  = require("protobufjs");
var gameconfigfilepath = "pbfiles/GameConfig";
var _ = require("underscore");
var async = require('async');
var historyfilepath = ["150811"];
var historydatetime = [1439251200];//1439294400
var protopathBase   = "./pbfiles/";
var protopaths		   = [
							"GameConfigAll.proto"];
var GameConfigExchange = function(){

}
var guildLevels = "";
var quests = "";
var vipLevels = "";
var odyssey = "";
var constants = "";
var rewardpools = "";
var gemprice = "";
var tavernlevel = "";
var task = "";
GameConfigExchange.prototype.test = function(next){

	//var advs    = builder.build("GameConfigAdventure");
	var gameconfig = fs.readFile(gameconfigfilepath,function(err,data){
		if(err) throw err;
		console.log(data);
		var builder = q.newBuilder({convertFieldsToCamelCase:true});
		for(var i=0;i<protopaths.length;i++){
			q.loadProtoFile(protopathBase+protopaths[i],builder);
		}
		var gs = builder.build();

		var zlib = require('zlib');

		var tData = zlib.unzipSync(data);
		var a = gs.GameConfigAll.decode(tData);
		console.log(JSON.stringify(a.pvps));
	});
}
var getFolerPath = function(firstDate){
	for(var i=0;i<historydatetime.length;i++)
	{
		if(firstDate<historydatetime[i])
			return historyfilepath[i];
	}
	return "";

}
//error function 该方法有bug
GameConfigExchange.prototype.getTablebyHistory = function(options,next){
	var filepath = protopathBase+getFolerPath(options.firstDate);
	var table = options.table;
	var gameconfig = fs.readFile(filepath+"/GameConfig",function(err,data){
		if(err) throw err;
		var builder = q.newBuilder({convertFieldsToCamelCase:true});
		for(var i=0;i<protopaths.length;i++){
			q.loadProtoFile(filepath+"/"+ protopaths[i],builder);
		}
		var gs = builder.build();

		var zlib = require('zlib');

		var tData = zlib.unzipSync(data);
		var parm = gs.GameConfigAll.decode(tData);
		// if(table=="odyssey"){
		// 	var r = "";
		// 	for(var proto in parm)
		// 	{
		// 		r +=proto+",";
		// 	}
		// 	console.log("keys:%s",r);
		// }
		debugger;
		parm = parm[table];

		next(parm);
	});
}
GameConfigExchange.prototype.getgemprice = function(next){
	if(gemprice)
	{
		next(gemprice);
		return;
	}
	else
	{
		this.getHistoryExchange({table:"skus",typeid:"gemCount",value:"price",firstDate:new Date()/1000},function(results){
			gemprice = results;
			next(gemprice);
		});		
	}
}
GameConfigExchange.prototype.gettask = function(next){
	if(task)
	{
		next(task);
		return;
	}
	else
	{
		this.getTablebyHistory({table:"tasks",firstDate:new Date()/1000},function(table){
			task = table;
			next(task);
		});
	}
}
GameConfigExchange.prototype.gettavernlevel = function(next){
	if(tavernlevel)
	{
		next(tavernlevel);
		return;
	}
	else
	{
		this.getHistoryExchange({table:"tavernLevels",typeid:"levelId",value:"maxExp",firstDate:new Date()/1000},function(data){
			tavernlevel = data;
			next(tavernlevel);
		});
	}
}
GameConfigExchange.prototype.getguildLevels = function(next){
	if(guildLevels)
	{
		next(guildLevels);
		return;
	}
	else
	{
		this.getTablebyHistory({table:"guilds"},function(datas){
			var data = datas.guildLevels;
			guildLevels = {};
			_.each(data,function(guildlevel){
				guildLevels[guildlevel.typeId] = guildlevel.maxExp;
			});
			next(guildLevels);
		});			
	}
}
GameConfigExchange.prototype.getvipLevels = function(next){
	if(vipLevels)
		next(vipLevels);
	else
	{
		this.getHistoryExchange({table:"vipLevels",typeid:"typeId",value:"maxGem",firstDate:new Date()/1000},function(datas){
			vipLevels = datas;
			next(vipLevels);
		});			
	}
}
GameConfigExchange.prototype.getconstants = function(next){
	if(constants)
		next(constants);
	else
	{
		gc.getTablebyHistory({table:"constants"},function(data){
			constants = data;
			next(constants);
		});
	}
}
GameConfigExchange.prototype.getRewardPools = function(next){
	if(rewardpools)
		next(rewardpools);
	else
	{
		gc.getTablebyHistory({table:"rewardPools"},function(data){
			rewardpools = data;
			next(rewardpools);
		});		
	}
}
GameConfigExchange.prototype.getConstantsValues_Key = function(next){
	var constantsValues_key = {};
	var self =this;
	async.waterfall([
		function(cb){
			self.getconstants(function(datas){
				cb(null,datas);
			});
		},
		function(datas,cb){
			var thekeys = _.keys(datas);
			_.each(thekeys,function(thekey){
				constantsValues_key[datas[thekey] + ""] = thekey;
			});
			cb();
		}
		],function(){
		next(constantsValues_key);
	});	
}

GameConfigExchange.prototype.getShopTypeName = function(next){
	var shopName = {};
	var self =this;
	async.waterfall([
		function(cb){
			self.getconstants(function(datas){
				cb(null,datas);
			});
		},
		function(datas,cb){
			var thekeys = _.keys(datas);
			_.each(thekeys,function(thekey){
				if(thekey.indexOf("STORETYPE")==0)
				{
					shopName[datas[thekey] + ""] = thekey;
				}
			});
			cb();
		}
		],function(){
		next(shopName);
	})
}
GameConfigExchange.prototype.getodyssey = function(next){
	if(odyssey)
		next(odyssey);
	else
	{
		this.getHistoryExchange({table:"odyssey",typeid:"typeId",value:"title",firstDate:new Date()/1000},function(datas){
			odyssey = datas;
			next(odyssey);
		});
	}
}
GameConfigExchange.prototype.getQuest = function(next){
	if(quests)
		next(quests);
	else
	{
		this.getHistoryExchange({table:"quests",typeid:"typeId",value:"title",firstDate:new Date()/1000},function(datas){
			quests = datas;
			next(quests);
		});	
	}
}
GameConfigExchange.prototype.getHistoryExchange=function(options,next){

	var filepath = protopathBase+getFolerPath(options.firstDate);

	var table=options.table;
	var typeid = options.typeid;
	var value=options.value;
	var gameconfig = fs.readFile(filepath+"/GameConfig",function(err,data){
		if(err) throw err;
		var builder = q.newBuilder({convertFieldsToCamelCase:true});
		for(var i=0;i<protopaths.length;i++){
			q.loadProtoFile(filepath+"/"+ protopaths[i],builder);
		}
		var gs = builder.build();

		var zlib = require('zlib');

		var tData = zlib.unzipSync(data);
		var parm = gs.GameConfigAll.decode(tData);
		// if(table=="odyssey"){
		// 	var r = "";
		// 	for(var proto in parm)
		// 	{
		// 		r +=proto+",";
		// 	}
		// 	console.log("keys:%s",r);
		// }
		parm = parm[table];
		// if(table=="odyssey")
		 	//console.log("gameconfig11:%s",JSON.stringify(parm));
		var result = {};
		if(!parm)
			parm = [];
		for(var i=0;i<parm.length;i++)
		{
			result[parm[i][typeid]] = parm[i][value];
		}
		//console.log(JSON.stringify(result));
		next(result);
	});
}
GameConfigExchange.prototype.getTable = function(table,next){
	var gameconfig = fs.readFile(gameconfigfilepath,function(err,data){
		if(err) throw err;
		var builder = q.newBuilder({convertFieldsToCamelCase:true});
		for(var i=0;i<protopaths.length;i++){
			q.loadProtoFile(protopathBase+protopaths[i],builder);
		}
		var gs = builder.build();

		var zlib = require('zlib');

		var tData = zlib.unzipSync(data);
		var parm = gs.GameConfigAll.decode(tData);
		// if(table=="odyssey"){
		// 	var r = "";
		// 	for(var proto in parm)
		// 	{
		// 		r +=proto+",";
		// 	}
		// 	console.log("keys:%s",r);
		// }
		parm = parm[table];

		next(parm);
	});
}

GameConfigExchange.prototype.getExchange = function(table,typeid,value,next){
	console.log("begion getExchange");
	var gameconfig = fs.readFile(gameconfigfilepath,function(err,data){
		if(err) throw err;
		var builder = q.newBuilder({convertFieldsToCamelCase:true});
		for(var i=0;i<protopaths.length;i++){
			q.loadProtoFile(protopathBase+protopaths[i],builder);
		}
		var gs = builder.build();

		var zlib = require('zlib');

		var tData = zlib.unzipSync(data);
		var parm = gs.GameConfigAll.decode(tData);
		// if(table=="odyssey"){
		// 	var r = "";
		// 	for(var proto in parm)
		// 	{
		// 		r +=proto+",";
		// 	}
		// 	console.log("keys:%s",r);
		// }
		parm = parm[table];
		// if(table=="odyssey")
		 	//console.log("gameconfig11:%s",JSON.stringify(parm));
		var result = {};
		if(!parm)
			parm = [];
		for(var i=0;i<parm.length;i++)
		{
			result[parm[i][typeid]] = parm[i][value];
		}
		//console.log(JSON.stringify(result));
		next(result);
	});
}

exports = module.exports = GameConfigExchange;
