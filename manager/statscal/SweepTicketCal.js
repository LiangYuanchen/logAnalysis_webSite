var keystone = require("keystone"),
    async = require('async'),
    _ = require('underscore'),
    util = require('util'),
    utils = require("../util/utils");
var winston = require('../util/LogsBackup');
var BaseCal = require("./BaseCal");

var SweepTicketCal = function (handle) {
    BaseCal.call(this,handle);

    this.getCount = [];
    this.costCount = [];
    this.getObj = [];
    this.costObj = [];
    this.CalType = "SweepTicketCal";
}
util.inherits(SweepTicketCal,BaseCal);
exports = module.exports = SweepTicketCal;

/////////////////////

SweepTicketCal.prototype.AddOneByRecursive_Count = function(count, options, arr)
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
        baseStatistical = {count:0};
        arr.push(baseStatistical);
    }
    _.each(allKeys, function (subKeys) {
        var option = {};
        _.each(subKeys, function (k) {
            option[k] = options[k];
        });

        //winston.info("#BaseCal#subKeys:%s,allKeys:%s,options.country:%s",JSON.stringify(subKeys),JSON.stringify(allKeys),options.country);
        var statistical = self.findByParm(option, arr);
        //winston.info("#BaseCal#statistical:%s",JSON.stringify(statistical));
        if(!statistical.count)
            statistical.count = 0;
        statistical.count+=count;
        
    });
    baseStatistical.count+=count;
}

SweepTicketCal.prototype.AddOneByRecursive_CountObj = function(count, countObjKey, options, arr)
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
        baseStatistical = {countObj:{}};
        arr.push(baseStatistical);
    }
    
    _.each(allKeys, function (subKeys) {
        var option = {};
        _.each(subKeys, function (k) {
            option[k] = options[k];
        });
        var statistical =  self.findByParm(option, arr);
        if(!statistical.countObj)
            statistical.countObj = {};
        if(!statistical.countObj[countObjKey])
            statistical.countObj[countObjKey]= 0;
        statistical.countObj[countObjKey]+=count;

    });
    if(!baseStatistical.countObj[countObjKey])
        baseStatistical.countObj[countObjKey]= 0;
    baseStatistical.countObj[countObjKey]+=count;    
}

SweepTicketCal.prototype.process = function(log, options)
{
    var self = this;

    if(log.logType!="MailTake"&&log.logType!="TaskTakeRW"&&log.logType!="QuestSweep")
    {
        return;
    }

    if(typeof log.country == "string")
        options.country = log.country;
    if(isNaN(log.R2))
        options.region=1;
    else
        options.region = parseInt(log.R2);

    var arrStr = log.message.split(",");
    if(log.logType=="MailTake")
    {
        var strRW = arrStr[3];
        if(strRW&&strRW.indexOf("11000_")>=0)
        {
            var arrRW = strRW.split("-");
            _.each(arrRW,function(parm){
                var rw = parm.split("_");
                if(rw[0]=="11000")
                {
                    if(!isNaN(rw[1]))
                    {
                        self.AddOneByRecursive_Count(parseInt(rw[1]),options,self.getCount);
                        self.AddOneByRecursive_CountObj(parseInt(rw[1]),log.logType,options,self.getObj);
                    }
                }
            });
        }
    }
    else if(log.logType=="TaskTakeRW")
    {
        var typeid_task = parseInt(arrStr[0]);
        var thisTask = _.find(self.handle.gcTask,function(parm){return parm.typeId==typeid_task});
        if(thisTask&&thisTask.rewards&&thisTask.rewards.length)
        {
            _.each(thisTask.rewards,function(parm){
                if((parm.typeId+"")=="11000")
                {
                    self.AddOneByRecursive_Count(parseInt(parm.amount),options,self.getCount);
                    self.AddOneByRecursive_CountObj(parseInt(parm.amount),log.logType,options,self.getObj);
                }
            });
        }
    }
    else if(log.logType=="QuestSweep")
    {
        var keyName = arrStr[0] + "_" + arrStr[1];
        var value = parseInt(arrStr[2]) - parseInt(arrStr[4]);
        self.AddOneByRecursive_Count(value,options,self.costCount);
        self.AddOneByRecursive_CountObj(value,keyName,options,self.costObj);
    }
}

SweepTicketCal.prototype.save = function(stats){
    var self = this;
    var arrStatisticalJSON = [];
    self.saveStatistical(stats, self.handle.sType.sweep_get, self.getCount, arrStatisticalJSON);
    self.saveStatistical(stats, self.handle.sType.sweep_cost, self.costCount, arrStatisticalJSON);
    self.saveStatistical(stats, self.handle.sType.sweep_get_obj, self.getObj, arrStatisticalJSON);
    self.saveStatistical(stats, self.handle.sType.sweep_cost_obj, self.costObj, arrStatisticalJSON);
    var baseGetStatistical = _.find(self.getCounts,function(parm){
        var parmKey = _.keys(parm);
        return parmKey.length==1;
    });

    self.data = [];
    self.getCount = [];
    self.costCount = [];
    self.getObj = [];
    self.costObj = [];

    return arrStatisticalJSON;
}

