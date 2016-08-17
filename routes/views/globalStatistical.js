var keystone = require('keystone');
var async    = require('async');
var _        = require("underscore");
var _config = keystone.get("_config");
var       q  = require("protobufjs");
var       fs = require("fs");
var gameConfigExchange = require("../../manager/GameConfigExchange");
var manager = require("../../manager/manager");
var winston = require("winston");
var utils     = require("../../manager/util/utils");

var getStrByDate = function(date){
  return new Date(date*1000).format("yyyy-MM-dd hh:mm:ss");
}

exports = module.exports = function(req, res) {
	var view = new keystone.View(req, res),
		locals = res.locals;
		locals.title=_config.title;
   var mager = new manager();
   var dateObj = {};
   mager.getFirstAndLastDate(dateObj,"daily",Date.now()/1000);
   locals.formatData = req.body || {};
   locals.timezone = _config.timezone||0;
   locals.filters = {
   		logdate:req.query.logdate || "",
        op:req.query.op || getStrByDate(dateObj.firstDate),
        ed:req.query.ed || getStrByDate(dateObj.lastDate),
        stype:req.query.stype,
        country:req.query.country || "",
        onlypaid:req.query.onlypaid || false,
        region:req.query.region || "0"
   };
  var permission = require("../../manager/permission");
	// Set locals
	var per = new permission();
	locals.hasPermission = false;
	if(req.user&&req.user.code)
		locals.hasPermission = per.HasPermisson("summary",req.user.code);
   locals.section = 'globalStatistical';
   locals.lastDate = 0;
   locals.onStatistical = keystone.get("onStatistical");
   var advCount = {name:"advCount",yname:"playerCount",text:"玩家拥有冒险者数量分布",sType:"125"};
   var advLevel1 = {name:"advLevel1",text:"冒险者等级分布",sType:"136"};
   var advLevel2 = {name:"advLevel2",text:"冒险者等级分布",sType:"137"};
   var advLevel3 = {name:"advLevel3",text:"冒险者等级分布",sType:"138"};
   var advLevel4 = {name:"advLevel4",text:"冒险者等级分布",sType:"139"};
   var advLevel5 = {name:"advLevel5",text:"冒险者等级分布",sType:"140"};
   var starAdv = {name:"starAdv",yname:"advCount",text:"冒险者星级分布",sType:"127"};
   var starLegend = {name:"starLegend",yname:"legendCount",text:"英雄星级分布",sType:"156"};
   var legendLevel1 = {name:"legendLevel1",text:"Legend等级分布",sType:"151"};
   var legendLevel2 = {name:"legendLevel2",text:"Legend等级分布",sType:"152"};
   var legendLevel3 = {name:"legendLevel3",text:"Legend等级分布",sType:"153"};
   var legendLevel4 = {name:"legendLevel4",text:"Legend等级分布",sType:"154"};
   var legendLevel5 = {name:"legendLevel5",text:"Legend等级分布",sType:"155"};
   var advRaceClass = {name:"advRaceClass",yname:"advCount",text:"冒险者种族职业分布",sType:"141",show:{table:"adventures",typeid:"typeId",value:"name"}};//show:{table:"adventures",typeid:"typeId",value:"name"}
   var advComeFrom = {name:"advComeFrom",text:"冒险者来源分布",sType:"142"};
   // var legendAdv = {name:"legendAdv",text:"传奇普通冒险者分布",sType:"126"};
   var odysseys = {name:"odysseys",text:"奥德赛完成次数",sType:"165",show:{table:"odysseys",typeid:"typeId",value:"title"}};
   var pvpAdvs = {name:"pvpadvs",text:"PvP冒险者分布",sType:"161",show:{table:"adventures",typeid:"typeId",value:"name"}};
   var pvpAdvsWin = {name:"pvpadvswin",text:"PvP冒险者胜利分布",sType:"163",show:{table:"adventures",typeid:"typeId",value:"name"}};
   var pvpSkills = {name:"pvpskills",text:"PvP冒险者技能分布",sType:"162",show:{table:"skills",typeid:"typeId",value:"name"}};
   var pvpSkillsWin = {name:"pvpskillsWin",text:"PvP冒险者技能胜利分布",sType:"164",show:{table:"skills",typeid:"typeId",value:"name"}}
   var equipSet = {name:"equipSet",yname:"advCount",text:"冒险者套装等级分布",sType:"128"};
   var advSummon ={name:"advSummon",yname:"advCount",text:"冒险者招募类型分布",sType:"148",exchange:{"0":"GM创建","1": "招募","2": "兑换"}};
   var advFamePurchase = {name:"advFamePurchase",yname:"advCount",text:"冒险者兑换分布",sType:"149",show:{table:"adventures",typeid:"typeId",value:"name"}};
   var questDis = {name:"questCount",yname:"questCount",text:"任务完成分布",sType:"129",show:{table:"quests",typeid:"typeId",value:"title"}};
   var questSweepDis = {name:"questSweepCount",yname:"questSweepCount",text:"扫荡完成分布",sType:"157",show:{table:"quests",typeid:"typeId",value:"title"}};
   var questDisDis = {name:"questCountDis",yname:"questCount",text:"任务完成分布(去重)",sType:"143",show:{table:"quests",typeid:"typeId",value:"title"}};
   var questSweepDisDis = {name:"questSweepCountDis",yname:"questSweepCount",text:"扫荡完成分布(去重)",sType:"158",show:{table:"quests",typeid:"typeId",value:"title"}};
   var task = {name:"task",yname:"taskCount",text:"Task分布",sType:"130",show:{table:"tasks",typeid:"typeId",value:"finishType"}};
   var phase = {name:"phase",text:"Phase分布",sType:"144"};
   var taskDis = {name:"taskDis",text:"Task分布(去重)",sType:"145"};
   var tutorialDis = {name:"tutorial",text:"Tutorial(完成)分布",sType:"131"};
   var paycontent = {name:"payContent",text:"付费内容分布",sType:"132"};
   //var gembuysubcontent = {name:"gemBuySubContent",text:"宝石收支",sType:"150"};
   var gemgetcontent ={name:'gemGetContent',text:"宝石获取分布",sType:"171"};
   var gembuysubcontent = {name:"gemBuySubContent",text:"宝石收支",sType:"150"};
   var playtime = {name:"playTime",text:"游戏时间分布",sType:"133"};
   var playtimeSection = {name:"playTimeSetion",text:"游戏时间(UTC)段分布-session",sType:"134"};
   var playtimeSection2 = {name:"playTimeOnlineUser",text:"游戏时间(UTC)段分布-在线用户",sType:"189"};
   var errorType = {name:"errorType",text:"错误类型分布",sType:"135"};
   var clientlogs = {name:"clientlogs",text:"过场动画用户行为分布",sType:"168"};
   var lastQuest = {name:"lastQuest",text:"用户最后关卡分布",sType:"167",show:{table:"quests",typeid:"title",value:"title"}};
   var goldGet = {name:"goldGet",text:"金币获取分布",sType:"174"};
   //var gembuysubcontent = {name:"gemBuySubContent",text:"宝石收支",sType:"150"};
   var goldCost ={name:'goldCost',text:"金币消耗分布",sType:"175"};
   var sweepticketGet = {name:"sweepticketGet",text:"扫荡券获取分布",sType:"178"};
   var sweepticketCost = {name:"sweepticketCost",text:"扫荡券消耗分布",sType:"179"};
   var goldGetPaidMan = {name:"goldGetPaidMan",text:"付费金币获取分布",sType:"187"};
   var goldCostPaidMan = {name:'goldCostPaidMan',text:"付费金币消耗分布",sType:"188"};
   var payContentPaidMan = {name:"payContentPaidMan",text:"付费用户内容分布",sType:"184"};
   var gemgetcontentPaidMan = {name:'gemGetContentPaidMan',text:"付费用户宝石获取分布",sType:"183"};
   var countryContent = {name:'contryContent',text:"国别分布(活跃度)",sType:"190"};
   var countryContent_RD = {name:'contryContent_RD',text:"国别分布(用户)",sType:"194"};
   var pvplevelContent = {name:'pvplevelContent',text:"等级与PvP次数关系分布(总量)",sType:"191"};
   var pvplevelavgContent = {name:'pvplevelavgContent',text:"等级与PvP次数关系分布(平均量)",sType:"193"};
   var pvpcountContent = {name:"pvpcountContent",text:"人数与PvP次数关系分布",sType:"192"};
   var tavernlevel = {name:"tavernlevel",text:"酒馆等级",sType:"195"};

   //locals.categories = [clientlogs,advLevel1,advLevel2,advLevel3,advLevel4,advLevel5,starAdv,starLegend,legendLevel1,legendLevel2,legendLevel3,legendLevel4,legendLevel5,advRaceClass,advSummon,advFamePurchase,equipSet,pvpAdvs,pvpAdvsWin,pvpSkills,pvpSkillsWin,countryContent,countryContent_RD,pvplevelContent,pvplevelavgContent,pvpcountContent,goldGet,goldCost,odysseys,questDis,lastQuest,questSweepDis,questDisDis,questSweepDisDis,task,paycontent,gembuysubcontent,gemgetcontent,playtime,playtimeSection,playtimeSection2,errorType,sweepticketGet,sweepticketCost,goldGetPaidMan,goldCostPaidMan,payContentPaidMan,gemgetcontentPaidMan];
   var categories = [clientlogs,countryContent,countryContent_RD,pvplevelContent,pvplevelavgContent,pvpcountContent,goldGet,goldCost,odysseys,questDis,lastQuest,questSweepDis,questDisDis,questSweepDisDis,task,paycontent,gembuysubcontent,gemgetcontent,playtime,playtimeSection,playtimeSection2,errorType,sweepticketGet,sweepticketCost,goldGetPaidMan,goldCostPaidMan,payContentPaidMan,gemgetcontentPaidMan,tavernlevel];
   locals.categories = [clientlogs,countryContent,countryContent_RD,pvplevelContent,pvplevelavgContent,pvpcountContent,odysseys,questDis,questDisDis,lastQuest,questSweepDis,questSweepDisDis,task,paycontent,gembuysubcontent,gemgetcontent,playtime,playtimeSection,playtimeSection2,errorType,tavernlevel];

	// locals.section is used to set the currently selected
	// item in the header navigation.
	view.on("get",function(next){
		next();
	});
	var getCollection = function(parms,stype,firstDate,lastDate){
		var result = {logDate:Date.parse(new Date())/1000,firstDate:firstDate,lastDate:lastDate,count:0,tType:1,sType:stype,countObj:{}};
		_.each(parms,function(parm){
			var thisCountObj =JSON.parse(parm.countObj);
			var thisKeys =  _.keys(thisCountObj);
			_.each(thisKeys,function(key){
				if(result.countObj[key])
					result.countObj[key]+=parseInt(thisCountObj[key]);
				else
					result.countObj[key]=parseInt(thisCountObj[key]);
			});
		});
		result.countObj = JSON.stringify(result.countObj);
		return result;
	}
	view.on("post",function(next){
		var m = new manager();
		var parm = locals.formatData;
		var gce = new gameConfigExchange();


		//console.log(logDate);
		var getIt = function(err,results){
			if (err) {
				console.log(new Date()+err);
			};
			var lastDate = "",firstDate="";
			var datas={keys:[],values:[]};

			console.log("post : %s",JSON.stringify(results));
			if (results&&results[0]&&results[0].countObj) {
				var result = {};
				if(results.length==1)
				{
					 result = results[0];
					 lastDate = new Date(result.lastDate*1000 );
					lastDate ="(end:" + lastDate.format("MM-dd",true) + ")";
					firstDate = new Date(result.firstDate*1000 );
					firstDate = "(begin:"+firstDate.format("MM-dd",true)+")";
					console.log("firstDate:"+result.firstDate);
				}
				else
				{
					result = getCollection(results,parm.stype,op,ed);
					lastDate = new Date(ed*1000);
					lastDate ="(end:" + lastDate.format("MM-dd",true) + ")";
					firstDate = new Date(op*1000 );
					firstDate = "(begin:"+firstDate.format("MM-dd",true)+")";
					console.log("firstDate:"+result.lastDate);
				}
				var countObj = JSON.parse(result.countObj);
				datas.keys = _.keys(countObj);
				datas.values =_.values(countObj);
			}
			var result = {};
			result.category = _.find(categories,function(p){return p.sType == parm.stype});

			result.category.text = result.category.text  +firstDate + lastDate;
			result.datas = datas;

			//advSummon类型 硬赋值
			// if(result.category.name="advSummon")
			// 	result.datas.keys=["GM生成","招募","兑换"];

			if(result.category.exchange){
				var keysParm = [];
				for(var i=0;i<result.datas.keys.length;i++){
					var key = result.datas.keys[i];
					if(result.category.exchange[key])
						keysParm.push(result.category.exchange[key]);
				}
				result.datas.keys = keysParm;
			}
			if(result.category.show){
				gce.getExchange(result.category.show.table,result.category.show.typeid,result.category.show.value,function(exchange){

					//console.log("exchange:%s,result.datas.keys:%s",JSON.stringify(exchange),JSON.stringify(result.datas.keys));
					var new_keys=[];
					for(var i=0;i<result.datas.keys.length;i++){
						var key = result.datas.keys[i];
						//console.log("key:%s",key);
						new_keys.push(exchange[key]);
					}
					result.datas.keys = new_keys;
					//console.log(JSON.stringify(result.datas));
					res.send(result);
				});
			}
			else
				res.send(result);
		}

		var op =0;var ed = 0;
		if(req.body.op)
			op =  utils.getDateByString(req.body.op);
		if(req.body.ed)
			ed = utils.getDateByString(req.body.ed);

		console.log("op:"+op+",globalStatistical:"+new Date(op*1000).format(null,true)+",op:"+op);

		var q = keystone.list("Statistical").model.find({sType:parm.stype});
		if(req.body.ed)
			q = q.where("firstDate").lt(ed);
		if(req.body.op)
			q = q.where("firstDate").gte(op);
		if(req.body.country)
			q = q.where("country",req.body.country);
		else
			q = q.where("country",{$exists:false});
		if(req.body.onlypaid)
			q = q.where("onlypaid",{$exists:true});
		else
			q = q.where("onlypaid",{$exists:false});
		if(!req.body.region|| req.body.region=="0")
			q = q.where("region",{$exists:false});
		else
			q = q.where("region",{$in:utils.strArr2intArr(req.body.region.split(","))});
		q=q.sort({firstDate:-1});
		console.log(q._conditions);
		//gce.getExchange();
		q.exec(getIt);
	});
	view.render('globalStatistical');

};
