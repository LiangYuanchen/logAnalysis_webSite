var keystone = require('keystone');
var _ = require("underscore");
var permission = require("../../manager/permission");
var _config  = keystone.get("_config");
var gameconfigexchange = require("../../manager/GameConfigExchange");
var gcx = new gameconfigexchange();
exports = module.exports = function(req, res) {

	var view = new keystone.View(req, res),
		locals = res.locals;
	locals.title=_config.title;
	// Set locals
	var per = new permission();
	locals.hasPermission = false;
	locals.timezone = _config.timezone||0;
	if(req.user&&req.user.code)
		locals.hasPermission = per.HasPermisson("region",req.user.code);
	locals.section = 'gmtoolRegion';
	locals.formData = req.body || {};

	var count_regions = 0;

	if(keystone.get("count_regions"))
	{
		count_regions = keystone.get("count_regions");
		locals.region_nums = count_regions;

		view.render('gmtool/region');
	}
	else {
		gcx.getHistoryExchange({table:"regions",typeid:"typeId",value:"name",firstDate:Date.now()/1000},function(data){
			var map_regions = data;
			count_regions = (_.keys(map_regions)).length;
			keystone.set("count_regions",count_regions);
			locals.region_nums = count_regions;
			view.render('gmtool/region');
		});
	}


};
