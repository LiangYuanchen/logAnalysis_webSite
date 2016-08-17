var keystone = require("keystone"),
    async = require('async'),
    _ = require('underscore'),
    util = require('util'),
    utils = require("../util/utils");
var winston = require('../util/LogsBackup');
var BaseCal = require("./BaseCal");
var SummaryCal = function (handle) {
    BaseCal.call(this,handle);
    this.CalType = "SummaryCal";
    this.dau_uid = [];
}
util.inherits(SummaryCal,BaseCal);
exports = module.exports = SummaryCal;

var template = function() {

    return {priceCount:0,paiduids:{},DNU:0,DAU:0};
};
var scale = 0.7;

SummaryCal.prototype.findByParm = function(option,arr){
    var self = this;

    var keys = _.keys(option);

    var arrParm = _.where(arr,option);

    if(arrParm.length==0)
    {
        var parm = _.clone(option);
        _.extend(parm,template());
        arr.push(parm);
        
        return parm;
    }
    else{
        for(var i=0;i<arrParm.length;i++)
        {
            var parmLength = _.keys(arrParm[i]).length - 4;
            // if(arrParm[i].priceCount)
            //     parmLength--;
            // if(arrParm[i].paiduids)
            //     parmLength--;
            // if(arrParm[i].DNU)
            //     parmLength--;
            // if(arrParm[i].DAN)
            //     parmLength--;
            
            if(parmLength==_.keys(option).length)
                return arrParm[i];
        }
        var parm = _.clone(option);
        _.extend(parm,template());
        arr.push(parm);
        
        //winston.info("#BaseCal#parm2:%s,option:%s",JSON.stringify(parm),JSON.stringify(option));
        return parm;        
    }
}
SummaryCal.prototype.AddOneByRecursive_Count = function(objKey,options, arr)
{
    var self = this;
    var keys = _.keys(options);
    var allKeys = utils.combinations(keys);
    
    var baseStatistical = _.find(arr,function(parm){
        var parmKey = _.keys(parm);
        return parmKey.length==4;
    });
    if(!baseStatistical)
    {
        baseStatistical = template();
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
        if(!statistical[objKey])
            statistical[objKey] = 0;
        statistical[objKey]++;

        //Not_CN
        if(option.country&&option.country!="CN")
        {
            option.country = "Not_CN";
            var not_cn_statistical = self.findByParm(option, arr);
            if(!not_cn_statistical[objKey])
                not_cn_statistical[objKey] = 0;
            not_cn_statistical[objKey]++;
        }

        
    });
    baseStatistical[objKey]++;
}
SummaryCal.prototype.AddOneByRecursive_Price = function(price,options, arr)
{
    var self = this;
    var keys = _.keys(options);
    var allKeys = utils.combinations(keys);
    
    var baseStatistical = _.find(arr,function(parm){
        var parmKey = _.keys(parm);
        return parmKey.length==4;
    });
    if(!baseStatistical)
    {
        baseStatistical = template();
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
        if(!statistical.priceCount)
            statistical.priceCount = 0;
        statistical.priceCount+=price;

        //Not_CN
        if(option.country&&option.country!="CN")
        {
            option.country = "Not_CN";
            var not_cn_statistical = self.findByParm(option, arr);
            if(!not_cn_statistical.priceCount)
                not_cn_statistical.priceCount = 0;
            not_cn_statistical.priceCount+=price;
        }        
    });
    baseStatistical.priceCount+=price;
}
SummaryCal.prototype.AddOneByRecursive_PaidMan = function(countObjKey,options, arr)
{
    var self = this;
    var keys = _.keys(options);
    
    var allKeys = utils.combinations(keys);

    var baseStatistical = _.find(arr,function(parm){
        var parmKey = _.keys(parm);
        return parmKey.length==4;
    });

    if(!baseStatistical)
    {
        baseStatistical = template();
        arr.push(baseStatistical);
    }
    
    _.each(allKeys, function (subKeys) {
        var option = {};
        _.each(subKeys, function (k) {
            option[k] = options[k];
        });
        var statistical =  self.findByParm(option, arr);
        if(!statistical.paiduids)
            statistical.paiduids = {};
        if(!statistical.paiduids[countObjKey])
            statistical.paiduids[countObjKey]= 0;
        statistical.paiduids[countObjKey]++;

        //Not_CN
        if(option.country&&option.country!="CN")
        {
            option.country = "Not_CN";
            var not_cn_statistical = self.findByParm(option, arr);
            if(!not_cn_statistical.paiduids)
                not_cn_statistical.paiduids = {};
            if(!not_cn_statistical.paiduids[countObjKey])
                not_cn_statistical.paiduids[countObjKey]= 0;
            not_cn_statistical.paiduids[countObjKey]++;
        }           

    });
    if(!baseStatistical.paiduids[countObjKey])
        baseStatistical.paiduids[countObjKey]= 0;
    baseStatistical.paiduids[countObjKey]++;    
}
/////////////////////
SummaryCal.prototype.process = function(log)
{
    var self = this;
    
    if(log.subType != "buygem" && log.logType != "Register" && log.logType != "LogOn")
    {
        return;
    }
    
    var thisOption = {};
    var country = self.handle.getCountryBylog(log);
    if(country)
        thisOption.country = country;
    if(isNaN(log.R2))
        thisOption.region=1;
    else
        thisOption.region = parseInt(log.R2);
    if(log.subType == "buygem")
    {
        self.AddOneByRecursive_PaidMan(log.uid,thisOption,self.data);
        var thePrice = utils.GetProduct_Price("2",log.message);
        self.AddOneByRecursive_Price(thePrice,thisOption,self.data);       
    }
    if(log.logType == "Register")
    {
        self.AddOneByRecursive_Count("DNU",thisOption,self.data);
    }
    if(log.logType == "LogOn"&&self.dau_uid.indexOf(log.uid)==-1)
    {
        self.AddOneByRecursive_Count("DAU",thisOption,self.data);
        self.dau_uid.push(log.uid);
    }
}
SummaryCal.prototype.saveStatistical = function(stats, data, arrStatisticalJSON)
{
    //winston.info("#BaseCal#data:%s",JSON.stringify(data));
    _.each(data, function(parm){
       // winston.info("parm:%s,stats:%s",JSON.stringify(parm),JSON.stringify(stats));
        _.extend(parm, stats);
        arrStatisticalJSON.push(parm);

    });
}
SummaryCal.prototype.save = function(stats){
    var self = this;

    _.each(self.data,function(parm){
        parm.Revenue = parm.priceCount*scale;
        parm.PaidMan = _.keys(parm.paiduids).length;
        
        if(parm.DAU&&parm.DAU!=0)
        {
            parm.ARPU = parm.Revenue/parm.DAU;
            parm.PaidPercentage = parm.PaidMan/parm.DAU;
            parm.EDAU = parm.DAU - parm.DNU;
        }
        if(parm.PaidMan&&parm.PaidMan!=0)
            parm.ARPPU = parm.Revenue/parm.PaidMan;

        parm = _.omit(parm,"priceCount","paiduids");
    });

    winston.debug("summary datas:%s",JSON.stringify(self.data));
    var arrStatisticalJSON = [];
    self.saveStatistical(stats, self.data, arrStatisticalJSON);
    self.data = [];
    
    return arrStatisticalJSON;
}

