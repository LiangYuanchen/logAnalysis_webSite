var keystone = require('keystone');
var _config = require('../../configuration');
var async    = require('async');
var gameconfig = require("../../manager/GameConfigExchange");
var winston = require("winston");
exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
   locals.filters = {
   		uid:req.query.uid || ""
   };		
	locals.title=_config.title;
	var permission = require("../../manager/permission");
	// Set locals
	var per = new permission();
	locals.hasPermission = false;
	if(req.user&&req.user.code)
		locals.hasPermission = per.HasPermisson("user",req.user.code);
	locals.section = 'gmtoolIndex';
	locals.formData = req.body || {};
	locals.timezone = _config.timezone||0;
	locals.islive = _config.isLive?true:false;
	if(req.query.islive)
		locals.islive = req.query.islive?true:false;
	var gc = new gameconfig();
	gc.getExchange("tutorials","typeId","roomType",function(results){
		//winston.debug("the tutorials:%s",JSON.stringify(results));
		if(locals.filters.uid&&locals.filters.uid.length>0)
		{
			keystone.list("SiteLog").model.find({postType:"/tavernedit",message:eval("/"+locals.filters.uid+"/")}).count(function(err,count){
			locals.tutorialids = _.keys(results);
			locals.taverneditCount = count;
			locals.tutorialnames = _.values(results);
			view.render('gmtool/index');		
			});		
		}
		else
		{
			
		}


	});
};
