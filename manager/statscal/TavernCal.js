var keystone = require("keystone"),
    async = require('async'),
    _ = require('underscore'),
    util = require('util'),
    utils = require("../util/utils");
var winston = require('../util/LogsBackup');

var BaseCal = require("./BaseCal");
var TavernCal = function (handle) {

    BaseCal.call(this,handle);

    this.CalType = "TavernCal";
}
util.inherits(TavernCal,BaseCal);
exports = module.exports = TavernCal;
TavernCal.prototype.getLevel = function(innExp)
{
  var self = this;
  var map_maxExps = _.values(self.handle.innLevelMaxExps);
  var map_level = _.keys(self.handle.innLevelMaxExps);
  if(map_maxExps[0]>=innExp)
    return map_level[0];
  for(var i=1;i<map_maxExps.length;i++)
  {
    if(innExp<=map_maxExps[i])
    {
      return map_level[i];
    }
  }
}
/////////////////////
TavernCal.prototype.process = function(log, options)
{
  return;
}

TavernCal.prototype.save = function(stats){
    var self = this;
    var arrStatisticalJSON = [];

    _.each(self.handle.gameusers,function(user){
      var options = {};
      if(user.country)
        options.country = user.country;
      if(user.region)
        options.region = user.region;
      if(_.contains(self.handle.paiduids, user.uid))
        options.onlypaid=true;
      self.AddOneByRecursive_CountObj(self.getLevel(user.innExp),options,self.data);
    });
    self.saveStatistical(stats, self.handle.sType.tavernlevel, self.data, arrStatisticalJSON);
    console.log(JSON.stringify(arrStatisticalJSON));

    self.data = [];

    return arrStatisticalJSON;
}
