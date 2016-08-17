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
  console.log("#page#gemStatistlcal:filters:%s",JSON.stringify(locals.filters));
  var permission = require("../../manager/permission");
  // Set locals
  var per = new permission();
  locals.hasPermission = false;
  locals.timezone = _config.timezone||0;
  if(req.user&&req.user.code)
    locals.hasPermission = per.HasPermisson("summary",req.user.code);
   locals.section = 'gemStatistical';
   locals.lastDate = 0;
   var paycontent = {name:"payContent",text:"付费内容分布",sType:"132"};
   var gemgetcontent ={name:'gemGetContent',text:"宝石获取分布",sType:"171"};
   var gemBuyGemOther = _config.phaseStatistical.gemBuyGemOther;
   var gemGetGembuy = _config.phaseStatistical.gemGetGembuy;
   var gemBuyGemOtherPaidMan = _config.phaseStatistical.gemBuyGemOtherPaidMan;
   var gemGetGembuyPaidMan = _config.phaseStatistical.gemGetGembuyPaidMan;
   var payContentPaidMan = {name:"payContentPaidMan",text:"付费用户内容分布",sType:"184"};
   var gemgetcontentPaidMan = {name:'gemGetContentPaidMan',text:"付费用户宝石获取分布",sType:"183"};
   // if(!locals.filters.gtype||locals.filters.gtype=="0")
   // {
     locals.configs = [gemBuyGemOther,gemGetGembuy];
     locals.categories = [paycontent,gemgetcontent];    
   // }
   // else
   // {
   //   locals.configs = [gemBuyGemOtherPaidMan,gemGetGembuyPaidMan];
   //   locals.categories = [payContentPaidMan,gemgetcontentPaidMan];
   // }

  view.render('gemStatistical');
};
