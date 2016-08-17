var keystone = require('keystone');
var async    = require('async');
var _        = require("underscore");
var manager = require("../../manager/manager");
var _config  = keystone.get("_config");
var winston = require("winston");
var util     = require("../../manager/util/utils");
require("../../manager/util/datetime");
var getDateByString = function(str)
{
  return  new Date(str)/1000;
}
var getStrByDate = function(date){
  return new Date(date*1000).format("MM/dd/yyyy hh:mm:ss");
}
var changeTwoDecimal = function (floatvar)
{
var f_x = parseFloat(floatvar);
if (isNaN(f_x))
{
return 0;
}
var f_x = Math.round(floatvar*100)/100;
return f_x;
}
exports = module.exports = function(req, res) {
       var view = new keystone.View(req, res),
       locals = res.locals;
       locals.title=_config.title;
       // locals.section is used to set the currently selected
       // item in the header navigation.
       var mager = new manager();
       var dateObj = {};
       var unlossuids=[];
       mager.getFirstAndLastDate(dateObj,"daily",Date.now()/1000);
       //console.log("dateObj:%s",JSON.stringify(dateObj));
       locals.section = 'userStepsTrack';
       locals.datas = {};
       locals.list = [];
       locals.userCount = 0;
       locals.logonCount = 0;
       locals.paidCount = 0;
       locals.timezone = _config.timezone||0;
       locals.tutorialnames=_config.userStepsTrackValue;
       locals.formatData = req.body || {};
       locals.filters = {
          firstDate:req.query.firstDate || getStrByDate(dateObj.firstDate),
          lastDate:req.query.lastDate || getStrByDate(dateObj.lastDate),
          country:req.query.country || "",
          onlypaid:req.query.onlypaid || false,
          region:req.query.region || "0",
          rate:req.query.rate || "levelrate"
        };
  
       view.render('rate');   
};

