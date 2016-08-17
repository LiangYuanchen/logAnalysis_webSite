var keystone = require("keystone"),
    async = require('async'),
    _ = require('underscore'),
    util = require('util'),
    utils = require("../util/utils");
var winston = require('../util/LogsBackup');
var BaseCal = require("./BaseCal");
var StatsCal = function (handle,sType,sTypeRD,logType) {
    BaseCal.call(this,handle);
    this.logType = logType;
    this.sType = sType;
    this.sTypeRD = sTypeRD;
    this.CalType = "StatsCal";
    this.dataRD = [];
    this.uidRD = [];
}
util.inherits(StatsCal,BaseCal);
exports = module.exports = StatsCal;

/////////////////////
StatsCal.prototype.process = function(log, statsCaloptions)
{
    var self = this;
    //winston.info("StatsCal");
    if(log.logType != self.logType)
        return;

    if(typeof log.country == "string")
        options.country = log.country;
    if(isNaN(log.R2))
        options.region=1;
    else
        options.region = parseInt(log.R2);

    if(!_.contains(self.uidRD, log.uid))
    {
        self.uidRD.push(log.uid);
        self.AddOneByRecursive_Count(options, self.dataRD);
    }
    self.AddOneByRecursive_Count(options, self.data);
}

StatsCal.prototype.save = function(stats){
    var self = this;
    var arrStatisticalJSON = [];
    self.saveStatistical(stats, self.sType, self.data, arrStatisticalJSON);
    self.saveStatistical(stats, self.sTypeRD, self.dataRD, arrStatisticalJSON);

    self.data = [];
    self.dataRD = [];
    self.uidRD = []; 

    return arrStatisticalJSON;
}

