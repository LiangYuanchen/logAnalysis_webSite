var keystone = require('keystone');
var permission = require("../../manager/permission");
var _config  = keystone.get("_config");
exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	locals.title=_config.title;
	// Set locals
	var per = new permission();
	locals.hasPermission = false;
	if(req.user&&req.user.code)
		locals.hasPermission = per.HasPermisson("store",req.user.code);
	locals.section = 'gmtoolStore';
	locals.timezone = _config.timezone||0;
	locals.formData = req.body || {};


	

	
	view.render('gmtool/store');
	
};
