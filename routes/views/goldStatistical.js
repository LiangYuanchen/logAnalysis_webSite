
var keystone = require('keystone');
var _config = keystone.get("_config");
var manager = require("../../manager/manager");
var getStrByDate = function(date){
  return new Date(date*1000).format("MM/dd/yyyy hh:mm:ss");
}
exports = module.exports = function(req, res) {
  var view = new keystone.View(req, res),
    locals = res.locals;
    locals.title=_config.title;
   var mager = new manager();
   var dateObj = {};
   mager.getFirstAndLastDate(dateObj,"daily",Date.now()/1000-86400);

   locals.filters = {
          op:req.query.op || getStrByDate(dateObj.firstDate),
          ed:req.query.ed || getStrByDate(dateObj.lastDate),
          gtype:req.query.gtype || "0",
          country:req.query.country || "",
          onlypaid:req.query.onlypaid || false,
          region:req.query.region || "0"
   };

  var permission = require("../../manager/permission");
  // Set locals
  var per = new permission();
  locals.hasPermission = false;
  locals.timezone = _config.timezone||0;
  if(req.user&&req.user.code)
    locals.hasPermission = per.HasPermisson("summary",req.user.code);
   locals.section = 'goldStatistical';
   locals.lastDate = 0;
   var goldGet = {name:"goldGet",text:"金币获取分布",sType:"174"};

   //var gembuysubcontent = {name:"gemBuySubContent",text:"宝石收支",sType:"150"};
   var goldCost ={name:'goldCost',text:"金币消耗分布",sType:"175"};

   var goldGetPaidMan = {name:"goldGetPaidMan",text:"付费金币获取分布",sType:"187"};
   var goldCostPaidMan = {name:'goldCostPaidMan',text:"付费金币消耗分布",sType:"188"};
   var goldAllPaidMan = _config.phaseStatistical.goldAllPaidMan;
   var goldAll = _config.phaseStatistical.goldAll;
   // if(!locals.filters.gtype||locals.filters.gtype=="0")
   // {
      locals.configs = [goldAll];
      locals.categories = [goldGet,goldCost];
   // }
   // else
   // {
   //    locals.configs = [goldAllPaidMan];
   //    locals.categories = [goldGetPaidMan,goldCostPaidMan];
   // }

  view.render('goldStatistical');
};
