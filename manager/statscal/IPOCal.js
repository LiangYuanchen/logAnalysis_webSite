var keystone = require("keystone"),
    async = require('async'),
    _ = require('underscore'),
    util = require('util'),
    utils = require("../util/utils");
var winston = require('../util/LogsBackup');
var BaseCal = require("./BaseCal");
var register = require("../databases/mysql/register");
var login    = require("../databases/mysql/login");
var money    = require("../databases/mysql/money");
var IPOCal = function (handle) {
    BaseCal.call(this,handle);
    this.CalType = "StatsCal";
}
util.inherits(IPOCal,BaseCal);
exports = module.exports = IPOCal;

/////////////////////
IPOCal.prototype.process = function(log, options)
{
    var self = this;
    //winston.info("StatsCal");
    if((log.code&2)!=2&&(log.code&4)!=4&&(log.code&1)!=1&&log.logType!="RegisterLog"&&log.logType!="LogInLog")
        return;

    var arrStr = log.message.split(",");
    if(log.logType == "RegisterLog")
    {
        var reg = new register(arrStr[0],log.gameid,arrStr[1],arrStr[2],log.uid,arrStr[3],log.logDate,arrStr[4],arrStr[5],arrStr[6],arrStr[7],arrStr[8],arrStr[9]);
        reg.save(function(){
            
        });
    }
}

IPOCal.prototype.save = function(stats){
    var self = this;
    var arrStatisticalJSON = [];
    self.saveStatistical(stats, self.sType, self.data, arrStatisticalJSON);
    self.saveStatistical(stats, self.sTypeRD, self.dataRD, arrStatisticalJSON);

    self.data = [];
    self.dataRD = [];
    self.uidRD = []; 

    return arrStatisticalJSON;
}

