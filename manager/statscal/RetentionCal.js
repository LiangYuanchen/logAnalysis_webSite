var keystone = require("keystone"),
    async = require('async'),
    _ = require('underscore'),
    util = require('util'),
    utils = require("../util/utils");
var winston = require('../util/LogsBackup');
var BaseCal = require("./BaseCal");

var RetentionCal = function(handle,firstDate,lastDate,timezone){
    var self = this;
    BaseCal.call(this,handle);
    this.CalType = "RetentionCal";
    if(firstDate)
        self.firstDate = firstDate;
    if(lastDate)
        self.lastDate = lastDate;
    if(!isNaN(timezone))
        self.timezone = timezone;
    self.uid_retention = [];
    self.registerType1 = [];

    self.sessionCount = [];
    self.arrcount = [];
}
util.inherits(RetentionCal,BaseCal);

/////////////////////
RetentionCal.prototype.process = function(log, options)
{
    var self = this;
    if(self.firstDate&&log.timeStamp<self.firstDate)
        return;
    if(self.lastDate&&log.timeStamp>=self.lastDate)
        return;


    if(log.logType != "Register" && log.logType != "LogOn")
        return;    


    if(!isNaN(self.timezone))
    {
        var user = _.find(self.handle.gameusers,function(user){ return user.uid == log.uid});
        var theTZ = 0;
         if(!user||!user.country||user.country.length==0)
            theTZ = 0;
         else
            theTZ = utils.GetTimeZoneByCountry(user.country);

        if(isNaN(theTZ))
        {
            theTZ = 0;//获取不到该时区，则设为0时区
        }
        options.timezone = theTZ;       
    }

    var country = self.handle.getCountryBylog(log);
    if(country)
        options.country = country;
    if(isNaN(log.R2))
        options.region=1;
    else
        options.region = parseInt(log.R2);
    if(log.logType == "Register")
    { 
        self.AddOneByRecursive_CountObj(log.uid,options,self.data);
        self.uid_retention.push(log.uid);
        //winston.info("data:%s",JSON.stringify(self.data));
    }
    //判断countObj的uid的value大于1则表示他是
    if(log.logType == "LogOn")
    {
        if(_.contains(self.uid_retention,log.uid))
        {
            self.AddOneByRecursive_CountObj(log.uid,options,self.registerType1);
        }
        self.AddOneByRecursive_CountObj(log.uid,options,self.arrcount);
    }
    self.AddOneByRecursive_CountObj(log.uid,options,self.sessionCount);
    //winston.info("data:%s",JSON.stringify(self.data));
}
RetentionCal.prototype.save = function(stats){
    var self = this;

    var arrStatisticalJSON = [];
    _.each(self.data,function(parm){
        arrStatisticalJSON.push(self.initDayleft(parm,"0"));
    });
    //winston.debug("retentsion datas.length:%s",JSON.stringify(self.data));
    
    _.each(self.registerType1,function(parm){
        arrStatisticalJSON.push(self.initDayleft(parm,"1"));
    });
    //其余数据在之后的getRetention中还有用，不能清空
    self.data = [];
    self.registerType1 = [];
    
    return arrStatisticalJSON;
}
RetentionCal.prototype.getRetention = function(next)
{
    var self = this;
    var sql = {logDate:{$gte:(self.handle.basefirstDate - 30*86400),$lt:self.handle.baselastDate}};
    if(!isNaN(self.timezone))
    {
        sql.timezone = self.timezone;
    }
    else
        sql.timezone = {$exists:false};
    keystone.list("DaysLeft").model.find(sql).exec(function(err,results){
        if(err)
        {
            winston.error("#RetentionCal# error1");
            utils.showErr(err);    
        }
        
        
        if(!results||results.length==0)
        {
            next();
            return;
        }
        
        self.calculate_retention(results,next);
    });
}
RetentionCal.prototype.calculate_retention = function(dayslefts,next)
{
    var self = this;
    var i = 0;
    async.whilst(
        function(){ return i<dayslefts.length },
        function(callback){
            var daysleft = dayslefts[i];
            if(daysleft.uids.length == 0)
            {
                i++;
                callback();
                return;
            }
            if(((self.handle.basefirstDate - daysleft.logDate)%86400)>0)
            {
                i++;
                winston.error("#models#Daysleft#udateRetentionInfo the index is not Int,may be not UTC timezone,dateInfo.firstDate:%d,daysleft.logDate:%d",self.handle.firstDate,daysleft.logDate);
                callback();
                return;
            }
            var index = parseInt((self.handle.basefirstDate - daysleft.logDate)/86400);
            var option ={};
            if(daysleft.country)
            {
                option.country = daysleft.country;
            }
            if(daysleft.region)
            {
                option.region = daysleft.region;
            }
            if(daysleft.onlypaid)
            {
                option.onlypaid = daysleft.onlypaid;
            }

            var this_arrcount = self.findByParm(option,self.arrcount);


            if(!this_arrcount.countObj)
            {
                i++;
                winston.error("#models#Daysleft#updateRetentionInfo can not get arrcount from arrcount,the option:%s,firstDate:%s",JSON.stringify(option),self.handle.firstDate);
                callback();
                return;
            }
            var this_sessioncount = self.findByParm(option,self.sessionCount);
            if(!this_sessioncount.countObj)
            {
                i++;
                winston.error("#models#Daysleft#updateRetentionInfo can not get sessioncount ,the option:%s,firstDate:%s",JSON.stringify(option),self.handle.firstDate);
                callback();
                return;
            }
            var keys_this_arrcount = _.keys(this_arrcount.countObj);
            var count = (_.intersection(daysleft.uids,keys_this_arrcount)).length;

            var count_this_sessioncount = 0;
            var keys_this_sessioncount = _.keys(this_sessioncount.countObj);
            for(var j = 0;j<keys_this_sessioncount.length;j++)
            {
                count_this_sessioncount+=this_sessioncount.countObj[keys_this_sessioncount[j]];
            }
            var befor = [];
            _.each(daysleft.retentions,function(retention){
                befor.push(retention);
            });
            //拼装开始
            if(!daysleft.country&&!daysleft.region&&!daysleft.onlypaid&&daysleft.logDate==1460937600)
            {
                debugger;
            }
            self.bindRetention(daysleft.retentions,index,count);
            
            self.bindRetention(daysleft.sessionCount,index,count);

            // if(!daysleft.country&&!daysleft.region&&!daysleft.onlypaid)
            // {
            //     winston.info("#retentionCal#index:%s,count:%s,daysleft.logDate:%s,handle.basefirstDate:%s,retentions:%s,befor:%s",index,count,daysleft.logDate,self.handle.basefirstDate,JSON.stringify(daysleft.retentions),JSON.stringify(befor)); 
            // }
            daysleft.daysLeft = JSON.stringify(self.bindRetention_DaysLeft(daysleft));
            daysleft.sessions = JSON.stringify(self.bindRetention_Session(daysleft));
            daysleft.markModified("retentions");
            daysleft.markModified("sessionCount");
            daysleft.save(function(err,a,b){
                if(err)
                {
                    winston.error("#RetentionCal# error 2");
                    utils.showErr(err);
                }
                if(err)
                    winston.info("#retentionCal#calculate_retention#saved error ");
                // if(!daysleft.country&&!daysleft.region&&!daysleft.onlypaid&&daysleft.logDate==1457913600&&daysleft.newuserCount==41)
                // {
                //     debugger;
                // }
                i++;
                callback();
            });              
        },
        function(err){
            self.uid_retention = [];
            self.sessionCount = [];
            self.arrcount = [];            
            next();
        }
    );
}
RetentionCal.prototype.bindRetention = function(data,index,count)
{
    var self = this;
    if(data.length==index)
        data.push(count);
    else if(data.length>index)
    {
        data[index] = count;
    }
    else if(data.length<index)
    {
        var length = index - data.length;
        for(var j=0;j<length;j++)
        {
            data.push(0);
        }
        data.push(count);
    }
    return data;
}
RetentionCal.prototype.bindRetention_DaysLeft = function(daysleft)
{
    var self = this;
    var arrRetention = [];
    if(daysleft.newuserCount!=0)
    {
        _.each(daysleft.retentions,function(retention,index){
            var date = daysleft.logDate+index*86400;
            var count = retention;
            var result = {dayleft:0,date:0};
            result.dayleft = count/daysleft.newuserCount*100;
            result.date = date;
            arrRetention.push(result);
        });
    }
    return arrRetention;
}
RetentionCal.prototype.bindRetention_Session = function(daysleft)
{
    var self = this;
    var arrSession = [];
    _.each(daysleft.sessionCount,function(count,index){
        var date = daysleft.logDate + index*86400;
        var count = count;
        var result = {count:0,date:0};
        result.count = count;
        result.date = date;
        arrSession.push(result);
    });
    return arrSession;
}
RetentionCal.prototype.initDayleft = function(parm,registerType)
{
    var self = this;
    var keys = _.keys(parm.countObj);
    var dayleft = {};
    dayleft.logDate = self.handle.basefirstDate;
    dayleft.firstDate = self.firstDate;
    dayleft.lastDate = self.lastDate;
    dayleft.newuserCount=keys.length;
    dayleft.sort = dayleft.category = 0;
    dayleft.registerType = registerType;
    dayleft.tType = 1;
    dayleft.daysLeft = [];
    if(parm.country)
        dayleft.country = parm.country;
    if(parm.onlypaid)
        dayleft.onlypaid = true;
    if(parm.region)
        dayleft.region = parseInt(parm.region);
    if(parm.timezone||parm.timezone==0)
        dayleft.timezone = parseInt(parm.timezone);
    dayleft.uids = keys;
    dayleft.retentions = [];
    dayleft.daysLeft = [];
    dayleft.sessionCount = [];
    return dayleft;
}

exports = module.exports = RetentionCal;
