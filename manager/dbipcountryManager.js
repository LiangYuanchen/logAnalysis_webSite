var fs = require("fs");
var keystone = require("keystone");
var _ = require("underscore");
var async = require("async");
var readline = require("readline");
var winston = require("winston");
//需要加上title bgnip,endip,country

var dbipcountryManager = function(){
	var self = this;
	self.jsonArr = [];
	if(keystone.get("dbipcountry"))
		self.jsonArr = keystone.get("dbipcountry");
	//winston.info("#manager#dbipcountry#get dbipcountry init,jsonArr.length:%d",self.jsonArr.length);
}
dbipcountryManager.prototype.jsonArr=[];//[{bgnIP:"",endIP:"",country:"",intbgnIP:"",intendIP:""}]
dbipcountryManager.prototype.getIps=function(next)
{
	var self = this;

	if(self.jsonArr.length!=0)
	{
		winston.info("#manager#dbipcountry# true,not 0");
		next();
		return;
	}
	// if(keystone.get("lock_dbipcountry"))
	// {
	// 	winston.info("#manager#dbipcountry# locked");
	// 	process.nextTick(function(){
	// 		self.compare(ip,next);
	// 	});	
		
	// 	return;
	// }
	keystone.set("lock_dbipcountry",true);	
	winston.info("#manager#dbipcountry# getIps");
	
	async.waterfall([
		function(cb){
			winston.info("#manager#dbipcountry# load .csv file");
			var arrLogs=[];
               var filePath = "./resources/dbip-country.csv";
               var rs = fs.createReadStream(filePath);			
               var rd  = readline.createInterface({
                  input:rs,
                  output:process.stdout,
                  terminal:false
               });
               rd.on("line",function(line){
                  //"0.0.0.0","0.255.255.255","US"
                  try{
	                  var arrLine = line.replace(/\"/g,"").split(",");
	                  var linObj ={};
	                  linObj.bgnIP=arrLine[0];
	                  linObj.endIP=arrLine[1];
	                  linObj.country=arrLine[2];
	                  linObj.intbgnIP=getIntValueOfIP(linObj.bgnIP);
	                  linObj.intendIP=getIntValueOfIP(linObj.endIP);
	                  arrLogs.push(linObj);   	
	             }catch(err){
	             	winston.error("#manager#dbipcountry#logd ip file error,%s",err);
	             }
               }).on("close",function(){
               		winston.info("#manager#dbipcountry#load ip file over");
               		rs.close();
               		cb(null,arrLogs);
               });    
		}
		],function(err,arrLogs){
			if(arrLogs.length>=1)
				winston.info("#manager#dbipcountry# over handle ip file#arrs[0]:%s,length:%d",JSON.stringify(arrLogs[0]),arrLogs.length);
			else
				winston.info("#manager#dbipcountry# over handle ip file,length:%d",arrLogs.length);
			self.jsonArr = arrLogs;
			keystone.set("dbipcountry",self.jsonArr);
			keystone.set("lock_dbipcountry",false);
			winston.info("#manager#dbipcountry# getIps over");
			next();
	});
}
function getIntValueOfIP(ip){
	var arrParm = ip.split(".");
	return parseInt(arrParm[0])*256*256*256+parseInt(arrParm[1])*256*256+parseInt(arrParm[2])*256+parseInt(arrParm[3]);
}
dbipcountryManager.prototype.compare = function(ip,next)
{
	var self = this;
	var result="";
	var intIP=getIntValueOfIP(ip);

	async.waterfall([
		function(cb){
			if(self.jsonArr.length==0)
			{
				self.getIps(cb);
			}
			else
				cb();
		},
		function(cb){
			var ipObj = _.find(self.jsonArr,function(ipObj){
				return intIP<=ipObj.intendIP&&intIP>=ipObj.intbgnIP
			});
			if(ipObj)
			{
				result = ipObj.country;
				//winston.info("ipObj:%s",JSON.stringify(ipObj));
			}

			cb();
		}
		],function(){
			next(result);
	});
}
dbipcountryManager.prototype.clear = function()
{
	keystone.set("dbipcountry",null);
	this.jsonArr=[];
}
exports = module.exports = dbipcountryManager;
