var keystone = require('keystone');
var async    = require('async');
var _        = require("underscore");
var _config = keystone.get("_config");
require("../../manager/util/datetime");
var getStrByDate = function(date){
  return new Date(date).format("MM/dd/yyyy hh:mm:ss");
}
exports = module.exports = function(req, res) {
	var view = new keystone.View(req, res),
		locals = res.locals;
	locals.title=_config.title;
    locals.ttype=req.query["ttype"];
    locals.timezone = _config.timezone||0;
	// locals.section is used to set the currently selected
	// item in the header navigation.
	locals.section = 'phaseStatistical';
	var permission = require("../../manager/permission");
	var pageCount = 31;
   // Set locals
    locals.filters = {
      op:req.query.date || getStrByDate(new Date(Date.now()-86400000*(pageCount-1))),
      ed:req.query.date || getStrByDate(new Date(Date.now())),
      country:req.query.country || ""
    };
   var per = new permission();
   locals.hasPermission = false;
   if(req.user&&req.user.code)
      locals.hasPermission = per.HasPermisson("summary",req.user.code);
	var countConfig = _config.phaseStatistical.countConfig;
	var logConfig = _config.phaseStatistical.logConfig;
	var pvpConfig = _config.phaseStatistical.pvpConfig;
	var advConfig = _config.phaseStatistical.advConfig;
	var familiarConfig =_config.phaseStatistical.familiarConfig;
	var payConfig = _config.phaseStatistical.payConfig;
	var otherConfig = _config.phaseStatistical.otherConfig;
	var dishConfig = _config.phaseStatistical.dishConfig;
	var questConfig = _config.phaseStatistical.questConfig;
	var roomConfig = _config.phaseStatistical.roomConfig;
	var smithConfig = _config.phaseStatistical.smithConfig;
	var storageConfig = _config.phaseStatistical.storageConfig;
	var tavernConfig = _config.phaseStatistical.tavernConfig;
	var itemConfig = _config.phaseStatistical.itemConfig;	
	var storeConfig = _config.phaseStatistical.storeConfig;
	var mailConfig = _config.phaseStatistical.mailConfig;
	var paidboughtConfig = _config.phaseStatistical.paidboughtConfig;
	locals.configs = [countConfig,payConfig,paidboughtConfig,logConfig,pvpConfig,advConfig,familiarConfig,dishConfig,questConfig,roomConfig,smithConfig,storageConfig,tavernConfig,itemConfig,otherConfig,storeConfig,mailConfig];	


	view.render('phaseStatistical');
	
};
