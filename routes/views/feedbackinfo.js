var keystone = require('keystone');
var _config  = keystone.get("_config");
exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	// Set locals
	locals.section = 'feedbackinfo';
	// Set locals
	var permission = require("../../manager/permission");
	var per = new permission();
	locals.hasPermission = false;
	locals.timezone = _config.timezone||0;
	// Load the galleries by sortOrder
	locals.formatData = req.body || {};
	locals.data = {};

	view.on("get",function(next){
		var parm = req.query;
		if(!parm._id)
			return;
		keystone.list("Feedback").model.findOne({_id:parm._id}).exec(function(err,data){
			locals.data = data;
			next();
		});
	});
	
	// Render the view
	view.render('feedbackinfo');
};
