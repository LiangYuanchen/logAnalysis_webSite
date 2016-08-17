var keystone = require("keystone"),
    async = require('async'),
    _ = require('underscore'),
    util = require('util'),
    utils = require("../util/utils");
var winston = require('../util/LogsBackup');
var BaseCal = require("./BaseCal");

var GemCal = function (handle) {
    BaseCal.call(this,handle);

    this.gembuyget = [];
    this.gemotherget = [];

    this.gemget = [];

    this.gemcost = [];

    this.gemcost_obj = [];
    this.gemget_obj = [];

    this.CalType = "GemCal";

}
util.inherits(GemCal,BaseCal);
exports = module.exports = GemCal;

/////////////////////


GemCal.prototype.AddOneByRecursive_Count = function(count, options, arr)
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

GemCal.prototype.AddOneByRecursive_CountObj = function(count, countObjKey, options, arr)
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

GemCal.prototype.process = function(log, options)
{
    var getType = function(logType)
    {
        var thetype = "";
        if(log.logType=="GemShopPurchase")
        {
            var arrMsg = log.message.split(",");
            switch(arrMsg[1]){
                case "1":
                    thetype="AdvShopPurchase";
                    break;
                case "2":
                    thetype="normalShopPurchase";
                    break;
                case "3":
                    thetype="odysseyShopPurchase";
                    break;
                case "4":
                    thetype="pvpShopPurchase";
                    break;
                case "5":
                    thetype="coinShopPurchase";
                    break;
                case "6":
                    thetype="blackShopPurchase";
                    break;
                default:
                    break;
            }
        }
        else
            thetype = log.logType;    
        return thetype;
    }    
    var self = this;
    //2=paid 4=buygem 1=code_getgem
    if(log.code==undefined)
    {
        return;
    }
    if((log.code&2)!=2&&(log.code&4)!=4&&(log.code&1)!=1)
        return;
    if(typeof log.country == "string")
        options.country = log.country;
    if(isNaN(log.R2))
        options.region=1;
    else
        options.region = parseInt(log.R2);

    gem = parseInt(log.R1);
    var gemgetCount = 0;
    if((log.code&2) == 2)
    {
        self.AddOneByRecursive_Count(gem,options,self.gemcost);
        var thetype = getType(log.logType);
        self.AddOneByRecursive_CountObj(gem,thetype,options,self.gemcost_obj);
    }
    else if((log.code&4) == 4)
    {
        var arrMsg = log.message.split(",");
        gemgetCount+=gem;
        self.AddOneByRecursive_Count(gem,options,self.gembuyget)
        if(!isNaN(arrMsg[3]))
        {
           gemgetCount += parseInt(arrMsg[3]);
           self.AddOneByRecursive_CountObj(parseInt(arrMsg[3]),"buygemother",options,self.gemget_obj);
        }
        else if(!isNaN(arrMsg[12]))
        {
            gemgetCount += parseInt(arrMsg[12]);
            self.AddOneByRecursive_CountObj(parseInt(arrMsg[12]),"buygemother",options,self.gemget_obj);
        }
        else
            winston.info("error# get gemothergetcount error,log:%s",JSON.stringify(log));

        self.AddOneByRecursive_CountObj(gem,"buygem",options,self.gemget_obj);
    }
    else if((log.code&1) == 1)
    {
        gemgetCount+=gem;
        if(log.logType=="Register"||log.logType=="TaskTakeRW"){
            self.AddOneByRecursive_CountObj(gem,log.logType,options,self.gemget_obj);
        }
        else if(log.logType=="MailTake")
        {
            var arrMsg = log.message.split(",");
            if(arrMsg[2]==""&&arrMsg[1]==0&&!isNaN(log.R1)&&gem>0)
            {
                self.AddOneByRecursive_CountObj(gem,"MonthCard",options,self.gemget_obj);
            }
            else if(!isNaN(log.R1)&&gem>0)
            {
                self.AddOneByRecursive_CountObj(gem,"Activity",options,self.gemget_obj);
            }
        }
    }

    if(gemgetCount>0)
    {
        self.AddOneByRecursive_Count(gemgetCount,options,self.gemget);
    }
}

GemCal.prototype.save = function(stats){
    var self = this;
    var arrStatisticalJSON = [];
    self.saveStatistical(stats, self.handle.sType.gem_get, self.gemget, arrStatisticalJSON);
    self.saveStatistical(stats, self.handle.sType.gembuy_get, self.gembuyget, arrStatisticalJSON);
    self.saveStatistical(stats, self.handle.sType.gem_cost, self.gemcost, arrStatisticalJSON);
    self.saveStatistical(stats, self.handle.sType.gem_get_obj, self.gemget_obj, arrStatisticalJSON);
    self.saveStatistical(stats, self.handle.sType.gem_cost_obj, self.gemcost_obj, arrStatisticalJSON);

    // var baseGetStatistical = _.find(self.getCounts,function(parm){
    //     var parmKey = _.keys(parm);
    //     return parmKey.length==1;
    // });

    // winston.info("theGlobalGet:%s,theGlobalCost:%s,baseGetStatistical:%s,self.getCounts:%s",self.test_get,self.test_cost,JSON.stringify(baseGetStatistical),JSON.stringify(self.getCounts));
    self.data = [];
    self.gemget = [];
    self.gembuy_get = [];
    self.gemcost = [];
    self.gemget_obj = [];
    self.gemcost_obj =[];
    
    return arrStatisticalJSON;
}

