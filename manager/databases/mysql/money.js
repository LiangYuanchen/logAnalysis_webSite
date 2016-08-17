var async = require('async'),
    _ = require('underscore');
var keystone = require("keystone");    
var _config = keystone.get("_config");
var winston = require("winston");
var utils = require("../../util/utils");
var connBase = require("./conn");
require("../../util/datetime");

var money = function(project_id,server_id,open_udid,ip,user_id,user_name,created_at,created_ts,serial_no,log_type,vm_type,vm_num,chain,channel,balance,currency_type,pay_price,product_id)
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
		self.data.created_ts = Math.ceil((currentDate*1000000 + nanotime)/10000);
		self.data.serial_no = serial_no;
		self.data.log_type = log_type;
		self.data.vm_type = vm_type;
		self.data.vm_num = vm_num;
		self.data.chain = chain;
		self.data.channel = channel;
		self.data.balance = balance;
		self.data.currency_type = currency_type;
		self.data.pay_price = pay_price;
		self.data.product_id = product_id;
	}
	catch(err){
		self.data = {};
	}

}

money.prototype.data = {};

money.prototype.save = function(cb){
	var conn = new connBase();
	conn.saveObj(this.data,"vir_money_logs",cb);
}

exports = module.exports = money;