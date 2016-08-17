var keystone = require("keystone"),
    async = require('async'),
    _ = require('underscore'),
    util = require('util'),
    utils = require("../util/utils");
var winston = require('../util/LogsBackup');
var BaseCal = require("./BaseCal");

var CostCal = function (handle) {
    BaseCal.call(this,handle);

    this.costCounts = [];
    this.getCounts = [];
    this.costObj = [];
    this.getObj = [];
    this.test_cost = 0;
    this.test_get  = 0;

    this.CalType = "CostCal";

}
util.inherits(CostCal,BaseCal);
exports = module.exports = CostCal;

/////////////////////
var getTheType=function(logType,msg)
{
    var thetype = logType;
    if(thetype=="SubGemBuy"||thetype=="SubGemOther")
    {
        thetype = "SubGem";
    }
    if(thetype=="CoinShopPurchase")
    {
        var arrMsg = msg.split(",");
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
    return thetype;
}

CostCal.prototype.AddOneByRecursive_Count = function(count, options, arr)
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

CostCal.prototype.AddOneByRecursive_CountObj = function(count, countObjKey, options, arr)
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

CostCal.prototype.process = function(log, options)
{
    var self = this;
    
    //8= getgold 16= costgold
    if(log.code==undefined)
        return;
    if((log.code&8)!=8&&(log.code&16)!=16)
        return;

    var users_sync = self.handle.users_sync;
    var thisUser = users_sync[log.uid];
    if(!thisUser)
    {
        self.handle.SYNCCurrency(log.uid,"gold",log.gold);
        return;
    }
    if(typeof log.country == "string")
        options.country = log.country;
    if(isNaN(log.R2))
        options.region=1;
    else
        options.region = parseInt(log.R2);
    var theType = getTheType(log.logType,log.message);
    if(!theType)
        return;
    
    if((log.code&8)==8)
    {
        var theget =(parseFloat(log.gold) - parseFloat(thisUser.gold));
        self.AddOneByRecursive_Count(theget,options,self.getCounts);
        self.AddOneByRecursive_CountObj(theget,theType,options,self.getObj);
        //winston.info("theget:",theget);
        self.test_get += theget;      
    }
    if((log.code&16)==16)
    {
        var thecost =(parseFloat(thisUser.gold) - parseFloat(log.gold));
        self.AddOneByRecursive_Count(thecost,options,self.costCounts);
        self.AddOneByRecursive_CountObj(thecost,theType,options,self.costObj);
        self.test_cost += thecost;       
    }

    //记录最新的gold值
    self.handle.SYNCCurrency(log.uid,"gold",log.gold);

    // if(parseFloat(thisUser.gold)>parseFloat(log.gold)&&_.contains(self.handle.logTypeFilter_cost,log.logType))//cost
    // {
    //     var thecost =(parseFloat(thisUser.gold) - parseFloat(log.gold));
    //     self.AddOneByRecursive_Count(thecost,options,self.costCounts);
    //     self.AddOneByRecursive_CountObj(thecost,theType,options,self.costObj);
    //     self.test_cost += thecost;
    //     //winston.info("thecost:",thecost);
    // }    
    // else if(parseFloat(thisUser.gold)<parseFloat(log.gold)&&_.contains(self.handle.logTypeFilter_get,log.logType))
    // {
    //     var theget =(parseFloat(log.gold) - parseFloat(thisUser.gold));
    //     self.AddOneByRecursive_Count(theget,options,self.getCounts);
    //     self.AddOneByRecursive_CountObj(theget,theType,options,self.getObj);
    //     //winston.info("theget:",theget);
    //     self.test_get += theget;
    // }
    
}

CostCal.prototype.save = function(stats){
    var self = this;
    var arrStatisticalJSON = [];
    self.saveStatistical(stats, self.handle.sType.gold_get, self.getCounts, arrStatisticalJSON);
    self.saveStatistical(stats, self.handle.sType.gold_cost, self.costCounts, arrStatisticalJSON);
    self.saveStatistical(stats, self.handle.sType.gold_get_obj, self.getObj, arrStatisticalJSON);
    self.saveStatistical(stats, self.handle.sType.gold_cost_obj, self.costObj, arrStatisticalJSON);
    // var baseGetStatistical = _.find(self.getCounts,function(parm){
    //     var parmKey = _.keys(parm);
    //     return parmKey.length==1;
    // });
    // winston.info("theGlobalGet:%s,theGlobalCost:%s,baseGetStatistical:%s,self.getCounts:%s",self.test_get,self.test_cost,JSON.stringify(baseGetStatistical),JSON.stringify(self.getCounts));
    self.data = [];
    self.getCounts = [];
    self.costCounts = [];
    self.getObj = [];
    self.costObj = [];
    

    return arrStatisticalJSON;
}

