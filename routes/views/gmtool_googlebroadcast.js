var keystone = require('keystone');
var _config = keystone.get("_config");
var async    = require('async');
var gameconfig = require("../../manager/GameConfigExchange");
var winston = require("winston");
exports = module.exports = function(req, res) {

	var view = new keystone.View(req, res),
		locals = res.locals;
	locals.title=_config.title;
	var permission = require("../../manager/permission");
	// Set locals
	var per = new permission();
	locals.hasPermission = false;
	if(req.user&&req.user.code)
		locals.hasPermission = per.HasPermisson("gmtool",req.user.code);
	locals.section = 'googlebroadcast';
	locals.timezone = _config.timezone||0;
	locals.formData = req.body || {};
	var gc = new gameconfig();

	view.render('gmtool/googlebroadcast');

};
