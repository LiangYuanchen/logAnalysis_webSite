
var keystone = require('keystone');
var _config = keystone.get("_config");
var manager = require("../../manager/manager");
var gameConfigExchange = require("../../manager/GameConfigExchange");
var _ = require('underscore');
var getStrByDate = function(date){
  return new Date(date*1000).format("MM/dd/yyyy hh:mm:ss");
}

exports = module.exports = function(req, res) {
  var view = new keystone.View(req, res),
    locals = res.locals;
    locals.title=_config.title;
    locals.timezone = _config.timezone||0;
   var mager = new manager();
   var dateObj = {};
   mager.getFirstAndLastDate(dateObj,"daily",Date.now()/1000-86400);

   locals.filters = {
          op:req.query.op || getStrByDate(dateObj.firstDate),
          ed:req.query.ed || getStrByDate(dateObj.lastDate),
          country:req.query.country || "",
          onlypaid:req.query.onlypaid || false,
          region:req.query.region || "0"
   };

  var permission = require("../../manager/permission");
  // Set locals
  var per = new permission();
  locals.hasPermission = false;
  if(req.user&&req.user.code)
    locals.hasPermission = per.HasPermisson("summary",req.user.code);
   locals.section = 'sweepticket';
   locals.lastDate = 0;
   var gc = new gameConfigExchange();

   // locals.userStepsTrackKey = JSON.stringify(_config.userStepsTrackKey);
   // locals.userStepsTrackValue = JSON.stringify(_config.userStepsTrackValue);
   var sweepticketGet = {name:"sweepticketGet",text:"扫荡券获取分布",sType:"178"};
   var sweepticketCost = {name:"sweepticketCost",text:"扫荡券消耗分布",sType:"179"};
   var sweepTicket = _config.phaseStatistical.sweepTicketConfig;
   locals.configs = [sweepTicket];
   locals.categories = [sweepticketGet,sweepticketCost];
    gc.getExchange("quests","typeId","title",function(results){
      locals.userKeys= JSON.stringify(_.keys(results));
      var values = _.values(results);
      for(var i=0;i<values.length;i++)
      {
        values[i]=values[i].replace("_TITLE","");
      }
       locals.userValues = JSON.stringify(values);
       console.log(locals.userValues);
       view.render('sweepticket');
    });
 
};
