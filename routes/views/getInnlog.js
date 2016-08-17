var keystone = require('keystone');
var _config  = keystone.get("_config");
exports = module.exports = function(req, res) {
	locals.title=_config.title;
	locals.timezone = _config.timezone||0;
	console.log(req);	
	// var view = new keystone.View(req, res),
	// 	locals = res.locals;
	
	// // Set locals
	// locals.section = 'gallery';
	
	// // Load the galleries by sortOrder
	// view.query('galleries', keystone.list('Gallery').model.find().sort('sortOrder'));
	
	// // Render the view
	// view.render('gallery');
	
};
