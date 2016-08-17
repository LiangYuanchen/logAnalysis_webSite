var async = require('async'),
    _ = require('underscore');
var keystone = require("keystone");    
var _config = keystone.get("_config");
var winston = require("winston");
var utils = require("../../util/utils");
var connBase = require("./conn");
require("../../util/datetime");
var gameconfigExchange = require("../../GameConfigExchange");

var dbipcountryManager = require("../../dbipcountryManager");
var dbipcountry = new dbipcountryManager();


var vipsMaxGem = "";

var user_register = function(options)
{
	var self = this;
	try{
		self.data.User_ID = options.uid;
		self.data.User_DvcID = options.username;
		self.data.User_Server = options.gameid;
		self.data.Crt_DT =new Date(options.logDate*1000).format();
		self.data.User_ip = options.ip;
		self.data.region_id = options.region_id;
		self.data.User_country = options.User_country;
		self.data.User_name = "";
		self.data.User_app_Ver = options.app_Ver;
		self.data.User_OS_Ver = options.OS_Ver;
		self.data.User_OS_type = options.OS_Type;
		self.data.User_local = options.User_local;
	}
	catch(err){
		self.data = {};
	}
}

user_register.prototype.data = {};

user_register.prototype.save = function(callback){
	var self =this;
	var gce = keystone.get("gameconfigExchange");
	
	async.waterfall([
		function(cb){
				if(self.data.User_country&&self.data.User_country.length>0)
				{
					cb();
					return;
				}
				dbipcountry.compare(self.data.User_ip,function(country){
					//winston.info("#manager#gameUser#over compare dbipcountry,$s",ip);
					if(country&&country.length>0)
					{
						self.data.User_country = country;					
					}
					else{
						winston.error("#database#mysql#get country error,ip:%s,country:%s",self.data.ip,country);
					}
					cb();
				});
		},
		function(cb){
			var conn = new connBase();
			conn.saveMysql(self.data,"User_Register_Logs",cb);
		}
		],function(){
			callback();
	});
}


exports = module.exports = user_register;