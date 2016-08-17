var keystone = require('keystone');
var _config  = keystone.get("_config");
var _ = require("underscore");
exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	locals.timezone = _config.timezone||0;
	// Set locals
	locals.section = 'gallery';
	var permission = require("../../manager/permission");
	// Set locals
	var per = new permission();
	locals.hasPermission = false;
	if(req.user&&req.user.code)
		locals.hasPermission = per.HasPermisson("summary",req.user.code);
	// Load the galleries by sortOrder
	
	var allowed = ["54.73.22.68","54.72.160.117","54.217.174.42","54.195.225.209","54.77.45.90","54.77.178.93","54.228.23.208","127.0.0.1"];

	view.on("post",function(next){
		var isAllowed = false;
		for(var i = 0;i<allowed.length; i++)
		{
			if(req.ip.indexOf(allowed[i])>-1)
			{
				isAllowed = true;
				break;
			}
		}
		console.log("data:%s,ip:%s",JSON.stringify(req.body),req.ip);
		if(!isAllowed)
		{
			res.send("isAllowed==false");
			return;
		}
		var data = req.body;

		

		data.strData = JSON.stringify(req.body);
		var flymodel = keystone.list("AppsflyerData").model;

		var mData = new flymodel(data);
		mData.save(function(err,result){
			
			res.send("isAllowed==true");
		});
	});

	
	// Render the view
	view.render('appsflyer');
};
