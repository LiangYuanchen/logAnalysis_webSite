var async = require('async'),
    _ = require('underscore');
var keystone = require("keystone");    
var _config = keystone.get("_config");
var winston = require("winston");
var utils = require("../../util/utils");
var connBase = require("./conn");
require("../../util/datetime");

var register = function(project_id,server_id,open_udid,ip,user_id,user_name,created_at,app_id,os_version,device_name,device_id,device_id_type,locale)
{
	var self = this;
	var currentDate = new Date(created_at);
	var nanotime = process.hrtime()[1];
	try{
		self.data.project_id = project_id;
		self.data.server_id = _config.prefix + server_id;
		self.data.open_udid = open_udid || "";
		self.data.ip = ip;
		self.data.user_id = parseInt(user_id) || 0;
		self.data.user_name = user_name || "";
		self.data.created_at = currentDate.format();
		self.data.app_id = app_id;
		self.data.os_version = os_version;
		self.data.device_name = device_name;
		self.data.device_id = device_id;
		self.data.device_id_type = parseInt(device_id_type) || 1;
		self.data.locale = locale;		
	}
	catch(err){
		self.data = {};
	}

}

register.prototype.data = {};

register.prototype.save = function(cb){
	var conn = new connBase();
	conn.saveObj(this.data,"user_register_logs",cb);
}

exports = module.exports = register;