var keystone = require("keystone"),
	async = require('async'),
	_ = require('underscore'),
	middleware = require("../routes/middleware");
	var util = require("util");
var manager = require("./manager");


var GameErrorManager = function(){
	manager.call(this);
	var self = this;
}
util.inherits(GameErrorManager,manager);

GameErrorManager.prototype.GameErrorAdd = function(statisticalJSON,next){

	statisticalJSON.count =0;
	async.waterfall([
		function(cb){
			var getCount = function(err,count){
				statisticalJSON.count += count;
				statisticalJSON.mgrErrCount = count;
				//console.log("statisticalJSON.count:"+ statisticalJSON.count);
				cb();
			}
			var q = keystone.list("InnLog").model.find().where('timeStamp').gte(statisticalJSON.firstDate).where("timeStamp").lt(statisticalJSON.lastDate).where('logType','MgrErr').count(getCount);			
		},
		function(cb){
			//console.log("2");
			var q = keystone.list("InnLog").model.aggregate([{$match:{timeStamp:{$gte:statisticalJSON.firstDate,$lt:statisticalJSON.lastDate},logType:'HandlerErr'}},
				{$group:{_id:"$category",count:{$sum:1}}}
				]).exec(function(err,results){
					statisticalJSON.category = JSON.stringify(results);
					_.each(results,function(parm){
						statisticalJSON.count+=parm.count;
					})
					//statisticalJSON.category 拼装  和 count 赋值
				});			
		}
		],function(err){
			if (err) {
				console.error("#GameErrorManager Add,"+JSON.stringify(err));
				next(err);
				return;
			};
			//保存
			var newd = new gameError.model(statisticalJSON);
			newd.save(function(err){
				if (err) {
					next(err);
				};
				console.log("new saved GameError,"+JSON.stringify(statisticalJSON));
				next(null);
			});
	});
}
GameErrorManager.prototype.onTimeAdd = function(logDate,firstDate,lastDate,next){
	var statisticalJSON ={logDate:logDate,firstDate:firstDate,lastDate:lastDate,count:0,mgrErrCount:0,category:""};
	this.GameErrorAdd(statisticalJSON,next);
}
GameErrorManager.prototype.phaseAdd = function(sType,logDate,next){
	var statisticalJSON ={logDate:logDate,firstDate:0,lastDate:0,count:0,mgrErrCount:0,category:""};
	this.getFristAndLastDate(statisticalJSON,sType,logDate);
	this.GameErrorAdd(statisticalJSON,next);
}

exports = module.exports = GameErrorManager;