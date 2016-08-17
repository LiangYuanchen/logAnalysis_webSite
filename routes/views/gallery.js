var keystone = require('keystone');
var _config  = keystone.get("_config");
exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	// Set locals
	locals.section = 'gallery';
	var permission = require("../../manager/permission");
	// Set locals
	var per = new permission();
	locals.hasPermission = false;
	locals.timezone = _config.timezone||0;
	if(req.user&&req.user.code)
		locals.hasPermission = per.HasPermisson("summary",req.user.code);
	// Load the galleries by sortOrder
	view.query('galleries', keystone.list('Gallery').model.find().sort('sortOrder'));
	
	// Render the view
	view.render('gallery');
	
};
