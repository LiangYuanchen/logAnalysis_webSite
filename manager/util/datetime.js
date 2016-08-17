var keystone = require('keystone');
var _config  = keystone.get("_config");
var _ = require("underscore");
Date.prototype.format = function(format){ 
	if(!format)
		format = "yyyy-MM-dd hh:mm:ss";	
	var self = this;
	if(_config&&!isNaN(_config.timezone))
	{
		self = new Date((this/1000+_config.timezone*3600)*1000);
	}

	var o = { 
	"M+" : self.getUTCMonth()+1, //month 
	"d+" : self.getUTCDate(), //day 
	"h+" : self.getUTCHours(), //hour 
	"m+" : self.getUTCMinutes(), //minute 
	"s+" : self.getUTCSeconds(), //second 
	"q+" : Math.floor((self.getUTCMonth()+3)/3), //quarter 
	"S" : self.getUTCMilliseconds() //millisecond 
	} 

	if(/(y+)/.test(format)) { 
	format = format.replace(RegExp.$1, (self.getUTCFullYear()+"").substr(4 - RegExp.$1.length)); 
	} 

	for(var k in o) { 
	if(new RegExp("("+ k +")").test(format)) { 
	format = format.replace(RegExp.$1, RegExp.$1.length==1 ? o[k] : ("00"+ o[k]).substr((""+ o[k]).length)); 
	} 
	} 
	return format; 
} 	
