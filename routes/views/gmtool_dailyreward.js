var keystone = require('keystone')
var _config  = keystone.get("_config");
exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	locals.title=_config.title;
	var permission = require("../../manager/permission");
	// Set locals
	var per = new permission();
	locals.hasPermission = false;
	if(req.user&&req.user.code)
		locals.hasPermission = per.HasPermisson("dailyreward",req.user.code);	
	// Set locals
	console.log("hasPermission:%s",locals.hasPermission);
	locals.section = 'gmtooldailyreward';
	locals.timezone = _config.timezone||0;
	locals.formData = req.body || {};


	

	
	view.render('gmtool/dailyreward');
	
};