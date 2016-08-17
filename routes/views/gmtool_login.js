var keystone = require('keystone')
var _config  = keystone.get("_config");
exports = module.exports = function(req, res) {

	var view = new keystone.View(req, res),
		locals = res.locals;
	locals.title=_config.title;
	// Set locals
	locals.section = 'gmtoolLogin';
	locals.formData = req.body || {};

	var permission = require("../../manager/permission");
	// Set locals
	var per = new permission();
	locals.hasPermission = false;
	locals.timezone = _config.timezone||0;
	if(req.user&&req.user.code)
		locals.hasPermission = per.HasPermisson("version",req.user.code);

	locals.parm_type = keystone.get("version_version_type") || "";
    locals.parm_name = keystone.get("version_name") || "";

    if(locals.parm_type)
    {
    	if(locals.parm_type.substring(locals.parm_type.length-2)==",1")
    		locals.parm_type=locals.parm_type.substring(0,locals.parm_type.length-2) + ",client";
    	if(locals.parm_type.substring(locals.parm_type.length-2)==",2")
    		locals.parm_type=locals.parm_type.substring(0,locals.parm_type.length-2) + ",data";
    }
    if(locals.parm_name==JSON.stringify(req.user.name))
    	locals.parm_name="*";
    else if(locals.parm_name.length>0)
    	locals.parm_name="1/2"

	view.render('gmtool/login');

};
