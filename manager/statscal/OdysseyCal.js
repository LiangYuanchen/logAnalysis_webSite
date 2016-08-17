var keystone = require("keystone"),
    async = require('async'),
    _ = require('underscore'),
    util = require('util'),
    utils = require("../util/utils");
var winston = require('../util/LogsBackup');
var BaseCal = require("./BaseCal");
var OdysseyCal = function (handle){
    BaseCal.call(this,handle);
    this.logType = logType;
    this.CalType = "OdysseyCal";

}
util.inherits(OdysseyCal,BaseCal);
exports = module.exports = OdysseyCal;

/////////////////////
OdysseyCal.prototype.process = function(log, options)
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

OdysseyCal.prototype.save = function(stats){
    var self = this;
    var arrStatisticalJSON = [];
    self.saveStatistical(stats, self.sType, self.data, arrStatisticalJSON);
    self.saveStatistical(stats, self.sTypeRD, self.dataRD, arrStatisticalJSON);

    self.data = [];
    self.dataRD = [];
    self.uidRD = []; 

    return arrStatisticalJSON;
}

