var keystone = require("keystone"),
    async = require('async'),
    _ = require('underscore'),
    util = require('util'),
    utils = require("../util/utils"),
    BaseCal = require("./BaseCal");
var winston = require('../util/LogsBackup');

var CountryCal = function (handle,sType) {
    BaseCal.call(this,handle);
    this.sType = sType;
    this.CalType = "CountryCal";
}

util.inherits(CountryCal,BaseCal);
exports = module.exports = CountryCal;

/////////////////////
CountryCal.prototype.process = function(log, options)
{
    var self = this;
    //winston.info("CountryCal");
    if(typeof log.country != "string")
        return;
    if(isNaN(log.R2))
        options.region=1;
    else
        options.region = parseInt(log.R2);
    self.AddOneByRecursive_uniq(log.uid,log.country,options, self.data);
}

CountryCal.prototype.save = function(stats){
    var self = this;
    var arrStatisticalJSON = [];
    var thisData = [];
    var thisData_RD = [];
    _.each(self.data,function(parm){
        var thekey = _.keys(parm.countObj);
        var theObj = _.clone(parm);
        theObj.countObj = {};
        _.each(thekey,function(key){
            var count = 0;
            var thekey_uid = _.keys(parm.countObj[key]);
            _.each(thekey_uid,function(key2){
                count += parm.countObj[key][key2];
            });
            theObj.countObj[key] = count;
        });
        thisData.push(theObj);
    });
    _.each(self.data,function(parm2){
        var thekey = _.keys(parm2.countObj);
        var theObj = _.clone(parm2);
        theObj.countObj = {};
        _.each(thekey,function(key){
            var thekey_uid = _.keys(parm2.countObj[key]);
            theObj.countObj[key] = thekey_uid.length;
        });
        thisData_RD.push(theObj);
    });
    self.saveStatistical(stats, self.sType, thisData, arrStatisticalJSON);
    self.saveStatistical(stats, self.handle.sType.country_RD, thisData_RD, arrStatisticalJSON);
    self.data = [];

    return arrStatisticalJSON;
}
