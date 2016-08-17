var keystone = require("keystone"),
	async = require('async'),
	_ = require('underscore'),
	innLog = keystone.list("InnLog"),
	middleware = require("../routes/middleware");
	innLog_Global = keystone.list("InnLog_Global");
var util = require("util");
var statisticalManager = require("./statistical");
var _config = keystone.get("_config");

var TutorialManager = function(length){
	dlLength = length||_config.dayLeft.length;
	this.dlLength  = dlLength;
	newUsers = [];
	statisticalManager.call(this);
	var self = this;
}

util.inherits(TutorialManager,statisticalManager);

TutorialManager.prototype.dlLength = 0;
TutorialManager.prototype.save = function(){
	if (this.Tutorials.length>0) {
		var parm = {};
		parm.logDate = this.Tutorials[0].date;
		parm.daysLeft = JSON.stringify(this.Tutorials);
		parm.newuserCount = newUsers.length;
		var daysLeft = keystone.list("Tutorial");
		var oldd = daysLeft.model.remove({logDate:parm.logDate},function(){
			var newd = new daysLeft.model(parm);
			newd.save(function(err){
				if (err) {
					console.error("TutorialManager error!");
					console.error(err);
				};
			});
		});
	}else{
		console.log("TutorialManager saved warning! Tutorials is null!");
	}
}
TutorialManager.prototype.getDaysLeft = function(logDate,callback){

	var self = this;
	this.Tutorials = [];
	async.waterfall([
		function(cb){
			self.getBase(logDate,cb);
		},
		function(cb){
			var getit = function(i,logDate){
				//console.log("crruent i: %s",i);
				var currentDate = logDate + (86401*i);
				currentDate = self.showDailyBegin(currentDate);
				var now = Date.now()/1000;
				if(currentDate<=now){
					self.getLogOfPlayTime(currentDate,function(err,cdate,uids){
						if(!err){
							//console.log("cdate:%s",cdate);
							 self.Tutorials.push(self.getDate(cdate,uids));
							 if (i!=dlLength) {
							 	getit(++i,logDate);
							 }else{
							 	cb();
							 }
						}else{
							console.error("#TutorialManager[getDaysLeft] error");
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
				console.error(JSON.stringify(err));
				return;
			}
		    self.sort();
		    callback();
		});
}
// TutorialManager.prototype.dlLength = 0;
// TutorialManager.prototype.newUsers = [];//基准新用户
TutorialManager.prototype.Tutorials = [];
TutorialManager.prototype.hasfinish = function(){
	if(dlLength== this.Tutorials.length)
		return true;
	else
		return false;
}
TutorialManager.prototype.sort = function(){
	this.Tutorials = _.sortBy(this.Tutorials,function(dayleft){return dayleft.date});
}
//dlLength天数的有效登录次数日志
TutorialManager.prototype.getLogOfPlayTime = function(currentDate,next){ 
	//console.log("getLogOfPalyTime");
	var self = this;
	var firstDate = self.showDailyBegin(currentDate);
	var lastDate =   self.showDailyEnd(currentDate);
	var cb = function(err,data){
		//console.log("getLogOfPlayTime: %s \n newUserId: %s \n",JSON.stringify(data),JSON.stringify(newUsers));
		if (err) {
			console.error("#TutorialManager[getBase] err,result:%s",JSON.stringify(result));
			next(err);
		};
		var result=_.intersection(data,newUsers);

		next(null,currentDate,result);
	}
	var q = keystone.list("InnLog").model.find().where('timeStamp').gte(firstDate).where("timeStamp").lt(lastDate).where('logType','LogTime').where('logtime').gt(self.logTimeBase).where('sessionCount').gt(self.sessionCountBase).distinct("uid").exec(cb);
}
TutorialManager.prototype.getBase = function(logDate,next){
	//console.log("getBase");
	var self = this;
	var firstDate = self.showDailyBegin(logDate);
	var lastDate =self.showDailyEnd(logDate);
	var cb = function(err,result){
		if (err) {
			console.error("#TutorialManager[getBase] err,result:%s",JSON.stringify(result));
			next(err);
		};
		//console.log("getBase(%s): %s",result.length,JSON.stringify(result));
		newUsers = result;
		next();
	}
	var q = keystone.list("InnLog").model.find().where('timeStamp').gte(firstDate).where("timeStamp").lt(lastDate).where('logType','Register').distinct('uid').exec(cb);
}
//获取当天日留存率
//计算方法：当日留存的基准新用户数/基准新用户数
TutorialManager.prototype.getDate = function(currentDate,uids){
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
exports = module.exports = TutorialManager;