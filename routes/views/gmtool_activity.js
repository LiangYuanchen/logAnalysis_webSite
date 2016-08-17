var keystone = require('keystone'),
	async = require('async');
var _config  = keystone.get("_config");
exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	// Init locals
	locals.section = 'activity';
	locals.filters = {
		
	};
	locals.data = {
	};
	var permission = require("../../manager/permission");
	// Set locals
	var per = new permission();
	locals.hasPermission = false;
	locals.timezone = _config.timezone||0;
	if(req.user&&req.user.code)
		locals.hasPermission = per.HasPermisson("user",req.user.code);
	// Load all categories
	// view.on('init', function(next) {
		
	// });
	

	// // Load the posts
	// view.on('init', function(next) {

	// });
	
	// view.on('post', function(next) {
		
	// });

	// view.on('get', function(next) {

	// });

	// Render the view
	view.render('gmtool/activity');
	
};
