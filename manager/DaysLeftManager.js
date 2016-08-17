var keystone = require("keystone"),
	async = require('async'),
	_ = require('underscore'),
	innLog = keystone.list("InnLog"),
	middleware = require("../routes/middleware");
	innLog_Global = keystone.list("InnLog_Global");
var util = require("util");
var winston = require("winston");
var manager = require("./manager");
var _config = keystone.get("_config");

var category = 0;
var tutorials = [];
var tttype = "";
var country="";
var registerType = 0;
var DaysleftManager = function(length,ca){
	dlLength = length||_config.dayLeft.length;
	country = "";
	category =ca || 0 ;
	newUsers = [];
	registerType=0;
	manager.call(this);
	var self = this;
}

util.inherits(DaysleftManager,manager);
DaysleftManager.prototype.setTutorials = function(vals){
	tutorials = vals;
}
DaysleftManager.prototype.getdlLength = function(){
	return dlLength;
}

DaysleftManager.prototype.getCategory = function()
{
	return category;
}

DaysleftManager.prototype.save = function(){
	if (this.DaysLefts.length>0) {

		var parm = {};
		parm.logDate = this.DaysLefts[0].date;
		parm.daysLeft = JSON.stringify(this.DaysLefts);
		parm.newuserCount = newUsers.length;
		parm.category = category;
		parm.sort = parm.category;
		parm.registerType=registerType;
		switch(tttype)
		{
		case "daily":
			parm.tType=1;
		break;
		case "weekly":
			parm.tType=2;
		break;
		case "monthly":
			parm.tType=3;
		break;
		default:
		break; 			
		}
		winston.info("the parms:%s",JSON.stringify(parm));
		var daysLeft = keystone.list("DaysLeft");
		//console.log("removed daysleft logdate:%s,cateogry:%s",parm.logDate,category);
		var ops={};
		//winston.info("typeof country %s,%s",typeof country,JSON.stringify(country));
		if(country)
		{
			if(typeof country != "string")
			{
				ops={logDate:parm.logDate,category:category,country:"Not_CN"};
				parm.country = "Not_CN";
				//winston.debug("debug it");
			}
			else
			{
				ops={logDate:parm.logDate,category:category,country:country};
				parm.country=country;
				//winston.info("typeof 1country %s",typeof country);
			}
		}
		else
			ops={logDate:parm.logDate,category:category,country:{$exists:false}};
		
		var oldd = daysLeft.model.find(ops).remove(function(){
			var newd = new daysLeft.model(parm);
			newd.save(function(err){
				if (err) {
					console.error("DaysLeftManager error!");
					console.error(err);
				};
				console.log("parm:%s",JSON.stringify(newd));
			});
		});
	}else{
		console.log("DaysleftManager saved warning! DaysLefts is null!");
	}
} 

DaysleftManager.prototype.getDaysLeft = function(logDate,sType,thecountry,theRegisterType,callback){
	if(sType!="daily")
		dlLength = 0;
	tttype = sType;
	var self = this;
	registerType = theRegisterType;
	country = thecountry;
	if(country=="Not_CN")
		country={$ne:"CN"};
	this.DaysLefts = [];
	async.waterfall([
		function(cb){
			self.getBase(logDate,sType,cb);
		},
		function(cb){
			var getit = function(i,logDate){
				//console.log("crruent i: %s",i);
				var currentDate = logDate + (86401*i);
				currentDate = self.showDailyBegin(currentDate);
				var now = Date.now()/1000;
				if(currentDate<=now){
					self.getLogOfPlayTime(currentDate,sType,function(err,cdate,uids){
						if(!err){
							//console.log("cdate:%s",cdate);
							 self.DaysLefts.push(self.getDate(cdate,uids));
							 if (i!=dlLength) {
							 	getit(++i,logDate);
							 }else{
							 	cb();
							 }
						}else{
							console.error("#DaysLeftManager[getDaysLeft] error");
							cb(err);
						}
					});	
				}
				else
					cb();		
			}
			getit(0,logDate);
		}
		],function(err){
			if(err){
				console.error(new Date()+"##getDaysLeft"+err);
			}
		    self.sort();
		    callback();
		});
}
// DaysleftManager.prototype.dlLength = 0;
// DaysleftManager.prototype.newUsers = [];//基准新用户
DaysleftManager.prototype.DaysLefts = [];



DaysleftManager.prototype.hasfinish = function(){
	if(dlLength== this.DaysLefts.length)
		return true;
	else
		return false;
}
DaysleftManager.prototype.sort = function(){
	this.DaysLefts = _.sortBy(this.DaysLefts,function(dayleft){return dayleft.date});
}
//dlLength天数的有效登录次数日志
DaysleftManager.prototype.getLogOfPlayTime = function(currentDate,sType,next){ 
	//console.log("getLogOfPalyTime");
	var self = this;
	var dateObj = {};
	self.getFirstAndLastDate(dateObj,sType,currentDate);
	var firstDate = dateObj.firstDate;
	var lastDate = dateObj.lastDate;
	var cb = function(err,data){
		//console.log("getLogOfPlayTime: %s \n newUserId: %s \n",JSON.stringify(data),JSON.stringify(newUsers));
		if (err) {
			console.error("#DaysleftManager[getBase] err,result:%s",JSON.stringify(result));
			next(err);
			return;
		};
		//console.log("data:%s",JSON.stringify(data));
		var result=_.intersection(data,newUsers);

		next(null,currentDate,result);
		return;
	}
	if(newUsers.length==0){
		next(null,currentDate,[]); 
		return;
	}
	//console.log("category:%s",category);
	if(category==0)
		if(country)
			var q = keystone.list("InnLog").model.find({country:country}).where('timeStamp').gte(firstDate).where("timeStamp").lt(lastDate).where('logType','LogTime').where('logtime').gt(self.logTimeBase).where('sessionCount').gt(self.sessionCountBase).distinct("uid").exec(cb);
		else
			var q = keystone.list("InnLog").model.find().where('timeStamp').gte(firstDate).where("timeStamp").lt(lastDate).where('logType','LogTime').where('logtime').gt(self.logTimeBase).where('sessionCount').gt(self.sessionCountBase).distinct("uid").exec(cb);
	else{
		//console.log("uidsAttr:%s,category:%s", JSON.stringify(newUsers),category);
		if(country)
			var q =keystone.list("InnLog").model.find({country:country}).where('timeStamp').gte(firstDate).where("timeStamp").lt(lastDate).where('logType',"Tutorial").in("uid",newUsers).where("category",category).distinct("uid").exec(cb);
		else
			var q =keystone.list("InnLog").model.find().where('timeStamp').gte(firstDate).where("timeStamp").lt(lastDate).where('logType',"Tutorial").in("uid",newUsers).where("category",category).distinct("uid").exec(cb);
	}
		//var q = keystone.list("InnLog").model.find().where("timeStamp").lt(lastDate).where('logType',"Tutorial").where('category',self.category).distinct("uid").exec(cb);
}
DaysleftManager.prototype.getNewUsers = function(){
	return newUsers;
}
DaysleftManager.prototype.getBase = function(logDate,sType,next){
	//console.log("getBase");
	var self = this;
	var dateObj = {};
	self.getFirstAndLastDate(dateObj,sType,logDate);
	var firstDate = dateObj.firstDate;
	var lastDate = dateObj.lastDate;
	var cb = function(err,result){
		if (err) {
			console.error("#DaysleftManager[getBase] err,result:%s",JSON.stringify(result));
			next(err);
			return;
		};
		//console.log("getBase(%s): %s",result.length,JSON.stringify(result));
		newUsers = result;
		next();
	}
	//console.log("dateObj:%s",JSON.stringify(dateObj));
	if(country&&registerType==0)
		var q = keystone.list("InnLog").model.find({country:country}).where('timeStamp').gte(firstDate).where("timeStamp").lt(lastDate).where('logType','Register').distinct('uid').exec(cb);
	else if(registerType==1&&country)
	{
		var q = keystone.list("InnLog").model.find({country:country}).where('timeStamp').gte(firstDate).where("timeStamp").lt(lastDate).where('logType','Register').distinct('uid').exec(function(err,uids){
			keystone.list("InnLog").model.find().where("uid").in(uids).where("logType","LogOn").distinct("uid").exec(cb);
		});		
	}
	else if(registerType==1)
	{
		var q = keystone.list("InnLog").model.find().where('timeStamp').gte(firstDate).where("timeStamp").lt(lastDate).where('logType','Register').distinct('uid').exec(function(err,uids){
			keystone.list("InnLog").model.find().where("uid").in(uids).where("logType","LogOn").distinct("uid").exec(cb);
		});		
	}
	else
		var q = keystone.list("InnLog").model.find().where('timeStamp').gte(firstDate).where("timeStamp").lt(lastDate).where('logType','Register').distinct('uid').exec(cb);
}
//获取当天日留存率
//计算方法：当日留存的基准新用户数/基准新用户数
DaysleftManager.prototype.getDate = function(currentDate,uids){
	//获取当日新用户数
	//求当日留存数量
	//求留存率
	//console.log("getDate");
	var self = this;
	var result = {};
	//console.log("getDate,uids length:%s,newUsers length:%s",uids.length,newUsers.length)
	if (newUsers.length==0) {
		result.dayLeft = 0;
	}else{
		result.dayleft = (uids.length/newUsers.length)*100;
	}
	result.date = self.showDailyBegin(currentDate);
	//console.log("getData:"+JSON.stringify(result));
	return result;
}

exports = module.exports = DaysleftManager;