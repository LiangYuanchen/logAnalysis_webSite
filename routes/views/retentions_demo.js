var keystone = require('keystone');
var async    = require('async');
var _        = require("underscore");
var _config  = keystone.get("_config");
var daysLeftManager = require("../../manager/DaysLeftManager");
var winston  = require("winston");
var manager  = require("../../manager/manager");
var m        = new manager();
var util    = require("../../manager/util/utils");
var retentionManager = require("../../manager/RetentionManager");
var retentionCal = require("../../manager/statscal/RetentionCal");
var rm = new retentionManager();
var rc = new retentionCal();
require("../../manager/util/datetime");
var getStrByDate = function(date){
  return new Date(date).format("MM/dd/yyyy hh:mm:ss");
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
        view.on('get', function(next) {

       });

    
       view.render('daysLeft');
};

