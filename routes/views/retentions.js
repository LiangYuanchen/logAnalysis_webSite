var keystone = require('keystone');
var async    = require('async');
var _        = require("underscore");
var _config  = keystone.get("_config");
var daysLeftManager = require("../../manager/DaysLeftManager");
var winston  = require("winston");
var manager  = require("../../manager/manager");
var m        = new manager();
var utils    = require("../../manager/util/utils");
var retentionManager = require("../../manager/RetentionManager");
var retentionCal = require("../../manager/statscal/RetentionCal");
var rm = new retentionManager();
var rc = new retentionCal();
require("../../manager/util/datetime");
var getStrByDate = function(date){
  return new Date(date).format("MM/dd/yyyy");
}
exports = module.exports = function(req, res) {
       var view = new keystone.View(req, res),
       locals = res.locals;
       locals.title=_config.title;
       // locals.section is used to set the currently selected
       var pageCount = 30;
       // item in the header navigation.
       locals.section = 'daysLeft';
       locals.DataDaysLeft = [];
       locals.DataTop10 = [];
       locals.timezone = _config.timezone||0;
       locals.formatData = req.body || {};
        locals.filters = {
          date:req.query.date || getStrByDate(new Date(Date.now()-86400000*(pageCount-1))),
          country:req.query.country || "",
          registertype:(req.query.registertype)?req.query.registertype+"":"0",
          onlypaid:req.query.onlypaid || false,
          formatstatus:req.query.formatstatus || "0",
          region:req.query.region || "0",
          timezone:req.query.timezone || []
        };
        if(locals.filters.timezone&&locals.filters.timezone.length>0)
          locals.filters.timezone = locals.filters.timezone.split(",");
        locals.onSummaryRetention=keystone.get("onSummaryRetention");
        var permission = require("../../manager/permission");
        // Set locals
        var per = new permission();
        locals.hasPermission = false;
        if(req.user&&req.user.code)
          locals.hasPermission = per.HasPermisson("summary",req.user.code);
       // online
       var getDaysRetention = function(data,tableDate,option){
          var date = locals.filters.date;
          var result = {};
          result.newuserCount = 0;
          result.logDate = tableDate;
          
          result.retentions = [];
          _.each(data,function(parm){
            
            result.newuserCount++;

            for(var i=0;i<31;i++)
            {

              if(parm["day"+i])
              {
                var index = i;
                if(result.retentions.length<index)
                {
                    var length = index - result.retentions.length;
                    for(var j=0;j<length;j++)
                    {
                        result.retentions.push(0);
                    }
                    result.retentions.push(1);
                }
                else if(result.retentions.length==index)
                {
                  result.retentions.push(1);
                }
                else
                {
                  result.retentions[index] = result.retentions[index] + 1;
                }
              }
            }
          });
          result.daysLeft = JSON.stringify( rc.bindRetention_DaysLeft(result));
          return result;
       }
       view.on('get', function(next) {
          var arrpageCount = [];
          
          var date = utils.getDateByString( locals.filters.date);
          var DataTop10 = [];

          for(var i = 0;i<pageCount;i++)
          {
            arrpageCount.push((new Date(m.showDailyBegin(date)*1000 + i*86400*1000))/1000);
          }
          var timezoneStr = locals.filters.timezone;
          var region = locals.filters.region;
          var sql = {};
          if(!isNaN(region)&&region!="0")
          {
            sql.region =parseInt( region);
          }
          utils.getBsonOfCountry(locals.filters.country,sql);
          if(!isNaN(timezoneStr))
          {
            timezoneStr = parseInt(timezoneStr);
            if(Math.abs(timezoneStr)==12)
            {
              timezoneStr = "W12";
            }
            else if(timezoneStr>0)
            {
              timezoneStr = "E"+Math.abs(timezoneStr);
            }
            else if(timezoneStr<0)
            {
              timezoneStr = "W"+Math.abs(timezoneStr);
            }
            else
            {
              timezoneStr = "0";
            }
          }
          else
          {
            timezoneStr = "0";
          }
          rm.selectRetention(arrpageCount,timezoneStr,sql,function(err,datas){
            debugger;
            _.each(datas,function(data,index){
               DataTop10.push(getDaysRetention(data,arrpageCount[index],locals.filters));
            });
            locals.DataTop10 = DataTop10;
            locals.DataDaysLeft = eval("("+ DataTop10[0].daysLeft+")");
            next();
          });
       });

    
       view.render('daysLeft');
};

