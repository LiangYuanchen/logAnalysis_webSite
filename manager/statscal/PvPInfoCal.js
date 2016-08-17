var keystone = require("keystone"),
    async = require('async'),
    _ = require('underscore'),
    util = require('util'),
    utils = require("../util/utils"),
    BaseCal = require("./BaseCal");
var winston = require('../util/LogsBackup');


var PvPInfoCal = function (handle) {
    var self = this;
    BaseCal.call(this,handle);
    self.data_avg = [];//等级 平均次数
    self.data2 = [];   //次数 pvp人数 
                      //self.data 表示 等级 次数
    self.temp = [];//每个等级都有哪些uid玩pvp，每个uid都玩了几次
    this.CalType = "PvPInfoCal";
}

util.inherits(PvPInfoCal,BaseCal);
exports = module.exports = PvPInfoCal;

/////////////////////
PvPInfoCal.prototype.AddOneByRecursive_CountObj = function(uid,level,options,arr)
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
        if(!statistical.countObj[level])
            statistical.countObj[level]= {};
        if(!statistical.countObj[level][uid])
            statistical.countObj[level][uid] = 0;
        statistical.countObj[level][uid]++;


        //Not_CN
        if(option.country&&option.country!="CN")
        {
            option.country = "Not_CN";
            var not_cn_statistical = self.findByParm(option, arr);
            if(!not_cn_statistical.countObj)
                not_cn_statistical.countObj = {};
            if(!not_cn_statistical.countObj[level])
                not_cn_statistical.countObj[level]= {};
            if(!not_cn_statistical.countObj[level][uid])
                not_cn_statistical.countObj[level][uid] = 0;
            not_cn_statistical.countObj[level][uid]++;          
        }
    });
    if(!baseStatistical.countObj[level])
        baseStatistical.countObj[level]= {};
    if(!baseStatistical.countObj[level][uid])
        baseStatistical.countObj[level][uid] = 0;
    baseStatistical.countObj[level][uid]++;    
}

PvPInfoCal.prototype.process = function(log, options)
{
    var self = this;
    if(!_.contains(["PvP"],log.logType))
        return;
    if(typeof log.country == "string")
        options.country = log.country;
    if(isNaN(log.R2))
        options.region=1;
    else
        options.region = parseInt(log.R2);
    var level = self.handle.getInnLevelByExp(log.innExp);
    self.AddOneByRecursive_CountObj(log.uid,level,options, self.temp);
}

PvPInfoCal.prototype.save = function(status){
    var self = this;

    //转换出等级 对pvp人数
    //转换出等级 平均每人打几次
    //次数      pvp人数
    _.each(self.temp,function(data){
        var options_level = _.clone(data);
        var options_level_avg = _.clone(data);
        var options_c_p = _.clone(data);
        options_level.countObj = {};
        options_level_avg.countObj = {};
        options_c_p.countObj = {};
        var keysLevel = _.keys(data.countObj);
        
        _.each(keysLevel,function(key){
            var keysUid =_.keys(data.countObj[key]);
            var pvpCount = 0;
            _.each(keysUid,function(keyuid){
                pvpCount+=data.countObj[key][keyuid];
                var pvpTime =data.countObj[key][keyuid];
                if(!options_c_p.countObj[pvpTime])
                    options_c_p.countObj[pvpTime] = 0;
                options_c_p.countObj[pvpTime]++;
            });
            options_level.countObj[key] = pvpCount;
            options_level_avg.countObj[key] = pvpCount/keysUid.length;
        });
        self.data.push(options_level);
        self.data_avg.push(options_level_avg);
        self.data2.push(options_c_p);
    });

    var arrStatisticalJSON = [];
    self.saveStatistical(status,self.handle.sType.level_pvp, self.data, arrStatisticalJSON);
    
    self.saveStatistical(status, self.handle.sType.level_pvp_avg, self.data_avg, arrStatisticalJSON);
    
    self.saveStatistical(status, self.handle.sType.playerCount_pvp, self.data2, arrStatisticalJSON);
    self.data = [];
    self.data_avg = [];
    self.data2 = [];
    self.temp = [];

    return arrStatisticalJSON;
}
