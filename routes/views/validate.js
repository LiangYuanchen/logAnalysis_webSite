var keystone = require('keystone');
var permission = require("../../manager/permission");
var _config  = keystone.get("_config");
var User = require("../../models/User");
var async    = require('async');
var _        = require("underscore");
var _config = keystone.get("_config");
exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	locals.title=_config.title;
	// Set locals
	var per = new permission();
	locals.hasPermission = false;
	if(req.user&&req.user.code)
		locals.hasPermission = per.HasPermisson("user",req.user.code);
	locals.section = 'validate';
	locals.timezone = _config.timezone||0;
	locals.formData = req.body || {};
	locals.filters = {
	      token:req.query.token
	};
	locals.host=_config.innSite.host;
	var date_now = (new Date())/1000;
   view.on('get', function(next) {
   		async.waterfall([
   		function(cb){
   			keystone.list("User").model.findOne({token:locals.filters.token,validUtil:{$gte:date_now}}).exec(function(err,result){
   				if(result)
   				{
   					locals.email = result.email;
   					locals.token = locals.filters.token;
   				}
   				cb();
   			});
   		}
   		],function(){
   			next();
   		});
   });  

   view.on("post",function(next){
   		if(req.body.password!=req.body.validate)
   		{
   			locals.validate = false;
   			next();
   			return;
   		}
         if(!req.body.token)
         {
            next();
            return;
         }
   		keystone.list("User").model.findOne({token:req.body.token}).exec(function(err,result){
   			result.password = req.body.password;
   			result.save(function(){
   				locals.validate = true;
   				res.send("<script>window.location.href=\"/keystone/signin\"</script>");
   			});
   		});
   });
	
	view.render('validate');
	
};
