var keystone = require('keystone');
var async    = require('async');
var _        = require("underscore");
var _config = keystone.get("_config");
var winston = require("winston");
var util     = require("../../manager/util/utils");
exports = module.exports = function(req, res) {
	var view = new keystone.View(req, res),
		locals = res.locals;
	locals.title=_config.title;
	var baseConfig = null;
	var firstConfig = "";

	// locals.section is used to set the currently selected
	// item in the header navigation.
	locals.section = 'jsonServer';

	xAxis = [];
	var permission = require("../../manager/permission");
   // Set locals
    var per = new permission();
   locals.hasPermission = false;
   if(req.user&&req.user.code)
      locals.hasPermission = per.HasPermisson("summary",req.user.code);
	locals.ttitle = "阶段统计";
	locals.subtitle = "当日";
	locals.yAxisTitle = "数量（个）";
	locals.formatData = req.body || {};
	locals.timezone = _config.timezone||0;
    var ttype=parseInt(req.query["ttype"]) || 1;
	var name = req.query["name"];

	var countConfig = _config.phaseStatistical.countConfig;
	var logConfig = _config.phaseStatistical.logConfig;
	var paidboughtConfig = _config.phaseStatistical.paidboughtConfig;
	var pvpConfig = _config.phaseStatistical.pvpConfig;
	var advConfig = _config.phaseStatistical.advConfig;
	var familiarConfig =_config.phaseStatistical.familiarConfig;
	var payConfig = _config.phaseStatistical.payConfig;
	var otherConfig = _config.phaseStatistical.otherConfig;
	var dishConfig = _config.phaseStatistical.dishConfig;
	var questConfig = _config.phaseStatistical.questConfig;
	var roomConfig = _config.phaseStatistical.roomConfig;
	var smithConfig = _config.phaseStatistical.smithConfig;
	var storageConfig = _config.phaseStatistical.storageConfig;
	var goldAll = _config.phaseStatistical.goldAll;
	var tavernConfig = _config.phaseStatistical.tavernConfig;
	var itemConfig = _config.phaseStatistical.itemConfig;
	var storeConfig = _config.phaseStatistical.storeConfig;
	var mailConfig = _config.phaseStatistical.mailConfig;
	var gemBuyGemOther = _config.phaseStatistical.gemBuyGemOther;
	var gemGetGembuy = _config.phaseStatistical.gemGetGembuy;
	var sweepTicket = _config.phaseStatistical.sweepTicketConfig;
	var goldAllPaidMan = _config.phaseStatistical.goldAllPaidMan;
   var gemBuyGemOtherPaidMan = _config.phaseStatistical.gemBuyGemOtherPaidMan;
   var gemGetGembuyPaidMan = _config.phaseStatistical.gemGetGembuyPaidMan;
	configs = [countConfig,payConfig,paidboughtConfig,logConfig,pvpConfig,advConfig,familiarConfig,dishConfig,questConfig,roomConfig,smithConfig,storageConfig,tavernConfig,itemConfig,otherConfig,storeConfig,mailConfig,gemBuyGemOther,gemGetGembuy,goldAll,sweepTicket,goldAllPaidMan,gemBuyGemOtherPaidMan,gemGetGembuyPaidMan];	
	yAxisDay= {};
	var result= {
		xAxis:xAxis,
		yAxis:yAxisDay,
		title:"",
		subtitle:"星云素",
		ytitle:"数量 （个）",
		name:""
	};
	var types = {
		"AllUserCount":"101",
		"NewUserCount":"102",
		"LogOnCount":"103",
		"AllLogOnCount":"104",
		"AvgLogOnCount":"105",
		"ActiveUserCount":"106",
		"AvgOnlineCount":"108",
		"LossUserCount":"109",
		"DailyLeft":"110",
		"GemConsumed":"111",
		"PayUsers":"112",
		"PerPayOfUsers":"113",
		"PerPayOfActiveUsers":"114",
		"PayDegree":"115",
		"PayDegreeAvg":"116",
		"Conversion":"120",
		"NewUserConversion":"122",
		"AllPayUsers":"123",
		"PvPCount":"159",
		"PvPAvg":"160",
		"GemGet":"169",
		"GemCost":"170",
		"GoldGet":"172",
		"GoldCost":"173",
		"GoldGetPaidMan":"185",
		"GoldCostPaidMan":"186",
		"GemGetPaidMan":"180",
		"GemCostPaidMan":"182",
		"GemConsumedPaidMan":"181",
		"SweepTicketGet":"176",
		"SweepTicketCost":"177",
		"LogOn":"15001",
		"LogOut":"15002",
		"Register":"15003",
		"PvP":"15004",
		"BePvP":"15005",
		"PvPFinish":"15006",
		"BePvPFinish":"15007",
		"AdvOut":"15008",
		"AdvIn":"15009",
		"AdvEat":"15010",
		"AdvGene":"15011",
		"AdvLearnSkill":"15012",
		"AdvSummon":"15013",
		"AdvUpWeapon":"15014",
		"AdvUpArmor":"15015",
		"AdvUpItem":"15016",
		"AdvUpSkill":"15017",
		"AdvSetPvP":"15018",
		"AdvUpStar":"15019",
		"AdvLvUp":"15020",
		"FamiliarEat":"15021",
		"FamiliarUpSkill":"15022",
		"ChapterUnlock":"15023",
		"DishCook":"15024",
		"DishCookFinish":"15025",
		"DishCookCancel":"15026",
		"QuestStart":"15027",
		"QuestFinish":"15028",
		"QuestAbandon":"15029",
		"QuestSpin":"15030",
		"QuestResetCount":"15031",
		"QuestEliteStart":"15032",
		"QuestEliteFinish":"15033",
		"QuestEliteReset":"15034",
		"QuestRewardStart":"15035",
		"QuestRewardFinish":"15036",
		"QuestEliteSwitch":"15037",
		"QuestUnlock":"15038",
		"RoomUnlockSkill":"15039",
		"RoomLvUp":"15040",
		"RoomAdd":"15041",
		"SmithMakeStart":"15042",
		"SmithMakeFinish":"15043",
		"SmithMakeCancel":"15044",
		"SmithStrongStart":"15045",
		"SmithStrongFinish":"15046",
		"SmithDecompose":"15047",
		"SmithStrongCancel":"15048",
		"StorageSell":"15049",
		"StorageDiffDay":"15050",
		"StorageAdd":"15051",
		"StorageRemove":"15052",
		"StorageTakeOut":"15053",
		"TaskUp":"15054",
		"TavernUpEnergy":"15055",
		"TavernBuyGem":"15056",
		"TavernLvUp":"15057",
		"ItemAdd":"15058",
		"ItemRemove":"15059",
		"ShopRefresh":"15060",
		"ShopPurchase":"15061",
		"MailNew":"15062",
		"MailRemove":"15063",
		"MailTake":"15064",
		"QuestSweep":"15074",
		"NormalShopRefresh":"15065",
		"OdysseyShopRefresh":"15066",
		"PvPShopRefresh":"15067",
		"CoinShopRefresh":"15068",
		"GemShopPurchase":"15069",
		"CoinShopPurchase":"15070",
		"PvPCoinShopPurchase":"15071",
		"OdysseyCoinShopPurchase":"15072",
		"FameShopPurchase":"15073",
		"AdvUpEquipSet":"15081",
		"BuyGemBuy":"15075",
		"BuyGemOther":"15076",
		"SubGemBuy":"15077",
		"SubGemOther":"15078",
		"Revenge":"15079",
		"BeRevenge":"15080"
	};

	var timeX = [];//输出的数量不对，及表示数据出现问题
	var databind = function(i,q,cb){
		var keys = _.keys(types);
		//console.log("i:"+i+";keysLen:"+baseConfig.series.length);
		if (i!=0) {
			//console.log("timeX:"+JSON.stringify(timeX));
			q = q.where('logDate').in(timeX);
			//q = keystone.list('Statistical').model.find().where('logDate').in(timeX);
		}
		q = q.sort({'logDate':-1});
		
		var init = function(parm,next){
			 var keys = _.keys(yAxisDay);
			 var vali = eval("yAxisDay."+baseConfig.series[i]);
			if (!vali) {
				//console.log("asdf");
				eval("yAxisDay['"+baseConfig.series[i]+"']=[]");
			};
			eval("yAxisDay."+baseConfig.series[i]+".push(parm.count)");
			if(i==0){
				var date = ((new Date(parm.logDate*1000)).format("MM/dd hh:mm"));
				xAxis.push(date);
				timeX.push(parm.logDate);
				//console.log("timeX"+JSON.stringify(timeX));
			}
			next();
		}
		//console.log("b:"+Date.now());
		//console.log(q._conditions);
		q.exec(function(err, results) {
			console.log("results:"+results);
			//console.log("e:"+Date.now());
			if (!results) {
				results = [];
			};
			if(err)
			{
				console.log(err);
			}
			//console.log("databind:"+keys[i]+":"+JSON.stringify(results));
		//	var j = 0;
			async.forEach(results,init,function(){
			//	j++;
			//	if(j.length == results.length)
				//console.log("e2:"+Date.now());
				cb(err);
			});	
			//console.log("sessionCount:"+JSON.stringify(locals.sessionCount));

		});
	};
	var digui = function(i,baseConfig,next){
		var parm = locals.formatData;
		var op =Date.parse(parm["op"]);
		var ed =Date.parse(parm["ed"]);
		var num = parseInt(parm["num"]);
		var country = parm["country"];
		var onlypaid = parm["onlypaid"];
		var region = parm["region"];
		//console.log("i:"+i+ ";q stype:"+JSON.stringify(baseConfig)+";tType:"+ttype);
		var stype = types[baseConfig.series[i]];
		var q = keystone.list('Statistical').model.find().where('sType',stype);
		if(op)
			q = q.where("firstDate").gte(op/1000);
		if(ed)
			q = q.where("firstDate").lt(ed/1000);
		if(country)
			q = q.where("country",country);
		else
			q = q.where("country",{$exists:false});
		if(onlypaid)
			q = q.where("onlypaid",{$exists:true})
		else 
			q = q.where("onlypaid",{$exists:false});
		if(!region||(region+""=="0"))
			q = q.where("region",{$exists:false});
		else
			q = q.where("region",{$in:util.strArr2intArr(region.split(","))});
		if(num)
			q = q.limit(num);
		else 
			q = q.limit(10);
			console.log(q._conditions);
			//console.log(JSON.stringify(parm)+"sType:%s",stype);

		if(i==baseConfig.series.length-1)
			databind(i,q,next);
		else
			databind(i,q,function(err){
				digui(++i,baseConfig,next);
			});	
	};


	//console.log("begin ttype:"+ttype+";name:"+name)
	for (var i = 0; i<configs.length;i++) {
		 if(configs[i].name==name){
		 	baseConfig = configs[i];
		 	firstConfig = configs[i].series[0];
		 	break;
		 }
	};
	//console.log("config begin config:"+JSON.stringify(baseConfig));
	digui(0,baseConfig,function(err){
		//console.log("1");
		result.name = baseConfig.name;
		result.title = baseConfig.title;
		res.send(result);
	});	

	// view.on('post',{action:'phaseStatistical'},function(next){
	// 	var ttype = req.query["ttype"];
	// 	var stype = req.query["stype"];
	// 	var result = "";
	// 	res.send(result);
	// });
	
};
