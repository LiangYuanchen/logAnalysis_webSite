var keystone = require("keystone"),
    async = require('async'),
    _ = require('underscore'),
    util = require('util'),
    utils = require("../util/utils");
var winston = require('../util/LogsBackup');

var BaseCal = function (handle) {
    this.handle = handle;
    this.data = [];
    this.CalType = "";
}

exports = module.exports = BaseCal;

BaseCal.prototype.hr_begin = function(){
    this.hr_cal_begin = process.hrtime();
}
BaseCal.prototype.hr_end = function(){
    return process.hrtime(this.hr_cal_begin);

};

BaseCal.prototype.findByParm = function(option,arr){
    var self = this;

    var keys = _.keys(option);

    var arrParm = _.where(arr,option);
    
    if(arrParm.length==0)
    {
        var parm = _.clone(option);
        arr.push(parm);
        //winston.info("#BaseCal#parm:%s,option:%s",JSON.stringify(parm),JSON.stringify(option));
        return parm;
    }
    else{
        for(var i=0;i<arrParm.length;i++)
        {
            var parmLength =  _.keys(arrParm[i]).length;
            //判断parm去掉count和countObj的长度，一致则说明相同
            if(arrParm[i].count)
                parmLength--;
            if(arrParm[i].countObj)
                parmLength--;
            
            if(parmLength==_.keys(option).length)
                return arrParm[i];
        }
        var parm = _.clone(option);
        arr.push(parm);
        //winston.info("#BaseCal#parm2:%s,option:%s",JSON.stringify(parm),JSON.stringify(option));
        return parm;        
    }
}
BaseCal.prototype.AddOneByRecursive_uniq = function(uid,countObjKey,options, arr)
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
       // winston.info("data:%s",JSON.stringify(statistical));
        if(!statistical.countObj)
            statistical.countObj = {};
        if(!statistical.countObj[countObjKey])
            statistical.countObj[countObjKey]= {};
        if(!statistical.countObj[countObjKey][uid])
            statistical.countObj[countObjKey][uid] = 0;
        statistical.countObj[countObjKey][uid]++;

        //Not_CN
        if(option.country&&option.country!="CN")
        {
            option.country = "Not_CN";
            var not_cn_statistical = self.findByParm(option, arr);
            if(!not_cn_statistical.countObj)
                not_cn_statistical.countObj = {};
            if(!statistical.countObj[countObjKey])
                statistical.countObj[countObjKey]= {};
            if(!statistical.countObj[countObjKey][uid])
                statistical.countObj[countObjKey][uid] = 0;
            statistical.countObj[countObjKey][uid]++;
        }
    });
    if(!baseStatistical.countObj[countObjKey])
        baseStatistical.countObj[countObjKey]= {};
    if(!baseStatistical.countObj[countObjKey][uid])
        baseStatistical.countObj[countObjKey][uid] = 0;
    baseStatistical.countObj[countObjKey][uid]++;
}
BaseCal.prototype.AddOneByRecursive_Count = function(options, arr)
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
        statistical.count++;


        //Not_CN
        if(option.country&&option.country!="CN")
        {
            option.country = "Not_CN";
            var not_cn_statistical = self.findByParm(option, arr);
            if(!not_cn_statistical.count)
                not_cn_statistical.count = 0;
            not_cn_statistical.count++;            
        } 
    });
    baseStatistical.count++;
}
BaseCal.prototype.AddOneByRecursive_CountObj = function(countObjKey,options, arr)
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
       // winston.info("data:%s",JSON.stringify(statistical));
        if(!statistical.countObj)
            statistical.countObj = {};
        if(!statistical.countObj[countObjKey])
            statistical.countObj[countObjKey]= 0;
        statistical.countObj[countObjKey]++;


        //Not_CN
        if(option.country&&option.country!="CN")
        {
            option.country = "Not_CN";
            var not_cn_statistical = self.findByParm(option, arr);
            if(!not_cn_statistical.countObj)
                not_cn_statistical.countObj = {};
            if(!not_cn_statistical.countObj[countObjKey])
                not_cn_statistical.countObj[countObjKey]= 0;
            not_cn_statistical.countObj[countObjKey]++;           
        }
    });
    if(!baseStatistical.countObj[countObjKey])
        baseStatistical.countObj[countObjKey]= 0;
    baseStatistical.countObj[countObjKey]++;

}
BaseCal.prototype.saveStatistical = function(stats,sType, data, arrStatisticalJSON)
{
    //winston.info("#BaseCal#data:%s",JSON.stringify(data));
    _.each(data, function(parm){
       // winston.info("parm:%s,stats:%s",JSON.stringify(parm),JSON.stringify(stats));
        _.extend(parm, stats);
        parm.sType = sType;

        if(parm.countObj)
            parm.countObj = JSON.stringify(parm.countObj);
        
        arrStatisticalJSON.push(parm);

    });
   // winston.info("sType:%s,arrStatisticalJSON:%s",sType,JSON.stringify(arrStatisticalJSON));
}


