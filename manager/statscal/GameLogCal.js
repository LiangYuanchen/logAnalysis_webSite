var keystone = require("keystone"),
    async = require('async'),
    _ = require('underscore'),
    util = require('util'),
    utils = require("../util/utils");
var winston = require('../util/LogsBackup');
var BaseCal = require("./BaseCal");
var GameLogCal = function (handle) {
    BaseCal.call(this,handle);

    this.CalType = "GameLogCal";

    this.odysseys = [];
    this.quests = [];
    this.quests_uniq = [];
    this.sweep = [];
    this.sweep_uniq = [];
    this.tasks = [];
    this.tasks_uniq = [];
    this.phases = [];
    this.tutorials = [];
    this.logtimes = [];
    this.playTime_session = [];
    this.playTime_online = [];
    this.errorTypes = [];
    this.clientlogs = [];
    this.lastquests = [];
}
util.inherits(GameLogCal,BaseCal);
exports = module.exports = GameLogCal;



GameLogCal.prototype.AddOneByRecursive_GameLogLogTime = function(time, options, arr)
{
    var self = this;
    var keys = _.keys(options);
    
    var allKeys = utils.combinations(keys);

    var baseStatistical = _.find(arr,function(parm){
        var parmKey = _.keys(parm);
        return parmKey.length==1;
    });
    if(!baseStatistical)
    {
        baseStatistical = {countObj:{"0-15":0,"15-30":0,"30-60":0,"60-120":0,"120-180":0,">180":0}};
        arr.push(baseStatistical);
    }
    
    _.each(allKeys, function (subKeys) {
        var option = {};
        _.each(subKeys, function (k) {
            option[k] = options[k];
        });
        var statistical =  self.findByParm(option, arr);
       // winston.info("data:%s",JSON.stringify(statistical));
        if(!statistical.countObj)
            statistical.countObj = {"0-15":0,"15-30":0,"30-60":0,"60-120":0,"120-180":0,">180":0};
        statistical.countObj[getGameTime(time)]++;
        //Not_CN
        if(option.country&&option.country!="CN")
        {
            option.country = "Not_CN";
            var not_cn_statistical = self.findByParm(option, arr);
            if(!not_cn_statistical.countObj)
                not_cn_statistical.countObj = {"0-15":0,"15-30":0,"30-60":0,"60-120":0,"120-180":0,">180":0};
            not_cn_statistical.countObj[getGameTime(time)]++;
        }
    });

    baseStatistical.countObj[getGameTime(time)]++;
}
var getGameTime = function(time_t)
{
    //console.log(time_t);
    if (time_t<=15*60) {
        return "0-15";
    };
    if (time_t>15*60&&time_t<=60*30) {
        return "15-30";
    };
    if (time_t>60*30&&time_t<=60*60) {
        return  "30-60";
    };
    if (time_t>60*60&&time_t<=60*120) {
        return "60-120";
    };
    if (time_t>60*120&&time_t<=60*180) {
        return "120-180";
    };
    if (time_t>60*180) {
        return ">180";
    };
    return "undefined";
}
/////////////////////
GameLogCal.prototype.process = function(log, options)
{
    var self = this;
    
    // if(log.logType != self.logType)
    //     return;

    if(typeof log.country == "string")
        options.country = log.country;
    if(isNaN(log.R2))
        options.region=1;
    else
        options.region = parseInt(log.R2);

    self.AddOneByRecursive_Count(options, self.data);

    if(log.logType == "QuestEliteFinish")
    {
        var arrStr = log.message.split(",");
        if(arrStr.length>5){   
            if(arrStr[1]=="0"){
                self.AddOneByRecursive_CountObj(arrStr[0], options, self.odysseys);
            } 
        }
    }
    else if(log.logType == "QuestFinish")
    {
        var arrStr = log.message.split(",");
        self.AddOneByRecursive_CountObj(arrStr[0],options,self.quests);
        self.AddOneByRecursive_uniq(log.uid,arrStr[0],options,self.quests_uniq);
    }
    else if(log.logType == "QuestSweep")
    {
        var arrStr = log.message.split(",");
        self.AddOneByRecursive_CountObj(arrStr[0],options,self.sweep);
        self.AddOneByRecursive_uniq(log.uid,arrStr[0],options,self.sweep_uniq);
    }
    else if(log.logType == "TaskUp")
    {
        var arrStr = log.message.split(",");
        
        if (arrStr[0]=="phase") 
            self.AddOneByRecursive_CountObj(arrStr[0],options,self.phases);
        else {
            self.AddOneByRecursive_CountObj(arrStr[0],options,self.tasks);
            self.AddOneByRecursive_uniq(log.uid,arrStr[0],options,self.tasks_uniq);
        }        
    }
    else if(log.logType == "Tutorial")
    {
        var arrStr = log.message.split(",");
        if(arrStr[0]=="f")
        {
            self.AddOneByRecursive_CountObj(arrStr[1], options, self.tutorials);
        }
    }
    else if(log.logType == "LogOut")
    {
        var arrStr = log.message.split(",");
        var logtime = parseInt(arrStr[0]);
        self.AddOneByRecursive_GameLogLogTime(logtime, options, self.logtimes);
    }
    else if(log.logType == "MgrErr" || log.logType == "HandlerErr")
    {
        self.AddOneByRecursive_CountObj(log.category, options, self.errorTypes);
    }
    else if(log.logType == "PlayerClientLog")
    {
        var arrStr = log.message.split(",");
        self.AddOneByRecursive_CountObj(arrStr[0], options, self.clientlogs);
    }

    //PlayTime
    var logDate = new Date(log.timeStamp*1000);
    self.AddOneByRecursive_CountObj(logDate.getUTCHours().toString(), options, self.playTime_session);
    self.AddOneByRecursive_uniq(log.uid,logDate.getUTCHours().toString(), options, self.playTime_online);
}

var uniqDataInit = function(arr){
    _.each(arr,function(q){
       var keysQ = _.keys(q.countObj);
       _.each(keysQ,function(questTypeid){
            var keysUid = _.keys(q.countObj[questTypeid]);
            q.countObj[questTypeid] = keysUid.length;
       }); 
    });    
}

GameLogCal.prototype.save = function(stats){
    var self = this;
    var arrStatisticalJSON = [];
   // self.saveStatistical(stats, self.sType, self.data, arrStatisticalJSON);
    self.saveStatistical(stats, self.handle.sType.odyssey, self.odysseys, arrStatisticalJSON);
    
    uniqDataInit(self.quests_uniq);
    self.saveStatistical(stats, self.handle.sType.quest, self.quests, arrStatisticalJSON);
    self.saveStatistical(stats, self.handle.sType.quest_uniq, self.quests_uniq, arrStatisticalJSON);

    uniqDataInit(self.sweep_uniq);
    self.saveStatistical(stats, self.handle.sType.questSweep, self.sweep, arrStatisticalJSON);
    self.saveStatistical(stats, self.handle.sType.questSweep_uniq, self.sweep_uniq, arrStatisticalJSON);

    uniqDataInit(self.tasks_uniq);
    self.saveStatistical(stats, self.handle.sType.task, self.tasks, arrStatisticalJSON);
    self.saveStatistical(stats, self.handle.sType.task_uniq, self.tasks_uniq, arrStatisticalJSON);

    self.saveStatistical(stats, self.handle.sType.tutorial, self.tutorials, arrStatisticalJSON);

    uniqDataInit(self.playTime_online);
    self.saveStatistical(stats, self.handle.sType.playTime, self.logtimes, arrStatisticalJSON);
    self.saveStatistical(stats, self.handle.sType.playTime_session, self.playTime_session, arrStatisticalJSON);
    self.saveStatistical(stats, self.handle.sType.playTime_online, self.playTime_online, arrStatisticalJSON);

    self.saveStatistical(stats, self.handle.sType.errorType, self.errorTypes, arrStatisticalJSON);

    self.saveStatistical(stats, self.handle.sType.clientlog, self.clientlogs, arrStatisticalJSON);

    _.each(self.handle.gameusers, function(gameuser){
        var op = {};
        op.country = gameuser.country;
        op.region = gameuser.region;
        if(_.contains(self.handle.paiduids, gameuser.uid))
            op.onlypaid=true;
        self.AddOneByRecursive_CountObj(gameuser.lastQuest, op, self.lastquests);
    });
    self.saveStatistical(stats, self.handle.sType.lastQuest, self.lastquests, arrStatisticalJSON);

    self.data = [];
    self.odysseys = [];
    self.quests = [];
    self.quests_uniq = [];
    self.sweep = [];
    self.sweep_uniq = [];
    self.tutorials = [];
    self.tasks_uniq = [];
    self.tasks = [];
    self.tutorials = [];
    self.logtimes = [];
    self.playTime_session = [];
    self.playTime_online = [];
    self.errorTypes = [];
    self.clientlogs = [];
    self.lastquests = [];
    
    return arrStatisticalJSON;
}

